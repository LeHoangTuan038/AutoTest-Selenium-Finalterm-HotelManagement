import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, message, Tooltip, Modal, Select } from 'antd';
import { LoginOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { auditLogger } from '../../utils/auditLogger';

const { Title, Text } = Typography;

const Arrivals = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5070/api/Bookings/arrivals', { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (error) { message.error("Lỗi tải danh sách khách đến!"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleViewDetails = (record) => {
    setSelectedBooking(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenCheckIn = async (record) => {
    setSelectedBooking(record);
    if (record.assignedRoomId) {
        setSelectedRoomId(record.assignedRoomId);
        setAvailableRooms([]); 
        setIsCheckInModalOpen(true);
    } else {
        setSelectedRoomId(null);
        try {
          const res = await axios.get('http://localhost:5070/api/Reception/available-rooms');
          setAvailableRooms(res.data);
          setIsCheckInModalOpen(true);
        } catch (err) { message.error("Không tải được danh sách phòng trống!"); }
    }
  };

  const submitCheckIn = async () => {
    if (!selectedRoomId) return message.warning("Vui lòng chọn 1 phòng trống để giao cho khách!");
    try {
      await axios.post(`http://localhost:5070/api/Reception/checkin/${selectedBooking.id}`, selectedRoomId, {
        headers: { 'Content-Type': 'application/json' }
      });
      message.success(`Check-in thành công cho khách ${selectedBooking.guestName}!`);
      setIsCheckInModalOpen(false);
      fetchData(); 
    } catch (err) { message.error("Lỗi khi check-in!"); }
  };

  const columns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', render: text => <b style={{ color: '#1890ff' }}>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text || 'Khách vãng lai'}</b> },
    { title: 'Số điện thoại', dataIndex: 'guestPhone' },
    { title: 'Loại phòng', dataIndex: 'roomTypeName', render: text => <Tag color="blue">{text}</Tag> },
    { title: 'Số phòng', dataIndex: 'assignedRoomNumber', render: text => text ? <Tag color="green" style={{fontSize: 14, fontWeight: 'bold'}}>P.{text}</Tag> : <Tag color="red">Chưa gán</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', render: s => (
        <Tag color={s === 'Confirmed' ? 'cyan' : 'gold'}>{s === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}</Tag>
    )},
    { title: 'Dự kiến đến', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
    {
      title: 'Thao tác', align: 'center', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết"><Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} /></Tooltip>
          <Button 
            type="primary" 
            icon={<LoginOutlined />} 
            disabled={record.status === 'Checked_in'}
            style={{ backgroundColor: record.status === 'Confirmed' ? '#52c41a' : '#d9d9d9' }} 
            onClick={() => handleOpenCheckIn(record)}
          >
            Check-in
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 12, minHeight: '80vh' }} styles={{ body: { padding: '24px' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>🧳 Khách dự kiến đến hôm nay</Title>
        <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      {/* MODAL XEM CHI TIẾT */}
      <Modal title="Chi tiết Đặt phòng" open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>]}>
        {selectedBooking && (
          <div>
            <p><b>Mã Đơn:</b> {selectedBooking.bookingCode}</p>
            <p><b>Khách hàng:</b> {selectedBooking.guestName}</p>
            <p><b>Số điện thoại:</b> {selectedBooking.guestPhone}</p>
            <p><b>Trạng thái:</b> <Tag color="orange">{selectedBooking.status}</Tag></p>
            <p><b>Phòng đã gán:</b> {selectedBooking.assignedRoomNumber ? <Tag color="green">P.{selectedBooking.assignedRoomNumber}</Tag> : <Text type="danger">Chưa gán</Text>}</p>
            <p><b>Nhận phòng:</b> {dayjs(selectedBooking.checkInDate).format('HH:mm DD/MM/YYYY')}</p>
            <p><b>Trả phòng:</b> {dayjs(selectedBooking.checkOutDate).format('HH:mm DD/MM/YYYY')}</p>
          </div>
        )}
      </Modal>

      {/* MODAL CHECK-IN & GIAO PHÒNG - GIAO DIỆN THÔNG MINH */}
      <Modal title="Làm thủ tục Check-in" open={isCheckInModalOpen} onOk={submitCheckIn} onCancel={() => setIsCheckInModalOpen(false)} okText="Xác nhận Giao Phòng" cancelText="Hủy">
        <p>Khách hàng: <b>{selectedBooking?.guestName}</b></p>
        <div style={{ marginTop: 20 }}>
          {selectedBooking?.assignedRoomId ? (
              // NẾU ĐÃ GÁN PHÒNG
              <>
                  <Text strong>Khách đã được gán phòng từ lúc đặt:</Text>
                  <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold', marginTop: 12, textAlign: 'center', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
                      Phòng {selectedBooking.assignedRoomNumber}
                  </div>
                  <p style={{ marginTop: 16, color: '#8c8c8c', fontStyle: 'italic', textAlign: 'center' }}>
                      * Bấm "Xác nhận Giao Phòng" để hoàn tất thủ tục và tự động khóa phòng trên hệ thống.
                  </p>
              </>
          ) : (
              // NẾU CHƯA GÁN PHÒNG (KHÁCH VÃNG LAI)
              <>
                  <Text strong>Chọn phòng vật lý giao cho khách:</Text>
                  <Select 
                    style={{ width: '100%', marginTop: 8 }} 
                    placeholder="-- Chọn 1 phòng trống --"
                    onChange={(val) => setSelectedRoomId(val)}
                    options={availableRooms.map(r => ({ value: r.id, label: `Phòng số ${r.roomNumber}` }))}
                  />
              </>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default Arrivals;