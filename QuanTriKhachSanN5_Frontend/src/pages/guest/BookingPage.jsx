import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layout,
  Breadcrumb,
  Card,
  Typography,
  Space,
  List,
  Tag,
  Divider,
  Button,
  Modal,
  Form,
  Rate,
  Input,
  message,
  Spin,
  Descriptions,
  Table,
  Popconfirm,
  Row,
  Col,
  QRCode
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const BookingPage = () => {
  const [bookedRooms, setBookedRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Review Modal
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [currentReviewRoom, setCurrentReviewRoom] = useState(null);
  const [form] = Form.useForm();

  // Detail Modal
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 🚨 State cho Modal Thanh Toán (Invoice Preview)
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')) || {};
      const userEmail = storedUser?.email || localStorage.getItem('userEmail') || 'guest@hotel.com';
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5070/api/Bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("API call failed");
      
      const data = await response.json();
      
      // Filter bookings belonging to this guest
      const myBookings = data.filter(b => b.guestEmail === userEmail || b.guestName === storedUser.fullName);
      
      // We also need to get the local reviewed status
      const savedReviewsKey = `guestReviews_${userEmail}`;
      const savedReviews = localStorage.getItem(savedReviewsKey);
      let reviews = [];
      if (savedReviews) {
        try { reviews = JSON.parse(savedReviews); } catch(e){}
      }
      
      const enrichedBookings = myBookings.map(b => {
        // Find if this booking was reviewed
        const hasReviewed = reviews.some(r => r.roomId === b.id);
        return { ...b, hasReviewed };
      });
      
      setBookedRooms(enrichedBookings);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải danh sách đặt phòng từ hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const showDetailModal = async (bookingId) => {
    setIsDetailModalVisible(true);
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5070/api/Bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      setBookingDetail(data);
    } catch (err) {
      message.error("Lỗi khi tải chi tiết phòng.");
      setIsDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 🚨 HÀM XEM HÓA ĐƠN VÀ THANH TOÁN
  const handleShowInvoice = async (bookingId) => {
    setIsInvoiceModalVisible(true);
    setLoadingInvoice(true);
    try {
      const response = await fetch(`http://localhost:5070/api/Invoices/preview/${bookingId}`);
      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      setInvoicePreview(data);
    } catch (err) {
      message.error("Không thể lấy thông tin hóa đơn lúc này!");
      setIsInvoiceModalVisible(false);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleConfirmPaymentRequest = (bookingId) => {
    const savedRequests = JSON.parse(localStorage.getItem('guestPaymentRequests') || '[]');
    if (!savedRequests.includes(bookingId)) {
        localStorage.setItem('guestPaymentRequests', JSON.stringify([...savedRequests, bookingId]));
        message.success("Đã gửi yêu cầu thanh toán. Vui lòng đợi lễ tân xác nhận!");
        setIsInvoiceModalVisible(false);
        fetchBookings();
    } else {
        message.info("Bạn đã gửi yêu cầu rồi, vui lòng đợi!");
    }
  };

  const getStatusTag = (status) => {
    const map = { 
      'Pending': { c: 'orange', t: 'Chờ xác nhận' }, 
      'Confirmed': { c: 'blue', t: 'Đã xác nhận' }, 
      'Checked_in': { c: 'geekblue', t: 'Đang ở' }, 
      'Completed': { c: 'green', t: 'Đã thanh toán' }, 
      'Cancelled': { c: 'red', t: 'Đã hủy' } 
    };
    const { c, t } = map[status] || { c: 'default', t: status };
    // TÙY CHỈNH TAG SANG TRỌNG HƠN
    return <Tag color={c} style={{ borderRadius: 4, fontWeight: 'bold', padding: '2px 10px' }}>{t}</Tag>;
  };

  const showReviewModal = (room) => {
    setCurrentReviewRoom(room);
    setIsReviewModalVisible(true);
  };

  const handleReviewCancel = () => {
    setIsReviewModalVisible(false);
    setCurrentReviewRoom(null);
    form.resetFields();
  };

  const handleReviewSubmit = (values) => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const userEmail = storedUser?.email || localStorage.getItem('userEmail') || 'guest@hotel.com';
    
    // Save review
    const newReview = {
      id: Date.now(),
      roomId: currentReviewRoom.id,
      roomName: `Mã đơn: ${currentReviewRoom.bookingCode}`,
      rating: values.rating,
      comment: values.comment,
      date: new Date().toLocaleDateString('vi-VN')
    };

    const savedReviewsKey = `guestReviews_${userEmail}`;
    const savedReviews = localStorage.getItem(savedReviewsKey);
    let reviews = [];
    if (savedReviews) {
      try { reviews = JSON.parse(savedReviews); } catch (e) { reviews = []; }
    }
    localStorage.setItem(savedReviewsKey, JSON.stringify([newReview, ...reviews]));

    // Update local state to show 'Đã đánh giá'
    const updatedRooms = bookedRooms.map(r => {
      if (r.id === currentReviewRoom.id) {
        return { ...r, hasReviewed: true };
      }
      return r;
    });
    setBookedRooms(updatedRooms);

    message.success("Cảm ơn bạn đã đánh giá phòng!");
    handleReviewCancel();
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Content style={{ padding: "40px 50px" }}>
        <Breadcrumb separator=">" style={{ marginBottom: 24 }}>
          <Breadcrumb.Item>
            <Link to="/guest/dashboard">Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Lịch sử đặt phòng</Breadcrumb.Item>
        </Breadcrumb>

        <Card
          title={<Title level={4} style={{ margin: 0 }}>Lịch sử đặt phòng của tôi</Title>}
          style={{ marginTop: 24, borderRadius: 18, border: '1px solid #eee', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <Spin spinning={loading}>
            {bookedRooms.length === 0 ? (
              <Text>Chưa có phòng nào trong lịch sử đặt phòng.</Text>
            ) : (
              <List
                dataSource={bookedRooms}
                renderItem={(booking) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<b>Mã đơn: <span style={{color: '#1890ff'}}>{booking.bookingCode}</span></b>}
                      description={
                        <Space size="large" split={<Divider type="vertical" />}>
                          <Text>Từ: {dayjs(booking.checkInDate).format('DD/MM/YYYY')} - Đến: {dayjs(booking.checkOutDate).format('DD/MM/YYYY')}</Text>
                          <Text strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}</Text>
                        </Space>
                      }
                    />
                    <Space>
                      {getStatusTag(booking.status)}
                      
                      <Button icon={<EyeOutlined />} onClick={() => showDetailModal(booking.id)}>
                        Xem chi tiết
                      </Button>

                      {booking.status === 'Checked_in' && (
                        <Button type="primary" danger onClick={() => handleShowInvoice(booking.id)}>
                          Thanh toán
                        </Button>
                      )}

                      {booking.status === 'Completed' && !booking.hasReviewed && (
                        <Button type="primary" size="small" onClick={() => showReviewModal(booking)}>
                          Đánh giá
                        </Button>
                      )}
                      {booking.status === 'Completed' && booking.hasReviewed && (
                        <Tag color="purple">Đã đánh giá</Tag>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </Card>

        {/* Modal Xem Chi Tiết */}
        <Modal
          title={<Title level={4} style={{ margin: 0 }}>Chi Tiết Mã Đơn: <span style={{ color: '#1890ff' }}>{bookingDetail?.bookingCode}</span></Title>}
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[ <Button key="close" type="primary" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button> ]}
          centered
          width={700}
          destroyOnClose
        >
          <Spin spinning={loadingDetail}>
            {bookingDetail && (
              <div style={{ marginTop: 20 }}>
                <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 'bold' }}>
                  <Descriptions.Item label="Khách hàng" span={2}>{bookingDetail.guestName || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{bookingDetail.guestPhone || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">{getStatusTag(bookingDetail.status)}</Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền" span={2}>
                    <Text type="danger" strong style={{ fontSize: 16 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingDetail.totalAmount)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>

                <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Danh sách phòng đã được cấp</Title>
                <Table 
                  dataSource={bookingDetail.details} 
                  rowKey="roomNumber" 
                  pagination={false} 
                  bordered
                  size="small"
                  columns={[
                    { title: 'Số Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: t => <b style={{color: '#1890ff', fontSize: 16}}>P.{t}</b> },
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

        {/* 🚨 MODAL HÓA ĐƠN & QUÉT MÃ THANH TOÁN (QR CODE) 🚨 */}
        <Modal
          title={<Title level={4} style={{margin:0}}>Hóa Đơn Thanh Toán & Quét Mã QR</Title>}
          open={isInvoiceModalVisible}
          onCancel={() => setIsInvoiceModalVisible(false)}
          width={750}
          centered
          footer={[
            <Button key="back" onClick={() => setIsInvoiceModalVisible(false)}>Quay lại</Button>,
            <Button key="submit" type="primary" danger onClick={() => handleConfirmPaymentRequest(invoicePreview?.bookingId)}>
              Tôi đã chuyển tiền thành công
            </Button>
          ]}
        >
          <Spin spinning={loadingInvoice}>
            {invoicePreview && (
              <div style={{ padding: '10px' }}>
                <Row gutter={24}>
                  <Col span={14}>
                    <Descriptions title="Thông tin khách hàng" column={1} bordered size="small">
                      <Descriptions.Item label="Khách hàng">{invoicePreview.guestName}</Descriptions.Item>
                      <Descriptions.Item label="Mã Booking">{invoicePreview.bookingCode}</Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left" style={{fontSize: 14}}>Chi phí chi tiết</Divider>
                    <Table 
                        dataSource={[
                            { key: 'room', label: 'Tiền phòng', amount: invoicePreview.totalRoomAmount },
                            { key: 'service', label: 'Dịch vụ', amount: invoicePreview.totalServiceAmount },
                            { key: 'penalty', label: 'Phí đền bù', amount: invoicePreview.totalPenaltyAmount },
                            { key: 'tax', label: 'Thuế VAT (8%)', amount: invoicePreview.taxAmount },
                        ]}
                        pagination={false}
                        size="small"
                        showHeader={false}
                        columns={[
                            { dataIndex: 'label', key: 'label' },
                            { dataIndex: 'amount', key: 'amount', align: 'right', render: v => <b>{v?.toLocaleString()} đ</b> }
                        ]}
                    />
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Title level={3} type="danger" style={{margin:0}}>
                            TỔNG: {invoicePreview.finalTotal?.toLocaleString()} đ
                        </Title>
                    </div>
                  </Col>
                  
                  <Col span={10} style={{ textAlign: 'center', backgroundColor: '#fafafa', borderRadius: 8, padding: '20px' }}>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>QUÉT MÃ MOMO</Text>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <QRCode 
                        value={`2|99|0901234567|TEN_KHACH_SAN||0|0|${invoicePreview.finalTotal}|Thanh toan hoa don ${invoicePreview.bookingCode}`} 
                        size={180} 
                        color="#a50064"
                      />
                    </div>
                    <Text type="secondary">Chủ TK: HOTEL IT CODE</Text>
                    <br />
                    <Text type="secondary">STK: 090 123 4567</Text>
                  </Col>
                </Row>
                
                <Divider />
                <div style={{ padding: '12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
                   <Text italic>Lưu ý: Sau khi chuyển khoản thành công, bạn hãy nhấn nút <b>"Tôi đã chuyển tiền"</b> để lễ tân xác nhận và hoàn tất thủ tục trả phòng.</Text>
                </div>
              </div>
            )}
          </Spin>
        </Modal>

        {/* Modal Đánh giá */}
        <Modal
          title={`Đánh giá đơn ${currentReviewRoom?.bookingCode}`}
          open={isReviewModalVisible}
          onCancel={handleReviewCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleReviewSubmit}>
            <Form.Item
              name="rating"
              label="Đánh giá sao"
              rules={[{ required: true, message: 'Vui lòng chọn số sao!' }]}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              name="comment"
              label="Nhận xét của bạn"
              rules={[{ required: true, message: 'Vui lòng nhập nhận xét!' }]}
            >
              <TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn tại đây..." />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReviewCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  Gửi đánh giá
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default BookingPage;
