import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Tooltip, Modal, InputNumber, Select, Divider, List, Input } from 'antd';
import { PlusCircleOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { auditLogger } from '../../utils/auditLogger';

const { Title, Text } = Typography;

const InHouse = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State dùng chung
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ==========================================
  // STATE CHO MODAL THÊM DỊCH VỤ
  // ==========================================
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceId, setServiceId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [servicesList, setServicesList] = useState([]);
  const [equipmentsList, setEquipmentsList] = useState([]);

  // ==========================================
  // 🚨 STATE CHO MODAL BÁO HỎNG (ĐÃ BỔ SUNG ĐẦY ĐỦ)
  // ==========================================
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePrice, setDamagePrice] = useState(0);

  // State Modal Xem Chi Tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resInHouse = await axios.get('http://localhost:5070/api/Bookings/in-house', { headers: { Authorization: `Bearer ${token}` } });
      setData(resInHouse.data);
      const resServices = await axios.get('http://localhost:5070/api/Reception/services-list');
      setServicesList(resServices.data);
      const resEquipments = await axios.get('http://localhost:5070/api/Reception/equipments-list');
      setEquipmentsList(resEquipments.data);
    } catch (error) { auditLogger.error("Lỗi khi tải dữ liệu!", { module: "Lưu Trú (In-House)" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ==========================================
  // CÁC HÀM XỬ LÝ DỊCH VỤ
  // ==========================================
  const handleOpenService = (record) => {
    setSelectedBooking(record);
    setServiceId(null);
    setQuantity(1);
    setIsServiceModalOpen(true);
  };



  const submitOrderService = async () => {
    if (!serviceId) return auditLogger.info("Vui lòng chọn một dịch vụ!");
    try {
      await axios.post(`http://localhost:5070/api/Reception/order-service/${selectedBooking.id}`, {
        serviceId: serviceId, quantity: quantity
      });

      const service = servicesList.find(s => s.id === serviceId);
      auditLogger.success("Đã ghi sổ dịch vụ thành công!", {
        actionType: "PAYMENT",
        module: "Lưu Trú (In-House)",
        objectName: `Phòng của ${selectedBooking.guestName}`,
        description: `Ghi sổ dịch vụ: ${service?.name} x ${quantity} cho khách ${selectedBooking.guestName}.`
      });
      setIsServiceModalOpen(false);
    } catch (err) {
      auditLogger.error(err.response?.data?.message || "Lỗi khi thêm dịch vụ!", { module: "Lưu Trú (In-House)" });
    }
  };

  // ==========================================
  // 🚨 CÁC HÀM XỬ LÝ BÁO HỎNG / ĐỀN BÙ
  // ==========================================
  const handleOpenDamage = (record) => {
    setSelectedBooking(record);
    setDamageDescription('');
    setDamagePrice(0);
    setIsDamageModalOpen(true);
  };

  const submitReportDamage = async () => {
    if (!damageDescription) return auditLogger.info("Vui lòng nhập lý do (VD: Vỡ ly, Hỏng TV)!");
    if (!damagePrice || damagePrice <= 0) return auditLogger.info("Vui lòng nhập số tiền phạt hợp lệ!");

    try {
      await axios.post(`http://localhost:5070/api/Reception/report-damage/${selectedBooking.id}`, {
        description: damageDescription, 
        fineAmount: damagePrice         
      });

      auditLogger.success("Đã ghi nhận phạt đền bù thành công!", {
        actionType: "UPDATE",
        module: "Lưu Trú (In-House)",
        objectName: `Phòng của ${selectedBooking.guestName}`,
        description: `Báo hỏng đồ đạc: ${damageDescription}. Số tiền phạt: ${damagePrice.toLocaleString()} VNĐ.`
      });
      setIsDamageModalOpen(false); // Đóng Modal khi thành công
    } catch (err) {
      auditLogger.error(err.response?.data?.message || "Lỗi khi báo hỏng đồ!", { module: "Lưu Trú (In-House)" });
    }
  };

  // ==========================================
  // HÀM XEM CHI TIẾT
  // ==========================================
  const handleViewDetails = async (record) => {
    setSelectedBooking(record);
    try {
      const res = await axios.get(`http://localhost:5070/api/Invoices/preview/${record.id}`);
      setBookingDetails(res.data);
      setIsDetailModalOpen(true);
    } catch (err) { auditLogger.error("Không lấy được thông tin tiêu thụ của phòng!", { module: "Lưu Trú (In-House)" }); }
  };

  // ==========================================
  // CẤU HÌNH CỘT BẢNG
  // ==========================================
  const columns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', render: text => <b>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text || 'Khách vãng lai'}</b> },
    {
      title: 'Phòng đang ở', dataIndex: 'roomNumbers',
      render: rooms => <Space wrap>{rooms?.map(r => <Tag color="orange" key={r}>P.{r}</Tag>)}</Space>
    },
    { title: 'Ngày Check-in', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
    {
      title: 'Thao tác', align: 'center', render: (_, record) => (
        <Space>
          <Tooltip title="Xem tiêu thụ">
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          <Tooltip title="Ghi sổ dịch vụ">
            <Button type="dashed" icon={<PlusCircleOutlined />} onClick={() => handleOpenService(record)} style={{ color: '#1890ff', borderColor: '#1890ff' }}>Dịch vụ</Button>
          </Tooltip>
          {/* 🚨 NÚT BÁO HỎNG XUẤT HIỆN Ở ĐÂY */}
          <Tooltip title="Báo hỏng đồ đạc">
            <Button danger icon={<WarningOutlined />} onClick={() => handleOpenDamage(record)}>Báo hỏng</Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 12, minHeight: '80vh' }} styles={{ body: { padding: '24px' } }}>
      <Title level={4}>🛌 Khách đang lưu trú (In-House)</Title>
      <Text type="secondary">Nơi theo dõi và ghi sổ dịch vụ phát sinh cho khách.</Text>
      <Table style={{ marginTop: 20 }} columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />



      {/* MODAL GỌI DỊCH VỤ */}
      <Modal title="Ghi sổ Dịch vụ" open={isServiceModalOpen} onOk={submitOrderService} onCancel={() => setIsServiceModalOpen(false)} okText="Ghi sổ" cancelText="Hủy">
        <p>Phòng của khách: <b style={{ color: '#1890ff' }}>{selectedBooking?.guestName}</b></p>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4 }}><b>Chọn Dịch vụ:</b></div>
            <Select showSearch style={{ width: '100%' }} placeholder="-- Gõ để tìm dịch vụ --" value={serviceId} onChange={setServiceId} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={servicesList.map(s => ({ value: s.id, label: `${s.name} - ${s.price?.toLocaleString()}đ` }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}><b>Số lượng:</b></div>
            <InputNumber min={1} value={quantity} onChange={setQuantity} style={{ width: 100 }} />
          </div>
        </div>
      </Modal>

      {/* 🚨 MODAL BÁO HỎNG (MỚI THÊM) */}
      <Modal title="Báo hỏng đồ / Phạt đền bù" open={isDamageModalOpen} onOk={submitReportDamage} onCancel={() => setIsDamageModalOpen(false)} okText="Ghi nhận Phạt" okType="danger" cancelText="Hủy">
        <p>Phòng của khách: <b style={{ color: '#f5222d' }}>{selectedBooking?.guestName}</b></p>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4 }}><b>Chọn vật dụng hỏng:</b></div>
            <Select 
              showSearch 
              style={{ width: '100%' }} 
              placeholder="-- Chọn vật dụng --" 
              value={damageDescription} 
              onChange={(value) => {
                setDamageDescription(value);
                const eq = equipmentsList.find(e => e.name === value);
                if (eq) setDamagePrice(eq.price);
              }}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={equipmentsList.map(e => ({ value: e.name, label: `${e.name} - Đền bù: ${e.price?.toLocaleString()}đ` }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}><b>Số tiền phạt (VNĐ):</b></div>
            <InputNumber
              min={0}
              step={10000}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              value={damagePrice}
              onChange={setDamagePrice}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL XEM CHI TIẾT TIÊU THỤ */}
      <Modal title={`Chi tiết phòng - ${selectedBooking?.guestName}`} open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>]}>
        {bookingDetails && (
          <div>
            <p><b>Mã Đơn:</b> {bookingDetails.bookingCode}</p>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong>Ghi nhận tiêu thụ hiện tại:</Text>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 16 }}>
              <Text strong style={{ color: 'red' }}>Tổng cộng (Tạm tính):</Text>
              <Text strong style={{ color: 'red' }}>{bookingDetails.finalTotal?.toLocaleString()} đ</Text>
            </div>
            <p style={{ marginTop: 16, color: '#8c8c8c', fontStyle: 'italic', fontSize: 12 }}>* Sang trang "Trả phòng" để thực hiện xuất hóa đơn và chốt sổ.</p>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default InHouse;