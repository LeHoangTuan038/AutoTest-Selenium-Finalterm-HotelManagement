import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import {
  Layout,
  Breadcrumb,
  Card,
  Form,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Typography,
  Space,
  List,
  message,
  Tag,
  Empty,
  Spin,
  InputNumber,
  Input,
  Modal,
  QRCode,
  Descriptions
} from "antd";
import { HomeOutlined, CalendarOutlined, SearchOutlined, UserOutlined, TeamOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const RoomBookingPage = () => {
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // STATE CHO BIÊN LAI ĐẶT CỌC
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

  // STATE CHO MÃ GIẢM GIÁ
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    fetchRoomTypes();
    const today = dayjs();
    const tomorrow = today.add(2, 'day');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = storedUser.email || localStorage.getItem('userEmail') || "guest@hotel.com";

    form.setFieldsValue({ 
      date: [today, tomorrow], 
      roomType: "All",
      adults: 2,
      children: 0,
      guestName: storedUser.fullName || storedUser.userName || "Khách hàng",
      guestEmail: userEmail,
      guestPhone: storedUser.phoneNumber || "0901234567"
    });
    // ĐÃ GỠ BỎ: Không tự động tìm kiếm khi vừa vào trang
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('http://localhost:5070/api/RoomTypes/public');
      if (response.ok) {
        const data = await response.json();
        const types = data.map(t => ({ value: t.name, label: t.name }));
        setRoomTypes([{ value: "All", label: "Tất cả loại phòng" }, ...types]);
      }
    } catch (error) {
      console.error("Error fetching room types:", error);
    }
  };

  const handleSearchAuto = async (checkIn, checkOut) => {
    setLoading(true);
    try {
      const payload = {
        checkIn: checkIn.format("YYYY-MM-DDTHH:mm:ss"),
        checkOut: checkOut.format("YYYY-MM-DDTHH:mm:ss"),
        adults: 2,
        children: 0
      };

      const response = await fetch('http://localhost:5070/api/Bookings/available-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      const available = data.filter(t => t.availableRooms && t.availableRooms.length > 0);
      setAllResults(available);
      setFilteredResults(available);
      setSearched(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (values) => {
    const { date, roomType, adults, children } = values;
    if (!date || date.length !== 2) {
      message.error("Vui lòng chọn ngày nhận và trả phòng.");
      return;
    }

    setLoading(true);
    setSearched(false);
    try {
      const payload = {
        checkIn: date[0].format("YYYY-MM-DDTHH:mm:ss"),
        checkOut: date[1].format("YYYY-MM-DDTHH:mm:ss"),
        adults: adults || 1,
        children: children || 0
      };

      const response = await fetch('http://localhost:5070/api/Bookings/available-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      const availableTypes = data.filter(t => t.availableRooms && t.availableRooms.length > 0);
      setAllResults(availableTypes);
      
      if (roomType && roomType !== "All") {
        setFilteredResults(availableTypes.filter(t => t.roomTypeName === roomType));
      } else {
        setFilteredResults(availableTypes);
      }
      
      setSearched(true);
      if (availableTypes.length > 0) {
        message.success(`Đã tìm thấy ${availableTypes.length} loại phòng phù hợp!`);
      } else {
        message.warning("Không có phòng trống phù hợp với yêu cầu của bạn.");
      }
    } catch (error) {
      message.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // 🚨 HÀM MỞ BIÊN LAI XÁC NHẬN VÀ ĐẶT CỌC
  const handleOpenReceipt = async (roomTypeData) => {
    try {
      const values = await form.validateFields();
      const [checkIn, checkOut] = values.date;
      const numNights = checkOut.diff(checkIn, 'day') || 1;
      const totalPrice = roomTypeData.pricePerNight * numNights;
      const depositAmount = totalPrice * 0.3; // 30% ĐẶT CỌC

      setVoucherCodeInput("");
      setAppliedVoucher(null);
      setDiscountAmount(0);

      setPendingBookingData({
        ...roomTypeData,
        checkIn: checkIn.format('DD/MM/YYYY'),
        checkOut: checkOut.format('DD/MM/YYYY'),
        numNights,
        totalPrice,
        depositAmount,
        originalTotalPrice: totalPrice,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone
      });
      setIsReceiptVisible(true);
    } catch (error) {
      message.error("Vui lòng điền đầy đủ thông tin tìm kiếm trước khi đặt.");
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput || !voucherCodeInput.trim()) {
      message.warning("Vui lòng nhập mã giảm giá!");
      return;
    }

    try {
      const codeUpper = voucherCodeInput.trim().toUpperCase();
      const response = await fetch(`http://localhost:5070/api/Vouchers/check/${codeUpper}?totalPrice=${pendingBookingData.originalTotalPrice}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      }

      const voucher = await response.json();
      
      // Tính toán giá trị giảm dựa trên giá phòng gốc
      let discount = 0;
      if (voucher.discountType === "PERCENT") {
        discount = pendingBookingData.originalTotalPrice * (voucher.discountValue / 100);
      } else {
        discount = voucher.discountValue;
      }

      if (discount > pendingBookingData.originalTotalPrice) {
        discount = pendingBookingData.originalTotalPrice;
      }

      const newTotalPrice = pendingBookingData.originalTotalPrice - discount;
      const newDeposit = newTotalPrice * 0.3;

      setAppliedVoucher(voucher);
      setDiscountAmount(discount);
      setPendingBookingData(prev => ({
        ...prev,
        totalPrice: newTotalPrice,
        depositAmount: newDeposit
      }));

      message.success(`Áp dụng mã giảm giá ${voucher.code} thành công!`);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleRemoveVoucher = () => {
    const originalPrice = pendingBookingData.originalTotalPrice;
    const originalDeposit = originalPrice * 0.3;

    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCodeInput("");
    setPendingBookingData(prev => ({
      ...prev,
      totalPrice: originalPrice,
      depositAmount: originalDeposit
    }));
    message.info("Đã hủy áp dụng mã giảm giá.");
  };

  const handleBookRoom = async () => {
    if (!pendingBookingData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        message.warning("Vui lòng đăng nhập để đặt phòng.");
        navigate("/login");
        return;
      }

      const selectedRoomId = pendingBookingData.availableRooms[0].id;
      const [checkIn, checkOut] = form.getFieldValue('date');

      const payload = {
        guestName: pendingBookingData.guestName,
        guestPhone: pendingBookingData.guestPhone,
        guestEmail: pendingBookingData.guestEmail,
        checkIn: checkIn.format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: checkOut.format('YYYY-MM-DDTHH:mm:ss'),
        selectedRoomIds: [selectedRoomId],
        userId: storedUser.id,
        depositAmount: pendingBookingData.depositAmount,
        voucherId: appliedVoucher ? appliedVoucher.id : null
      };

      const response = await fetch('http://localhost:5070/api/Bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || "Lỗi khi tạo đơn đặt phòng.");
      }

      message.success(`Đặt phòng ${pendingBookingData.roomTypeName} thành công!`);
      setIsReceiptVisible(false);
      navigate('/guest/bookings');
    } catch (errorInfo) {
      message.error(errorInfo.message || 'Lỗi đặt phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Content style={{ padding: "40px 50px" }}>
        <Breadcrumb separator=">" style={{ marginBottom: 24 }}>
          <Breadcrumb.Item>
            <Link to="/guest/dashboard">Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Đặt phòng</Breadcrumb.Item>
        </Breadcrumb>

        <Card 
          style={{ 
            borderRadius: 18, 
            border: '1px solid #eee',
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "#fff"
          }}
        >
          <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>
            <HomeOutlined style={{ marginRight: 8, color: '#c19b4a' }} />
            Tìm phòng trống
          </Title>
          <Text type="secondary" style={{ color: '#8c8c8c' }}>
            Nhập thông tin để xem danh sách phòng còn trống cho chuyến đi của bạn.
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSearch}
            style={{ marginTop: 24 }}
          >
            <Row gutter={[24, 16]} align="bottom">
              <Col xs={24} md={8}>
                <Form.Item name="guestName" label="Họ và tên khách hàng">
                  <Input readOnly style={{ background: '#f5f5f5', color: '#595959', fontWeight: 'bold' }} prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="guestEmail" label="Địa chỉ Email">
                  <Input readOnly style={{ background: '#f5f5f5', color: '#595959', fontWeight: 'bold' }} prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="guestPhone" label="Số điện thoại">
                  <Input readOnly style={{ background: '#f5f5f5', color: '#595959', fontWeight: 'bold' }} prefix={<PhoneOutlined />} />
                </Form.Item>
              </Col>

              <Col xs={24} md={10}>
                <Form.Item
                  name="date"
                  label={<><CalendarOutlined style={{ marginRight: 4 }} />Thời gian nhận / trả</>}
                  rules={[{ required: true, message: "Chọn ngày!" }]}
                >
                  <DatePicker.RangePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} md={7}>
                <Form.Item name="roomType" label="Loại phòng ưu tiên">
                  <Select size="large" options={roomTypes} />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name="adults" label={<><UserOutlined /> NL</>}>
                  <InputNumber min={1} max={10} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name="children" label={<><TeamOutlined /> TE</>}>
                  <InputNumber min={0} max={10} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<SearchOutlined />}
                  style={{ 
                    width: "100%", height: 50, borderRadius: 10, fontSize: 18,
                    background: '#1890ff', border: 'none', fontWeight: 'bold'
                  }}
                >
                  Kiểm tra phòng trống
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* CHỈ HIỂN THỊ KẾT QUẢ KHI ĐÃ BẤM TÌM KIẾM (SEARCHED === TRUE) */}
        {searched && (
          <Card
            title={
              <span style={{ color: '#1a1a1a' }}>
                Kết quả tìm kiếm
                {filteredResults.length > 0 && (
                  <Tag color="blue" style={{ marginLeft: 8, borderRadius: 4 }}>
                    {filteredResults.reduce((acc, curr) => acc + (curr.availableRooms?.length || 0), 0)} phòng trống
                  </Tag>
                )}
              </span>
            }
            style={{ 
              marginTop: 24, 
              borderRadius: 18, 
              border: '1px solid #eee',
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "#fff"
            }}
          >
          <Spin spinning={loading}>
            {filteredResults.length === 0 && searched && !loading ? (
              <Empty description="Không tìm thấy phòng phù hợp với tiêu chí của bạn." />
            ) : (
              <List
                dataSource={filteredResults}
                renderItem={(type) => {
                  const numNights = (() => {
                    try {
                      const v = form.getFieldValue('date');
                      if (v && v[0] && v[1]) return v[1].diff(v[0], 'day');
                    } catch {}
                    return 1;
                  })();
                  const totalPrice = type.pricePerNight * numNights;

                  return (
                    <List.Item
                      actions={[
                        <Button
                          key="book"
                          type="primary"
                          size="large"
                          onClick={() => handleOpenReceipt(type)}
                          style={{ borderRadius: 8, background: '#c19b4a', border: 'none', fontWeight: 'bold' }}
                        >
                          Đặt ngay
                        </Button>
                      ]}
                      style={{ padding: '20px 0' }}
                    >
                      <List.Item.Meta
                        title={
                          <Text strong style={{ fontSize: 18 }}>
                            {type.roomTypeName}
                          </Text>
                        }
                        description={
                          <Space size="large" wrap style={{ marginTop: 8 }}>
                            <Text>
                              <UserOutlined /> Tối đa {type.capacityAdults} NL, {type.capacityChildren} TE
                            </Text>
                            <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                              {new Intl.NumberFormat('vi-VN').format(type.pricePerNight)}đ / đêm
                            </Text>
                            {numNights > 1 && (
                              <Tag color="gold">Tổng {numNights} đêm: {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ</Tag>
                            )}
                            <Tag color="green" style={{ fontSize: 14 }}>
                              Còn {type.availableRooms?.length || 0} phòng trống
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Spin>
          </Card>
        )}

        {/* 🚨 MODAL BIÊN LAI XÁC NHẬN & ĐẶT CỌC 30% 🚨 */}
        <Modal
          title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>Xác nhận đặt phòng & Đặt cọc</Title>}
          open={isReceiptVisible}
          onCancel={() => setIsReceiptVisible(false)}
          width={700}
          centered
          footer={[
            <Button key="cancel" onClick={() => setIsReceiptVisible(false)}>Hủy bỏ</Button>,
            <Button key="confirm" type="primary" loading={loading} onClick={handleBookRoom} style={{ background: '#c19b4a', border: 'none' }}>
              Xác nhận đã chuyển khoản & Đặt phòng
            </Button>
          ]}
        >
          {pendingBookingData && (
            <div style={{ padding: '10px 0' }}>
              <Row gutter={24}>
                <Col span={14}>
                  <Descriptions title="Thông tin biên lai" column={1} bordered size="small">
                    <Descriptions.Item label="Khách hàng"><b>{pendingBookingData.guestName}</b></Descriptions.Item>
                    <Descriptions.Item label="Email">{pendingBookingData.guestEmail}</Descriptions.Item>
                    <Descriptions.Item label="Loại phòng">{pendingBookingData.roomTypeName}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian">{pendingBookingData.checkIn} - {pendingBookingData.checkOut}</Descriptions.Item>
                    <Descriptions.Item label="Số đêm">{pendingBookingData.numNights} đêm</Descriptions.Item>
                  </Descriptions>

                  {/* Ô NHẬP MÃ GIẢM GIÁ */}
                  <div style={{ marginTop: 15, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa' }}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Mã giảm giá (Chỉ áp dụng trừ vào giá phòng gốc):</Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input 
                        placeholder="Nhập mã voucher..." 
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        disabled={!!appliedVoucher}
                        style={{ flex: 1 }}
                      />
                      {appliedVoucher ? (
                        <Button type="primary" danger onClick={handleRemoveVoucher}>Hủy áp dụng</Button>
                      ) : (
                        <Button type="primary" style={{ background: '#1890ff', borderColor: '#1890ff' }} onClick={handleApplyVoucher}>Áp dụng</Button>
                      )}
                    </div>
                    {appliedVoucher && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="success" style={{ fontSize: 12 }}>
                          ✓ Đã áp dụng mã <b>{appliedVoucher.code}</b>: Giảm <b>{appliedVoucher.discountType === 'PERCENT' ? `${appliedVoucher.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(appliedVoucher.discountValue)}đ`}</b> giá phòng gốc (-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ)
                        </Text>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text>Giá gốc phòng ({pendingBookingData.numNights} đêm):</Text>
                      <Text strong>{new Intl.NumberFormat('vi-VN').format(pendingBookingData.originalTotalPrice)}đ</Text>
                    </div>
                    {appliedVoucher && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#52c41a' }}>
                        <Text>Giảm giá phòng:</Text>
                        <Text strong>-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ</Text>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderTop: '1px dashed #eee', paddingTop: 8 }}>
                      <Text>Tổng tiền phòng sau giảm:</Text>
                      <Text strong>{new Intl.NumberFormat('vi-VN').format(pendingBookingData.totalPrice)}đ</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ddd', paddingTop: 8 }}>
                      <Text type="danger" strong>Số tiền cần đặt cọc (30%):</Text>
                      <Title level={4} type="danger" style={{ margin: 0 }}>
                        {new Intl.NumberFormat('vi-VN').format(pendingBookingData.depositAmount)}đ
                      </Title>
                    </div>
                  </div>
                </Col>

                <Col span={10} style={{ textAlign: 'center' }}>
                  <div style={{ padding: 15, background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>QUÉT MÃ ĐẶT CỌC (VIETQR)</Text>
                    <div style={{ background: '#fafafa', padding: 8, borderRadius: 8, display: 'inline-block', border: '1px solid #f0f0f0', marginBottom: 10 }}>
                      <img 
                        src={`https://img.vietqr.io/image/970407-000000000000-compact2.png?amount=${pendingBookingData.depositAmount}&addInfo=${encodeURIComponent(`Dat coc phong ${pendingBookingData.roomTypeName}`)}&accountName=HOTEL%20IT%20CODE`} 
                        alt="VietQR Deposit" 
                        style={{ width: 160, height: 160, objectFit: 'contain' }} 
                      />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 'bold' }}>Ngân hàng Techcombank</Text><br/>
                      <Text type="secondary" style={{ fontSize: 11 }}>Chủ TK: HOTEL IT CODE</Text><br/>
                      <Text type="secondary" style={{ fontSize: 11 }}>STK: 000000000000</Text>
                    </div>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 20, padding: '10px 15px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
                <Text italic style={{ fontSize: 13 }}>
                  * Lưu ý: Đơn đặt phòng sẽ ở trạng thái <b>"Chờ xác nhận"</b> cho đến khi bộ phận lễ tân kiểm tra giao dịch đặt cọc của bạn.
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default RoomBookingPage;
