import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Typography, message, Tag, Space, Spin,
  DatePicker, InputNumber, Divider, Modal, Form, Input, Table, Tooltip, Popconfirm, Descriptions, Alert
} from 'antd';
import {
  SearchOutlined, LeftOutlined, CheckCircleFilled, CheckOutlined,
  UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined,
  EyeOutlined, CloseCircleOutlined, LoginOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { auditLogger } from '../../utils/auditLogger';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const BookingManagement = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);

  const [bookingsList, setBookingsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // STATE CHO MODAL XEM CHI TIẾT
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [dates, setDates] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedRooms, setSelectedRooms] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const currentDeposit = Form.useWatch('depositAmount', form) || 0;

  // States cho Modal Giao phòng khi Lễ tân xác nhận đơn đặt phòng
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignBookingDetail, setAssignBookingDetail] = useState(null);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [availableRoomsForAssign, setAvailableRoomsForAssign] = useState([]);
  const [selectedRoomToAssign, setSelectedRoomToAssign] = useState(null);

  // 1. TẢI DANH SÁCH BẢNG
  const fetchBookingsList = async () => {
    setLoadingList(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5070/api/Bookings', { headers: { Authorization: `Bearer ${token}` } });
      setBookingsList(res.data);
    } catch (error) { message.error("Lỗi khi tải danh sách!"); }
    finally { setLoadingList(false); }
  };

  useEffect(() => { fetchBookingsList(); }, []);

  // 2. TÌM PHÒNG
  const handleSearch = async () => {
    if (!dates || dates.length !== 2) return message.warning("Chọn ngày nhận và trả phòng!");
    setLoading(true); setSelectedRooms([]);
    try {
      const token = localStorage.getItem('token');
      const payload = { checkIn: dates[0].format('YYYY-MM-DDTHH:mm:ss'), checkOut: dates[1].format('YYYY-MM-DDTHH:mm:ss'), adults, children };
      const res = await axios.post('http://localhost:5070/api/Bookings/available-rooms', payload, { headers: { Authorization: `Bearer ${token}` } });
      setAvailableRoomTypes(res.data);
      if (res.data.length === 0) message.info("Không còn phòng trống!"); else setCurrentStep(2);
    } catch (error) { message.error("Lỗi khi tìm phòng!"); } finally { setLoading(false); }
  };

  const toggleRoomSelection = (room, roomType) => {
    if (selectedRooms.some(r => r.id === room.id)) setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
    else setSelectedRooms([...selectedRooms, { ...room, roomTypeName: roomType.roomTypeName, pricePerNight: roomType.pricePerNight }]);
  };

  const { nights, total } = (() => {
    if (!dates || dates.length !== 2 || selectedRooms.length === 0) return { nights: 0, total: 0 };
    const n = dates[1].diff(dates[0], 'day') || 1;
    return { nights: n, total: selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0) * n };
  })();

  // 3. TẠO ĐƠN (Đã bọc thêm tiền cọc)
  const handleConfirmBooking = async (values) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { ...values, depositAmount: values.depositAmount || 0, checkIn: dates[0].format('YYYY-MM-DDTHH:mm:ss'), checkOut: dates[1].format('YYYY-MM-DDTHH:mm:ss'), selectedRoomIds: selectedRooms.map(r => r.id) };
      const res = await axios.post('http://localhost:5070/api/Bookings/create', payload, { headers: { Authorization: `Bearer ${token}` } });

      auditLogger.success(`Đặt phòng thành công cho khách ${values.guestName}!`, {
        action: 'Đặt phòng',
        actionType: 'CREATE',
        module: 'Quản lý Đặt phòng',
        objectName: `Đơn ${res.data.bookingCode}`,
        newValue: { ...values, rooms: selectedRooms.map(r => r.roomNumber) }
      });

      setIsModalVisible(false); form.resetFields(); setCurrentStep(1); setSelectedRooms([]); fetchBookingsList();
    } catch (error) { message.error("Lỗi tạo đơn!"); } finally { setSubmitting(false); }
  };

  // 4. HÀM XEM CHI TIẾT
  const handleViewDetail = async (id) => {
    setIsDetailModalVisible(true);
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5070/api/Bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setBookingDetail(res.data);
    } catch (error) {
      message.error("Lỗi khi tải chi tiết!");
      setIsDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 5. HÀM ĐỔI TRẠNG THÁI
  const handleChangeStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5070/api/Bookings/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });

      const record = bookingsList.find(b => b.id === id);
      const actionLabel = newStatus === 'Confirmed' ? 'Xác nhận' : 'Hủy';

      auditLogger.success(newStatus === 'Cancelled' ? "Đã hủy đơn đặt phòng!" : "Đã xác nhận đơn thành công!", {
        action: actionLabel,
        actionType: 'UPDATE',
        module: 'Quản lý Đặt phòng',
        objectName: `Đơn ${record?.bookingCode}`,
        newValue: { status: newStatus }
      });

      fetchBookingsList(); // Load lại bảng
    } catch (error) {
      message.error("Lỗi cập nhật trạng thái!");
    }
  };

  // Hàm mở Modal và lấy danh sách phòng trống khớp với loại phòng khách đã đặt
  const handleOpenAssignModal = async (id) => {
    setIsAssignModalVisible(true);
    setLoadingAssign(true);
    setSelectedRoomToAssign(null);
    setAvailableRoomsForAssign([]);
    setAssignBookingDetail(null);
    try {
      const token = localStorage.getItem('token');
      // 1. Lấy chi tiết đơn đặt phòng để biết loại phòng và thời gian đặt
      const detailRes = await axios.get(`http://localhost:5070/api/Bookings/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const bookingData = detailRes.data;
      setAssignBookingDetail(bookingData);

      const firstDetail = bookingData.details?.[0];
      if (firstDetail) {
        // 2. Tìm phòng trống cho thời gian này
        const payload = {
          checkIn: firstDetail.checkIn,
          checkOut: firstDetail.checkOut,
          adults: 1, // Tìm mọi phòng trống khả dụng
          children: 0
        };
        const roomsRes = await axios.post(
          'http://localhost:5070/api/Bookings/available-rooms', 
          payload, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Lọc ra các phòng trống thuộc đúng loại phòng khách chọn (bằng ID hoặc bằng Tên Loại phòng làm fallback)
        const matchedType = roomsRes.data.find(t => 
          (t.roomTypeId && firstDetail.roomTypeId && Number(t.roomTypeId) === Number(firstDetail.roomTypeId)) ||
          (t.roomTypeName?.toLowerCase() === firstDetail.roomTypeName?.toLowerCase())
        );

        let finalRooms = [];
        if (matchedType && matchedType.availableRooms) {
          finalRooms = [...matchedType.availableRooms];
        }

        // Tự động ghép phòng khách đang giữ vào danh sách lựa chọn nếu chưa có
        if (firstDetail.roomId && firstDetail.roomNumber) {
          const alreadyExists = finalRooms.some(r => r.id === firstDetail.roomId);
          const currentRoomObj = {
            id: firstDetail.roomId,
            roomNumber: firstDetail.roomNumber,
            floor: firstDetail.roomNumber ? parseInt(firstDetail.roomNumber.toString()[0]) : 1,
            isCurrent: true // Đánh dấu phòng hiện tại
          };
          if (!alreadyExists) {
            finalRooms.unshift(currentRoomObj); // Cho lên đầu danh sách
          }
          // Tự động chọn mặc định phòng hiện tại
          setSelectedRoomToAssign(currentRoomObj);
        } else {
          // Nếu chưa có phòng gán thì chọn phòng trống đầu tiên nếu có
          if (finalRooms.length > 0) {
            setSelectedRoomToAssign(finalRooms[0]);
          }
        }

        setAvailableRoomsForAssign(finalRooms);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách phòng trống tương ứng!");
    } finally {
      setLoadingAssign(false);
    }
  };

  // Hàm xác nhận giao phòng được chọn & cập nhật trạng thái đơn sang Confirmed
  const handleConfirmRoomAssignment = async () => {
    if (!selectedRoomToAssign) {
      return message.warning("Vui lòng chọn 1 phòng trống trong danh sách để giao cho khách!");
    }
    setLoadingAssign(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { roomId: selectedRoomToAssign.id };
      await axios.put(
        `http://localhost:5070/api/Bookings/${assignBookingDetail.id}/assign-room`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ghi audit log
      auditLogger.success(`Đã giao phòng P.${selectedRoomToAssign.roomNumber} và xác nhận đơn đặt phòng thành công!`, {
        action: 'Xác nhận đơn & Giao phòng',
        actionType: 'UPDATE',
        module: 'Quản lý Đặt phòng',
        objectName: `Đơn ${assignBookingDetail.bookingCode}`,
        newValue: { roomId: selectedRoomToAssign.id, roomNumber: selectedRoomToAssign.roomNumber }
      });

      message.success(`Đã giao phòng P.${selectedRoomToAssign.roomNumber} và duyệt đơn thành công!`);
      setIsAssignModalVisible(false);
      fetchBookingsList();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi giao phòng!");
    } finally {
      setLoadingAssign(false);
    }
  };

  // 🚨 HÀM DUYỆT THANH TOÁN (Xác nhận đã nhận tiền)
  const handleApprovePayment = (id) => {
    // 1. Xóa khỏi danh sách yêu cầu chờ duyệt
    const currentRequests = JSON.parse(localStorage.getItem('guestPaymentRequests') || '[]');
    const updatedRequests = currentRequests.filter(reqId => reqId !== id);
    localStorage.setItem('guestPaymentRequests', JSON.stringify(updatedRequests));

    // 2. Thêm vào danh sách đã thanh toán để CheckoutList biết
    const paidBookings = JSON.parse(localStorage.getItem('adminPaidBookings') || '[]');
    if (!paidBookings.includes(id)) {
      localStorage.setItem('adminPaidBookings', JSON.stringify([...paidBookings, id]));
    }

    const rec = bookingsList.find(b => b.id === id);
    if (rec) {
      localStorage.setItem(`bookingPrepaid_${id}`, String(rec.totalAmount));
    }

    message.success("Đã xác nhận khách thanh toán thành công! Tiền trả trước đã được cập nhật vào hệ thống.");
    fetchBookingsList();
  };

  const getStatusTag = (status) => {
    const map = { 'Pending': { c: 'gold', t: 'Chờ xác nhận' }, 'Confirmed': { c: 'cyan', t: 'Đã xác nhận' }, 'Checked_in': { c: 'geekblue', t: 'Đang ở' }, 'Completed': { c: 'green', t: 'Hoàn tất' }, 'Cancelled': { c: 'red', t: 'Đã hủy' } };
    const { c, t } = map[status] || { c: 'default', t: 'Không rõ' };
    return <Tag color={c} style={{ borderRadius: 12, padding: '2px 10px' }}>{t}</Tag>;
  };

  const tableColumns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', key: 'bookingCode', render: text => <b>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', key: 'guestName', render: text => text || 'Khách vãng lai' },
    { title: 'Ngày Check-in', dataIndex: 'checkInDate', key: 'checkInDate', render: date => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status, record) => {
        const savedRequests = JSON.parse(localStorage.getItem('guestPaymentRequests') || '[]');
        if (savedRequests.includes(record.id) && status !== 'Completed') {
          return <Tag color="orange">Yêu cầu thanh toán</Tag>;
        }
        return getStatusTag(status);
      }
    },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, record) => {
        const savedRequests = JSON.parse(localStorage.getItem('guestPaymentRequests') || '[]');
        const isPaymentRequested = savedRequests.includes(record.id) && record.status !== 'Completed';

        return (
          <Space size="middle">
            {/* Nút Xem chi tiết */}
            <Tooltip title="Xem chi tiết">
              <Button type="text" style={{ color: '#1890ff' }} icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} />
            </Tooltip>

            {/* Nút Duyệt thanh toán từ Guest */}
            {isPaymentRequested && (
              <Popconfirm title="Xác nhận đã nhận tiền thanh toán?" onConfirm={() => handleApprovePayment(record.id)} okText="Xác nhận" cancelText="Hủy">
                <Tooltip title="Duyệt thanh toán">
                  <Button type="text" style={{ color: '#52c41a' }} icon={<CheckCircleFilled />} />
                </Tooltip>
              </Popconfirm>
            )}

            {/* Nút Xác nhận (Chỉ hiện khi Pending) */}
            {record.status === 'Pending' && !isPaymentRequested && (
              <Tooltip title="Xác nhận đơn & Giao phòng">
                <Button 
                  type="text" 
                  style={{ color: '#52c41a' }} 
                  icon={<CheckOutlined />} 
                  onClick={() => handleOpenAssignModal(record.id)} 
                />
              </Tooltip>
            )}

            {/* Nút Check-in (Chỉ hiện khi Confirmed) */}
            {record.status === 'Confirmed' && (
              <Popconfirm title="Làm thủ tục nhận phòng cho khách?" onConfirm={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const detailRes = await axios.get(`http://localhost:5070/api/Bookings/${record.id}`, { headers: { Authorization: `Bearer ${token}` } });
                  const roomId = detailRes.data.details[0]?.roomId || detailRes.data.details[0]?.id; 
                  
                  await axios.post(`http://localhost:5070/api/Reception/checkin/${record.id}`, roomId, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                  });
                  message.success("Check-in thành công! Phòng đã chuyển sang trạng thái Đang ở.");
                  fetchBookingsList();
                } catch (err) { message.error("Lỗi khi check-in!"); }
              }} okText="Check-in" cancelText="Hủy">
                <Tooltip title="Nhận phòng (Check-in)">
                  <Button type="text" style={{ color: '#fa8c16' }} icon={<LoginOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}

            {/* Nút Hủy (Chặn hủy nếu đã hoàn tất hoặc đã hủy) */}
            <Popconfirm title="Bạn có chắc chắn muốn hủy đơn này?" onConfirm={() => handleChangeStatus(record.id, 'Cancelled')} okText="Hủy đơn" okButtonProps={{ danger: true }} cancelText="Quay lại">
               <Tooltip title="Hủy đơn">
                 <Button type="text" danger icon={<CloseCircleOutlined />} disabled={record.status === 'Completed' || record.status === 'Cancelled'} />
               </Tooltip>
            </Popconfirm>
          </Space>
        )
      }
    }
  ];



  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>

      {/* MÀN HÌNH 1: TÌM KIẾM */}
      {currentStep === 1 && (
        <>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }} bodyStyle={{ padding: '24px' }}>
            <Title level={4} style={{ marginTop: 0, color: '#1f1f1f' }}>Tìm phòng trống & Đặt phòng</Title>
            <div style={{ backgroundColor: '#e6f4ff', padding: '20px 24px', borderRadius: 12, marginTop: 16 }}>
              <Row gutter={24} align="bottom">
                <Col span={10}>
                  <Text strong style={{ display: 'block', marginBottom: 8, color: '#0050b3' }}>* Ngày nhận - trả phòng</Text>
                  <RangePicker
                    size="large"
                    style={{ width: '100%', borderRadius: 8 }}
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                    onChange={setDates}
                    disabledDate={(c) => c && c < dayjs().startOf('day')}
                  />
                </Col>
                <Col span={5}><Text strong style={{ display: 'block', marginBottom: 8, color: '#0050b3' }}>Người lớn</Text><InputNumber size="large" min={1} value={adults} onChange={setAdults} style={{ width: '100%', borderRadius: 8 }} /></Col>
                <Col span={5}><Text strong style={{ display: 'block', marginBottom: 8, color: '#0050b3' }}>Trẻ em</Text><InputNumber size="large" min={0} value={children} onChange={setChildren} style={{ width: '100%', borderRadius: 8 }} /></Col>
                <Col span={4}><Button type="primary" size="large" block icon={<SearchOutlined />} onClick={handleSearch} loading={loading} style={{ borderRadius: 24, fontWeight: 'bold' }}>Tìm phòng</Button></Col>
              </Row>
            </div>
          </Card>

          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: '24px' }}>
            <Title level={4} style={{ margin: '0 0 20px 0', color: '#1f1f1f' }}>Danh sách đơn đặt phòng</Title>
            <Table columns={tableColumns} dataSource={bookingsList} rowKey="id" loading={loadingList} pagination={{ pageSize: 5 }} bordered={false} />
          </Card>
        </>
      )}

      {/* MÀN HÌNH 2: CHỌN PHÒNG */}
      {currentStep === 2 && (
        <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: '80vh' }} bodyStyle={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}><Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentStep(1)} style={{ fontSize: 16, fontWeight: 'bold' }}>Chọn phòng</Button></div>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fafafa', padding: '16px 24px', border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 32 }}>
            <div style={{ flex: 1, borderRight: '1px solid #e8e8e8' }}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Nhận phòng</Text><Text strong>{dates && dates[0] ? dates[0].format('DD/MM/YYYY') : '--'}</Text></div>
            <div style={{ flex: 1, paddingLeft: 24, borderRight: '1px solid #e8e8e8' }}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Trả phòng</Text><Text strong>{dates && dates[1] ? dates[1].format('DD/MM/YYYY') : '--'}</Text></div>
            <div style={{ flex: 1, paddingLeft: 24, borderRight: '1px solid #e8e8e8' }}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Người lớn</Text><Text strong>{adults}</Text></div>
            <div style={{ flex: 1, paddingLeft: 24 }}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Trẻ em</Text><Text strong>{children}</Text></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}><Text style={{ fontSize: 14 }}>Đã chọn: <Text strong style={{ color: '#1890ff', fontSize: 16 }}>{selectedRooms.length}</Text> phòng</Text><Button type="primary" size="large" style={{ borderRadius: 24, padding: '0 32px' }} disabled={selectedRooms.length === 0} onClick={() => setIsModalVisible(true)}>Tiếp tục</Button></div>
          </div>

          <Spin spinning={loading}>
            {availableRoomTypes.map(type => (
              <div key={type.roomTypeId} style={{ marginBottom: 32 }}>
                <Text strong style={{ fontSize: 16, color: '#1890ff', display: 'block' }}>{type.roomTypeName} - {new Intl.NumberFormat('vi-VN').format(type.pricePerNight)} VNĐ/Đêm</Text>
                <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>Sức chứa: {type.capacityAdults} NL {type.capacityChildren} TE</Text>
                <Space size={[16, 16]} wrap>
                  {type.availableRooms.map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    return (
                      <div key={room.id} onClick={() => toggleRoomSelection(room, type)}
                        style={{ width: 140, padding: '16px 12px', borderRadius: 8, cursor: 'pointer', position: 'relative', border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9', backgroundColor: isSelected ? '#e6f4ff' : '#fff', textAlign: 'center' }}>
                        {isSelected && <CheckCircleFilled style={{ position: 'absolute', top: 8, right: 8, color: '#1890ff', fontSize: 16 }} />}
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: isSelected ? '#1890ff' : '#262626', marginBottom: 4 }}>P.{room.roomNumber}</div>
                        <div style={{ fontSize: 13, color: isSelected ? '#69c0ff' : '#8c8c8c' }}>{room.floor ? `Tầng ${room.floor}` : 'Không rõ'}</div>
                      </div>
                    );
                  })}
                </Space>
                <Divider style={{ margin: '24px 0 0 0' }} />
              </div>
            ))}
          </Spin>
        </Card>
      )}

      {/* MODAL TẠO ĐƠN (Gõ thông tin khách) */}
      <Modal title={<Title level={4} style={{ margin: 0 }}><HomeOutlined /> Xác nhận Đặt phòng</Title>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} centered width={600} destroyOnClose>
        <div style={{ backgroundColor: '#fffbe6', padding: 16, borderRadius: 8, border: '1px solid #ffe58f', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Tổng tiền phòng ({nights} đêm): </Text>
            <Text strong style={{ color: '#262626', fontSize: 16 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Đã cọc: </Text>
            <Text strong style={{ color: '#52c41a', fontSize: 16 }}>- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentDeposit)}</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Tiền còn lại phải thu: </Text>
            <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, total - currentDeposit))}</Text>
          </div>
        </div>

        {/* 🚨 ĐÃ THÊM: initialValues cho depositAmount = 0 */}
        <Form form={form} layout="vertical" onFinish={handleConfirmBooking} initialValues={{ depositAmount: 0 }}>

          {/* 🚨 ĐÃ THÊM: Ô nhập Tiền Đặt Cọc */}
          <Form.Item name="depositAmount" label={<Text strong style={{ color: '#52c41a' }}>Tiền đặt cọc trước (VNĐ)</Text>}>
            <InputNumber
              size="large"
              style={{ width: '100%', borderColor: '#b7eb8f' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              placeholder="Ví dụ: 500,000"
            />
          </Form.Item>

          <Form.Item name="guestName" label="Họ tên người đại diện" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}><Input size="large" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="guestPhone" label="Số điện thoại" rules={[{ required: true }]}><Input size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="guestEmail" label="Email"><Input size="large" /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting} style={{ marginTop: 12, height: 50 }}>Xác Nhận & Tạo Đơn</Button>
        </Form>
      </Modal>

      {/* MODAL XEM CHI TIẾT ĐƠN ĐẶT PHÒNG */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Chi Tiết Mã Đơn: <span style={{ color: '#1890ff' }}>{bookingDetail?.bookingCode}</span></Title>}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[<Button key="close" type="primary" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>]}
        centered
        width={700}
        destroyOnClose
      >
        <Spin spinning={loadingDetail}>
          {bookingDetail && (
            <div style={{ marginTop: 20 }}>
              <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 'bold', width: '150px' }}>
                <Descriptions.Item label="Khách hàng" span={2}>{bookingDetail.guestName || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{bookingDetail.guestPhone || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{getStatusTag(bookingDetail.status)}</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                  <Text type="danger" strong style={{ fontSize: 16 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingDetail.totalAmount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tiền trả trước">
                  <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 16 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(localStorage.getItem(`bookingPrepaid_${bookingDetail.id}`) || bookingDetail.depositAmount || 0))}
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Danh sách phòng đã đặt</Title>
              <Table
                dataSource={bookingDetail.details}
                rowKey="roomNumber"
                pagination={false}
                bordered
                size="small"
                columns={[
                  { title: 'Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: t => <b>P.{t}</b> },
                  { title: 'Loại phòng', dataIndex: 'roomTypeName', key: 'roomTypeName' },
                  { title: 'Check-in', dataIndex: 'checkIn', render: d => dayjs(d).format('DD/MM/YYYY') },
                  { title: 'Check-out', dataIndex: 'checkOut', render: d => dayjs(d).format('DD/MM/YYYY') },
                  { title: 'Giá / Đêm', dataIndex: 'pricePerNight', render: p => new Intl.NumberFormat('vi-VN').format(p) }
                ]}
              />
            </div>
          )}
        </Spin>
      </Modal>

      {/* ========================================================================= */}
      {/* 🔑 MODAL GIAO PHÒNG TRỐNG & XÁC NHẬN ĐẶT PHÒNG (PREMIUM UX) 🌟 */}
      {/* ========================================================================= */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HomeOutlined style={{ fontSize: 22, color: '#52c41a' }} />
            <span style={{ fontWeight: 'bold', fontSize: 16 }}>Giao Phòng & Xác Nhận Đơn Đặt Phòng</span>
          </div>
        }
        open={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAssignModalVisible(false)}>Hủy</Button>,
          <Button 
            key="submit" 
            type="primary" 
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
            loading={loadingAssign}
            disabled={!selectedRoomToAssign}
            onClick={handleConfirmRoomAssignment}
          >
            Giao phòng & Duyệt đơn
          </Button>
        ]}
        centered
        width={650}
        destroyOnClose
      >
        <Spin spinning={loadingAssign}>
          {assignBookingDetail && (
            <div style={{ marginTop: 15 }}>
              {/* TÓM TẮT THÔNG TIN ĐƠN ĐẶT PHÒNG */}
              <div style={{ backgroundColor: '#f5f7fa', padding: 16, borderRadius: 10, border: '1px solid #e8e8e8', marginBottom: 20 }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text type="secondary">Mã đặt phòng: </Text>
                    <Text strong code>{assignBookingDetail.bookingCode}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Khách hàng: </Text>
                    <Text strong>{assignBookingDetail.guestName}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Ngày nhận phòng: </Text>
                    <Text strong>{dayjs(assignBookingDetail.details?.[0]?.checkIn).format('DD/MM/YYYY HH:mm')}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Ngày trả phòng: </Text>
                    <Text strong>{dayjs(assignBookingDetail.details?.[0]?.checkOut).format('DD/MM/YYYY HH:mm')}</Text>
                  </Col>
                  <Col span={24}>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text type="secondary">Loại phòng đã chọn: </Text>
                    <Text strong style={{ color: '#1890ff', fontSize: 15 }}>
                      {assignBookingDetail.details?.[0]?.roomTypeName}
                    </Text>
                  </Col>
                </Row>
              </div>

              {/* DANH SÁCH PHÒNG TRỐNG KHẢ DỤNG */}
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                🔑 Chọn 1 phòng trống thích hợp để giao cho khách:
              </Text>

              {availableRoomsForAssign.length === 0 ? (
                <Alert
                  message="Không còn phòng trống khả dụng!"
                  description={`Rất tiếc, hiện tại không có phòng nào thuộc loại "${assignBookingDetail.details?.[0]?.roomTypeName}" còn trống trong khoảng thời gian này. Vui lòng kiểm tra lại tình trạng phòng hoặc nâng hạng phòng cho khách.`}
                  type="error"
                  showIcon
                />
              ) : (
                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
                  <Space size={[12, 12]} wrap>
                    {availableRoomsForAssign.map(room => {
                      const isSelected = selectedRoomToAssign?.id === room.id;
                      return (
                        <Card
                          key={room.id}
                          hoverable
                          onClick={() => setSelectedRoomToAssign(room)}
                          style={{
                            width: 130,
                            textAlign: 'center',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                            backgroundColor: isSelected ? '#f6ffed' : '#fff',
                            boxShadow: isSelected ? '0 4px 10px rgba(82,196,26,0.15)' : 'none',
                            transition: 'all 0.2s'
                          }}
                          bodyStyle={{ padding: '16px 12px' }}
                        >
                          {isSelected && (
                            <CheckCircleFilled 
                              style={{ position: 'absolute', top: 6, right: 6, color: '#52c41a', fontSize: 15 }} 
                            />
                          )}
                          <div style={{ 
                            fontSize: 18, 
                            fontWeight: 'bold', 
                            color: isSelected ? '#52c41a' : '#262626',
                            marginBottom: 4 
                          }}>
                            P.{room.roomNumber}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {room.isCurrent ? (
                              <Tag color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 4, padding: '0 4px' }}>Đang chọn</Tag>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {room.floor ? `Tầng ${room.floor}` : 'Tầng trệt'}
                              </Text>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </Space>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default BookingManagement;