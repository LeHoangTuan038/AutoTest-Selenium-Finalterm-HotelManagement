import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, message, Modal, Divider, List, Tooltip, Drawer, Steps, Checkbox, Alert, Spin } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined, EyeOutlined, RobotOutlined, ThunderboltOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import invoiceAPI from '../../api/invoiceAPI';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CheckoutList = () => {
  const [data, setData] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // State cho Modal xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Tải danh sách đơn đang lưu trú
      const res = await axios.get('http://localhost:5070/api/Bookings/in-house', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);

      // 2. Tải danh sách phòng để lấy trạng thái thực tế
      const roomsRes = await axios.get('http://localhost:5070/api/Rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomsList(roomsRes.data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách trả phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 1. XEM TRƯỚC CHI PHÍ TRƯỚC KHI TRẢ PHÒNG
  const handleViewDetails = async (record) => {
    setSelectedBooking(record);
    try {
      const res = await invoiceAPI.preview(record.id);
      setBookingDetails(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      message.error("Không lấy được thông tin tiêu thụ!");
    }
  };

  // 2. HÀM THỰC THI CHECKOUT THỰC TẾ
  const proceedWithCheckout = async (record, bookingRooms) => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Gọi API Checkout ở Backend để sinh hóa đơn
      const res = await axios.post(
        `http://localhost:5070/api/Invoices/checkout/${record.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Chuyển trạng thái các phòng sang Dirty (Chờ dọn dẹp) nếu chưa sạch
      for (const room of bookingRooms) {
        if (room.status !== 'Available') {
          await axios.put(`http://localhost:5070/api/Rooms/${room.id}/status`, JSON.stringify("Dirty"), {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      message.success("Trả phòng & Xuất hóa đơn thành công!");
      const newInvoiceId = res.data.invoiceId;
      navigate(`/admin/invoice/${newInvoiceId}`);
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi xử lý trả phòng!");
    }
  };

  // 3. XỬ LÝ CLICK NÚT TRẢ PHÒNG DUY NHẤT (ĐA TRẠNG THÁI)
  const handleCheckoutClick = (record) => {
    const bookingRooms = roomsList.filter(r => record.roomNumbers?.includes(r.roomNumber));
    const isPendingInspect = bookingRooms.some(r => r.status === 'Pending Check-out');
    const isClean = bookingRooms.every(r => r.status === 'Available');

    if (!isPendingInspect && !isClean) {
      // TRƯỜNG HỢP 1: Bắt đầu Trả phòng (Chuyển sang Đang chờ kiểm tra)
      confirm({
        title: `Xác nhận yêu cầu Trả phòng cho khách ${record.guestName}?`,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>Hệ thống sẽ đổi trạng thái phòng thành <b>"ĐANG CHỜ KIỂM TRA"</b> (Pending Check-out).</p>
            <p>🔔 Bộ phận Buồng phòng sẽ đến phòng <b>P.{record.roomNumbers?.join(', ')}</b> để tiến hành kiểm tra tài sản ngay lập tức.</p>
          </div>
        ),
        okText: 'Xác nhận & Chuyển Chờ Kiểm Tra',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            const token = localStorage.getItem('token');
            for (const room of bookingRooms) {
              await axios.put(`http://localhost:5070/api/Rooms/${room.id}/status`, JSON.stringify("Pending Check-out"), {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
            }
            message.success("Đã chuyển trạng thái phòng sang Đang Chờ Kiểm Tra! Bộ phận Buồng phòng đã được thông báo.");
            fetchData();
          } catch (err) {
            message.error("Lỗi khi chuyển trạng thái phòng!");
          }
        }
      });
    } else if (isPendingInspect) {
      // TRƯỜNG HỢP 2: Đang chờ buồng phòng kiểm tra (Lễ tân có thể đợi hoặc bỏ qua)
      confirm({
        title: `⚠️ CẢNH BÁO: Phòng đang chờ kiểm tra!`,
        icon: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
        content: (
          <div>
            <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '10px 16px', borderRadius: '8px', marginBottom: 12 }}>
              <span style={{ color: '#d46b08', fontWeight: 'bold' }}>⏳ ĐANG CHỜ BUỒNG PHÒNG:</span> Buồng phòng <b>ĐANG TIẾN HÀNH KIỂM TRA</b> phòng của khách này.
            </div>
            <p>Nhân viên Buồng phòng đang kiểm tra tài sản thực tế. Nếu muốn thanh toán gấp cho khách mà không cần đợi kết quả kiểm tra, hãy nhấn Xác nhận.</p>
            <p>Bạn có chắc chắn muốn bỏ qua để thanh toán, xuất hóa đơn trả phòng ngay không?</p>
          </div>
        ),
        okText: 'Bỏ qua & Trả phòng ngay',
        okType: 'danger',
        cancelText: 'Quay lại',
        onOk: async () => {
          await proceedWithCheckout(record, bookingRooms);
        }
      });
    } else {
      // TRƯỜNG HỢP 3: Đã dọn sạch & kiểm tra xong -> Tiến hành xuất hóa đơn
      confirm({
        title: `Hoàn tất Trả phòng cho khách ${record.guestName}?`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: (
          <div>
            <p>Phòng <b>P.{record.roomNumbers?.join(', ')}</b> đã được Buồng phòng kiểm tra và xác nhận sạch sẽ.</p>
            <p>Hệ thống sẽ tiến hành kết xuất hóa đơn cuối cùng (đã bao gồm các chi phí phát sinh nếu có).</p>
          </div>
        ),
        okText: 'Xuất hóa đơn & Tất toán',
        okType: 'primary',
        cancelText: 'Hủy',
        onOk: async () => {
          await proceedWithCheckout(record, bookingRooms);
        }
      });
    }
  };

  const columns = [
    {
      title: 'Mã Booking',
      dataIndex: 'bookingCode',
      render: text => <b>{text}</b>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'guestName',
      render: text => <b>{text}</b>
    },
    {
      title: 'Phòng & Trạng thái kiểm tra',
      dataIndex: 'roomNumbers',
      render: (rooms, record) => (
        <Space wrap>
          {rooms?.map(roomNum => {
            // Tìm trạng thái phòng thực tế từ roomsList
            const roomObj = roomsList.find(r => r.roomNumber === roomNum);
            const status = roomObj?.status;
            
            let color = 'default';
            let label = `P.${roomNum}`;

            if (status === 'Pending Check-out') {
              color = 'gold';
              label = `P.${roomNum} (Đang chờ kiểm tra ⏳)`;
            } else if (status === 'Available') {
              color = 'green';
              label = `P.${roomNum} (Đã kiểm tra xong ✅)`;
            } else if (status === 'Dirty') {
              color = 'orange';
              label = `P.${roomNum} (Chờ dọn dẹp 🧹)`;
            } else {
              color = 'blue';
              label = `P.${roomNum} (Khách đang ở 🔑)`;
            }

            return (
              <Tag 
                color={color} 
                key={roomNum} 
                style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, fontWeight: 'bold' }}
              >
                {label}
              </Tag>
            );
          })}
        </Space>
      )
    },
    {
      title: 'Ngày Check-in',
      dataIndex: 'checkInDate',
      render: date => dayjs(date).format('HH:mm - DD/MM')
    },
    {
      title: 'Quy trình xử lý Trả phòng',
      align: 'center',
      render: (_, record) => {
        const bookingRooms = roomsList.filter(r => record.roomNumbers?.includes(r.roomNumber));
        const isPendingInspect = bookingRooms.some(r => r.status === 'Pending Check-out');
        const isClean = bookingRooms.every(r => r.status === 'Available');

        return (
          <Space>
            <Tooltip title="Xem trước hóa đơn tạm tính">
              <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
                Xem chi phí
              </Button>
            </Tooltip>
            
            {/* Nút 1: Yêu cầu Buồng phòng đi kiểm tra (Chỉ hiện khi chưa gửi yêu cầu) */}
            {!isPendingInspect && !isClean && (
              <Button
                type="primary"
                style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
                onClick={() => handleCheckoutClick(record)}
              >
                🔔 Yêu cầu kiểm phòng
              </Button>
            )}

            {/* Nút 2: Tiến hành Trả phòng & Xuất hóa đơn */}
            <Button
              type="primary"
              danger={!isClean}
              style={{ 
                backgroundColor: isClean ? '#52c41a' : undefined, 
                borderColor: isClean ? '#52c41a' : undefined 
              }}
              icon={<LogoutOutlined />}
              onClick={() => handleCheckoutClick(record)}
            >
              {isClean ? 'Xuất hóa đơn & Trả phòng' : 'Trả phòng ngay'}
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Card style={{ borderRadius: 12, minHeight: '80vh' }} styles={{ body: { padding: '24px' } }}>
      <Title level={4}>🚪 Xử lý Trả phòng (Checkout)</Title>
      <Table
        style={{ marginTop: 20 }}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      {/* MODAL XEM CHI TIẾT TRƯỚC KHI TRẢ PHÒNG */}
      <Modal
        title={`📋 Xem trước hóa đơn - ${selectedBooking?.guestName}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>,
          <Button
            key="checkout"
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={() => {
              setIsDetailModalOpen(false);
              handleCheckoutClick(selectedBooking);
            }}
          >
            Tiến hành Trả phòng
          </Button>
        ]}
      >
        {bookingDetails && (
          <div>
            <Text strong>Tóm tắt chi phí tính đến hiện tại:</Text>
            <List
              size="small"
              bordered
              style={{ marginTop: 10 }}
              dataSource={[
                { title: 'Tiền phòng', amount: bookingDetails.totalRoomAmount },
                { title: 'Tiền Dịch vụ', amount: bookingDetails.totalServiceAmount },
                { title: 'Tiền Phạt / Đền bù', amount: bookingDetails.totalPenaltyAmount },
                { title: 'Thuế (VAT 8%)', amount: bookingDetails.taxAmount },
                ...(bookingDetails.depositAmount > 0 ? [{ title: 'Tiền đặt cọc (Đã trừ)', amount: -bookingDetails.depositAmount }] : []),
              ]}
              renderItem={item => (
                <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.title}</span>
                  <b style={{ color: item.title === 'Tiền Phạt / Đền bù' && item.amount > 0 ? '#f5222d' : item.title.includes('đặt cọc') ? '#52c41a' : 'inherit' }}>
                    {item.amount > 0 ? item.amount?.toLocaleString() : item.amount?.toLocaleString()} đ
                  </b>
                </List.Item>
              )}
            />
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
              <Text strong style={{ color: '#f5222d' }}>TỔNG THANH TOÁN:</Text>
              <Text strong style={{ color: '#f5222d' }}>{bookingDetails.finalTotal?.toLocaleString()} đ</Text>
            </div>
          </div>
        )}
      </Modal>

    </Card>
  );
};

export default CheckoutList;
