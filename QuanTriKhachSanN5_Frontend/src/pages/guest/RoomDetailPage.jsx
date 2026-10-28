import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, Typography, Row, Col, Button, Rate, 
  Avatar, List, Divider, Form, Input, message, 
  Spin, Tag, Card, Space, Breadcrumb
} from 'antd';
import { 
  UserOutlined, StarFilled, ArrowLeftOutlined, 
  SafetyOutlined, CheckCircleOutlined, CommentOutlined,
  HomeOutlined, AppstoreOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const COLORS = {
  gold: "#c19b4a",
  dark: "#1a1a1a",
  gray: "#8c8c8c",
  lightBg: "#f8f9fa",
  white: "#ffffff",
  border: "#eeeeee"
};

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roomType, setRoomType] = useState(null);
  const [roomPost, setRoomPost] = useState(null); // THÊM STATE CHO BÀI VIẾT TỪ BẢNG POSTS
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(userStr));
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Lấy thông tin loại phòng
      const roomRes = await axios.get(`${import.meta.env.VITE_API_URL}/RoomTypes/${id}`);
      setRoomType(roomRes.data);

      // 2. Lấy bài viết từ bảng POSTS dựa trên RoomTypeId
      try {
        const postRes = await axios.get(`${import.meta.env.VITE_API_URL}/Posts/roomtype/${id}`);
        setRoomPost(postRes.data);
      } catch (postErr) {
        console.warn("Không tìm thấy bài viết riêng trong bảng Posts, sẽ dùng mô tả mặc định.");
      }

      // 3. Lấy danh sách đánh giá
      const reviewsRes = await axios.get(`${import.meta.env.VITE_API_URL}/Reviews/roomtype/${id}`);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Không thể tải thông tin phòng.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (values) => {
    if (!isLoggedIn) {
      message.warning("Vui lòng đăng nhập để gửi đánh giá.");
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/Reviews`, {
        roomTypeId: parseInt(id),
        rating: values.rating,
        comment: values.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success("Cảm ơn bạn đã gửi đánh giá!");
      form.resetFields();
      fetchData(); // Tải lại danh sách
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Gửi đánh giá thất bại. Vui lòng kiểm tra xem bạn đã từng ở phòng này chưa.";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!roomType) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Loại phòng không tồn tại.</div>;

  return (
    <Layout style={{ background: COLORS.white, minHeight: '100vh' }}>
      
      {/* 1. HEADER / NAVIGATION */}
      <div style={{ padding: '20px 80px', background: COLORS.lightBg, borderBottom: `1px solid ${COLORS.border}` }}>
        <Breadcrumb items={[
          { title: <a href="/homepage"><HomeOutlined /></a> },
          { title: <a href="/rooms">Phòng nghỉ</a> },
          { title: roomType.name }
        ]} />
      </div>

      <Content style={{ padding: '40px 80px' }}>
        <Row gutter={[60, 40]}>
          
          {/* CỘT TRÁI: BÀI VIẾT & HÌNH ẢNH */}
          <Col xs={24} lg={16}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/rooms')}
                style={{ marginBottom: 20, border: 'none', background: 'transparent', padding: 0 }}
              >
                Quay lại danh sách
              </Button>
              
              <Title level={1} style={{ fontFamily: "'Noto Serif', serif", marginBottom: 10 }}>
                {roomPost?.title || roomType.name}
              </Title>
              <Space size={20} style={{ marginBottom: 30 }}>
                <Rate disabled defaultValue={4.9} style={{ color: COLORS.gold, fontSize: 16 }} />
                <Text style={{ color: COLORS.gray }}>({reviews.length} đánh giá thực tế)</Text>
                <Tag color="gold" icon={<SafetyOutlined />}>Đã xác minh</Tag>
              </Space>

              {/* Banner Image */}
              <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <img 
                  src={roomType.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2000"} 
                  alt={roomType.name} 
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                />
              </div>

              {/* Nội dung bài viết */}
              <div style={{ fontSize: 16, lineHeight: '1.8', color: '#444' }}>
                <Title level={3} style={{ fontFamily: "'Noto Serif', serif", marginBottom: 20 }}>Giới thiệu về trải nghiệm</Title>
                
                {/* ƯU TIÊN HIỂN THỊ NỘI DUNG TỪ BẢNG POSTS */}
                {roomPost?.content ? (
                   <div children={<div data-color-mode="light"><MDEditor.Markdown source={roomPost.content} style={{ background: 'transparent' }} /></div>} />
                ) : roomType.content ? (
                   <div dangerouslySetInnerHTML={{ __html: roomType.content }} />
                ) : (
                  <Paragraph>
                    Chào mừng bạn đến với {roomType.name}. Đây là không gian được thiết kế tỉ mỉ để mang lại sự thoải mái tối đa cho quý khách. 
                    Với diện tích {roomType.sizeSqm}m², phòng được trang bị đầy đủ các tiện nghi hiện đại như TV màn hình phẳng, minibar, 
                    và kết nối Wi-Fi tốc độ cao. Tầm nhìn hướng ra {roomType.viewType || 'thành phố'} sẽ mang lại những giây phút thư giãn tuyệt vời.
                  </Paragraph>
                )}
                
                <Divider style={{ margin: '40px 0' }} />
                
                <Title level={3} style={{ fontFamily: "'Noto Serif', serif", marginBottom: 20 }}>Tiện ích nổi bật</Title>
                <Row gutter={[20, 20]}>
                  {['Wifi miễn phí', 'Minibar', 'Điều hòa nhiệt độ', 'Bồn tắm cao cấp', 'Két sắt an toàn', 'Dịch vụ phòng 24/7'].map((amenity, i) => (
                    <Col span={8} key={i}>
                      <Space>
                        <CheckCircleOutlined style={{ color: COLORS.gold }} />
                        <Text>{amenity}</Text>
                      </Space>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* PHẦN ĐÁNH GIÁ (REVIEWS SECTION) */}
              <div id="reviews-section" style={{ marginTop: 80 }}>
                <Divider orientation="left" style={{ margin: '0 0 40px' }}>
                  <Title level={2} style={{ fontFamily: "'Noto Serif', serif", margin: 0 }}>Đánh giá của khách hàng</Title>
                </Divider>

                <List
                  itemLayout="horizontal"
                  dataSource={reviews}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '30px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                      <List.Item.Meta
                        avatar={<Avatar size={50} src={item.userAvatar} icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 16 }}>{item.username}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.gray }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 5 }}>
                            <Rate disabled defaultValue={item.rating} style={{ fontSize: 12, color: COLORS.gold, marginBottom: 10, display: 'block' }} />
                            <Text style={{ color: COLORS.dark, fontSize: 15, lineHeight: 1.6 }}>{item.comment}</Text>
                            {item.isVerified && (
                              <div style={{ marginTop: 10 }}>
                                <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 4, fontSize: 11 }}>Đã thanh toán & Trải nghiệm</Tag>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.gray }}>Chưa có đánh giá nào cho loại phòng này.</div> }}
                />

                {/* FORM GỬI ĐÁNH GIÁ */}
                <Card style={{ marginTop: 60, borderRadius: 16, border: `1px solid ${COLORS.gold}33`, background: '#fffcf5' }}>
                  <Title level={4} style={{ fontFamily: "'Noto Serif', serif", marginBottom: 20 }}>
                    <CommentOutlined style={{ color: COLORS.gold, marginRight: 10 }} />
                    Chia sẻ trải nghiệm của bạn
                  </Title>
                  <Paragraph style={{ color: COLORS.gray, fontSize: 13, marginBottom: 25 }}>
                    Lưu ý: Chỉ những khách hàng đã từng đặt và thanh toán cho loại phòng này mới có thể gửi đánh giá thành công.
                  </Paragraph>
                  
                  <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
                    <Form.Item 
                      name="rating" 
                      label={<Text strong>Xếp hạng của bạn</Text>}
                      rules={[{ required: true, message: 'Vui lòng chọn số sao!' }]}
                    >
                      <Rate style={{ color: COLORS.gold, fontSize: 28 }} />
                    </Form.Item>
                    
                    <Form.Item 
                      name="comment" 
                      label={<Text strong>Bình luận chi tiết</Text>}
                      rules={[{ required: true, message: 'Vui lòng viết cảm nhận của bạn!' }]}
                    >
                      <TextArea rows={4} placeholder="Hãy chia sẻ về phòng nghỉ, dịch vụ, nhân viên..." style={{ borderRadius: 8 }} />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={submitting}
                        style={{ background: COLORS.dark, border: 'none', height: 45, padding: '0 40px', borderRadius: 8, fontWeight: 'bold' }}
                      >
                        GỬI ĐÁNH GIÁ
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </motion.div>
          </Col>

          {/* CỘT PHẢI: WIDGET ĐẶT PHÒNG NHANH */}
          <Col xs={24} lg={8}>
            <div style={{ position: 'sticky', top: 120 }}>
              <Card style={{ borderRadius: 20, boxShadow: '0 15px 40px rgba(0,0,0,0.08)', border: `1px solid ${COLORS.border}` }}>
                <Title level={4} style={{ marginBottom: 5 }}>Giá phòng chỉ từ</Title>
                <Title level={2} style={{ color: COLORS.gold, marginTop: 0, marginBottom: 20 }}>
                  {new Intl.NumberFormat('vi-VN').format(roomType.basePrice)}đ <Text style={{ fontSize: 14, color: COLORS.gray, fontWeight: 400 }}>/ đêm</Text>
                </Title>
                
                <Divider style={{ margin: '20px 0' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.gray }}>Sức chứa:</Text>
                    <Text strong>{roomType.capacityAdults} người lớn, {roomType.capacityChildren} trẻ em</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.gray }}>Diện tích:</Text>
                    <Text strong>{roomType.sizeSqm} m²</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.gray }}>Loại giường:</Text>
                    <Text strong>{roomType.bedType || 'King Size'}</Text>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  block 
                  size="large"
                  onClick={() => navigate(`/guest/book-room?roomId=${roomType.id}&roomName=${encodeURIComponent(roomType.name)}&price=${roomType.basePrice}`)}
                  style={{ background: COLORS.dark, border: 'none', height: 55, fontSize: 16, fontWeight: 'bold', borderRadius: 12 }}
                >
                  ĐẶT PHÒNG NGAY
                </Button>
                
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <Text style={{ fontSize: 12, color: COLORS.gray }}>
                    <SafetyOutlined /> Cam kết giá tốt nhất & Đặt phòng an toàn
                  </Text>
                </div>
              </Card>

              {/* Thông tin liên hệ nhanh */}
              <div style={{ marginTop: 30, padding: '0 10px' }}>
                <Text style={{ display: 'block', marginBottom: 10, fontSize: 12, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 1 }}>Cần hỗ trợ?</Text>
                <Text strong style={{ fontSize: 18, color: COLORS.dark }}>Hotline: 1900 1234</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default RoomDetailPage;
