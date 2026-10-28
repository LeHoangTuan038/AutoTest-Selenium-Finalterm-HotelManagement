import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Avatar, 
  Button, 
  Upload, 
  message, 
  Typography, 
  Form, 
  Input, 
  Space, 
  Tag, 
  Layout, 
  Breadcrumb, 
  Divider, 
  Modal, 
  DatePicker, 
  Tabs, 
  List, 
  Badge,
  Row,
  Col,
  Descriptions
} from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  KeyOutlined, 
  LockOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  GiftOutlined, 
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
  CalendarOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axios';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { authAPI } from '../../api/authApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Content } = Layout;

export const UserProfilePage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('1');
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = useAdminAuthStore(state => state.user);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Form states
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Changing password states
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Fetch profile and notifications
  const fetchProfileAndNotifications = async () => {
    try {
      const res = await axiosClient.get('/Auth/profile');
      if (res.data) {
        setProfile(res.data);
        
        // Cập nhật thông tin cục bộ ở localStorage để đồng bộ thanh header/sidebar
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ 
          ...storedUser, 
          fullName: res.data.fullName,
          phone: res.data.phone,
          address: res.data.address,
          avatarUrl: res.data.avatarUrl,
          points: res.data.points,
          rank: res.data.membership?.tierName || 'Khách Mới'
        }));
        localStorage.setItem('userName', res.data.fullName);
        if (res.data.avatarUrl) {
          localStorage.setItem('avatarUrl', res.data.avatarUrl);
        }
      }

      const notifRes = await axiosClient.get('/Notifications');
      setNotifications(notifRes.data);

      const unreadRes = await axiosClient.get('/Notifications/unread-count');
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error('Lỗi khi tải thông tin hồ sơ:', error);
      message.error('Không thể kết nối đến máy chủ để tải thông tin hồ sơ!');
    }
  };

  useEffect(() => {
    fetchProfileAndNotifications();

    // Đọc query param từ URL để kích hoạt tab thư nếu có
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'mailbox') {
      setActiveTab('2');
    }
  }, [location]);

  // Open Edit Profile Modal
  const openEditModal = () => {
    if (profile) {
      editForm.setFieldsValue({
        fullName: profile.fullName,
        phone: profile.phone || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      });
      setIsEditModalOpen(true);
    }
  };

  // Save Edit Profile
  const handleSaveProfile = async (values) => {
    setSaving(true);
    try {
      await axiosClient.put('/Auth/profile', {
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
      });
      message.success('Cập nhật thông tin cá nhân thành công!');
      setIsEditModalOpen(false);
      fetchProfileAndNotifications();
    } catch (error) {
      console.error(error);
      message.error('Cập nhật thông tin cá nhân thất bại!');
    } finally {
      setSaving(false);
    }
  };

  // Upload Custom Avatar in Modal
  const handleUploadAvatar = async ({ file }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update DB
      await axiosClient.put('/Auth/profile', {
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth,
        avatarUrl: res.data.url
      });

      message.success('Cập nhật ảnh đại diện thành công!');
      fetchProfileAndNotifications();
    } catch (error) {
      console.error(error);
      message.error('Upload ảnh đại diện thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await authAPI.changePasswordSendOtp();
      message.success('Đã gửi mã OTP xác nhận về email của bạn!');
      setOtpSent(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (values) => {
    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        otp: values.otp
      });
      message.success('Đổi mật khẩu thành công!');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
      setOtpSent(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setChangingPassword(false);
    }
  };

  // Open notification modal and mark as read
  const handleOpenNotification = async (item) => {
    setSelectedNotif(item);
    setIsNotifModalOpen(true);

    if (!item.isRead) {
      try {
        await axiosClient.put(`/Notifications/${item.id}/read`);
        fetchProfileAndNotifications();
      } catch (err) {
        console.error('Lỗi khi đánh dấu đã đọc thư:', err);
      }
    }
  };

  // Copy Voucher Code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã giảm giá: ${code}`);
  };

  if (!profile) return <div style={{ padding: 60, textAlign: 'center' }}><Badge status="processing" text="Đang tải thông tin hồ sơ..." /></div>;

  const currentAvatar = profile.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(profile.email)}`;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: "'Inter', sans-serif" }}>
      <Content style={{ padding: '30px 50px' }}>
        <Breadcrumb separator=">" style={{ marginBottom: 24 }}>
          <Breadcrumb.Item>
            <Link to="/homepage">Trang chủ</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Cài đặt tài khoản</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[24, 24]} style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Cột trái: Card Tóm tắt thông tin */}
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', textAlign: 'center', height: '100%' }}>
              <Avatar
                size={110}
                src={currentAvatar}
                icon={<UserOutlined />}
                style={{ marginBottom: 16, border: '3px solid #e6b83b', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              />
              
              <div style={{ marginTop: 12 }}>
                <Title level={4} style={{ marginBottom: 4, fontWeight: 700 }}>{profile.fullName}</Title>
                <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 16 }}>{profile.email}</Text>
                
                <Tag color="gold" style={{ fontSize: 14, padding: '5px 16px', borderRadius: 20, fontWeight: 600, border: '1px solid #d97706' }}>
                  🏆 {profile.membership?.tierName || 'Khách Mới'}
                </Tag>
              </div>

              <div style={{ marginTop: 24, textAlign: 'left', background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Text style={{ fontSize: 13 }}><PhoneOutlined style={{ color: '#c19b4a' }} /> <b>SĐT:</b> {profile.phone || 'Chưa cập nhật'}</Text>
                  <Text style={{ fontSize: 13 }}><EnvironmentOutlined style={{ color: '#c19b4a' }} /> <b>Địa chỉ:</b> {profile.address || 'Chưa cập nhật'}</Text>
                  <Text style={{ fontSize: 13 }}><CalendarOutlined style={{ color: '#c19b4a' }} /> <b>Ngày sinh:</b> {profile.dateOfBirth ? dayjs(profile.dateOfBirth).format('DD/MM/YYYY') : 'Chưa cập nhật'}</Text>
                  <Text style={{ fontSize: 13 }}><GiftOutlined style={{ color: '#c19b4a' }} /> <b>Điểm tích lũy:</b> <Text strong style={{ color: '#d97706' }}>{profile.points} điểm</Text></Text>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Cột phải: Form Chi tiết & Hộp thư */}
          <Col xs={24} md={16}>
            <Card style={{ borderRadius: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', minHeight: 460 }}>
              <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                
                {/* TAB 1: XEM PROFILE (READ-ONLY) + CÁC NÚT ĐIỀU HÀNH */}
                <Tabs.TabPane tab={<span><UserOutlined />Thông tin cá nhân</span>} key="1">
                  <div style={{ padding: '12px 4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Thông Tin Cá Nhân Chi Tiết</Title>
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={openEditModal}
                        style={{ borderRadius: 8, background: '#e6b83b', borderColor: '#e6b83b', color: '#1f2937', fontWeight: 600 }}
                      >
                        Chỉnh sửa hồ sơ
                      </Button>
                    </div>

                    <Descriptions bordered column={1} labelStyle={{ fontWeight: 600, background: '#f8fafc', width: '30%' }} contentStyle={{ background: '#fff' }}>
                      <Descriptions.Item label="Họ và tên">
                        <Text strong style={{ fontSize: 15 }}>{profile.fullName}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ Email">
                        <Text>{profile.email}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">
                        <Text>{profile.phone || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa cập nhật</span>}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày sinh">
                        <Text>{profile.dateOfBirth ? dayjs(profile.dateOfBirth).format('DD/MM/YYYY') : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa cập nhật</span>}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ cư trú">
                        <Text>{profile.address || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa cập nhật</span>}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Cấp độ thành viên">
                        <Tag color="gold" style={{ fontWeight: 600 }}>{profile.membership?.tierName || 'Khách Mới'}</Tag>
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 28, textAlign: 'center' }}>
                      <Button 
                        type="default" 
                        icon={<LockOutlined />} 
                        onClick={() => {
                          setIsPasswordModalOpen(true);
                          passwordForm.resetFields();
                          setOtpSent(false);
                        }} 
                        style={{ borderRadius: 8, height: 40 }}
                      >
                        Yêu cầu đổi mật khẩu tài khoản
                      </Button>
                    </div>
                  </div>
                </Tabs.TabPane>

                {/* TAB 2: HỘP THƯ (MAILBOX / NOTIFICATIONS) */}
                <Tabs.TabPane 
                  tab={
                    <span>
                      <Badge count={unreadCount} size="small" offset={[10, -2]}>
                        <MailOutlined style={{ marginRight: 6 }} />
                        Hộp thư cá nhân
                      </Badge>
                    </span>
                  } 
                  key="2"
                >
                  <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    locale={{ emptyText: 'Hộp thư của bạn hiện đang trống!' }}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button 
                            type="primary" 
                            ghost
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => handleOpenNotification(item)}
                            style={{ borderRadius: 6 }}
                          >
                            Đọc thư
                          </Button>
                        ]}
                        style={{ 
                          padding: '16px 12px', 
                          background: item.isRead ? 'transparent' : 'rgba(230, 184, 59, 0.05)',
                          borderRadius: 8,
                          marginBottom: 8,
                          borderLeft: item.isRead ? '3px solid #e5e7eb' : '3px solid #e6b83b',
                          transition: 'background 0.3s'
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              style={{ 
                                backgroundColor: item.type === 'Birthday' ? '#fef3c7' : '#dbeafe', 
                                color: item.type === 'Birthday' ? '#d97706' : '#2563eb' 
                              }}
                              icon={item.type === 'Birthday' ? <GiftOutlined /> : <MailOutlined />}
                            />
                          }
                          title={
                            <Space size={8}>
                              <span style={{ fontWeight: item.isRead ? 600 : 800, fontSize: 14 }}>
                                {item.title}
                              </span>
                              {!item.isRead && <Tag color="gold">Mới</Tag>}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontSize: 13 }} ellipsis={{ rows: 1 }}>
                                {item.content}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {dayjs(item.createdAt).format('HH:mm - DD/MM/YYYY')}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Tabs.TabPane>

              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* MODAL CHỈNH SỬA HỒ SƠ & AVATAR */}
        <Modal
          title={
            <div style={{ fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
              ✏️ Chỉnh sửa thông tin cá nhân
            </div>
          }
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
          style={{ top: 40 }}
        >
          {/* Section Chỉnh sửa avatar */}
          <div style={{ textAlign: 'center', marginBottom: 24, background: '#f8fafc', padding: '16px 0', borderRadius: 12 }}>
            <Avatar
              size={90}
              src={currentAvatar}
              icon={<UserOutlined />}
              style={{ marginBottom: 12, border: '2px solid #e6b83b' }}
            />
            <br />
            <Upload customRequest={handleUploadAvatar} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={uploading} size="small" style={{ borderRadius: 6 }}>
                Thay đổi ảnh đại diện
              </Button>
            </Upload>
          </div>

          <Form form={editForm} layout="vertical" onFinish={handleSaveProfile} requiredMark={false}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>Họ và tên</span>}
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input placeholder="Nhập họ và tên đầy đủ" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 600 }}>Số điện thoại</span>} name="phone">
                  <Input placeholder="Số điện thoại" size="large" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontWeight: 600 }}>Ngày sinh</span>} 
                  name="dateOfBirth"
                >
                  <DatePicker 
                    format="DD/MM/YYYY" 
                    style={{ width: '100%' }} 
                    size="large" 
                    placeholder="Chọn ngày sinh"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span style={{ fontWeight: 600 }}>Địa chỉ cư trú</span>} name="address">
              <Input placeholder="Nhập quận/huyện, tỉnh/thành phố" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 24 }}>
              <Button onClick={() => setIsEditModalOpen(false)} size="large" style={{ borderRadius: 8 }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving} 
                size="large" 
                style={{ borderRadius: 8, background: '#e6b83b', borderColor: '#e6b83b', color: '#1f2937', fontWeight: 600 }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </Modal>

        {/* MODAL XEM CHI TIẾT THƯ TAY CAO CẤP */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f3f4f6', paddingBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{selectedNotif?.type === 'Birthday' ? '🎂' : '✉️'}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>{selectedNotif?.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  Gửi lúc: {selectedNotif && dayjs(selectedNotif.createdAt).format('HH:mm - DD/MM/YYYY')}
                </div>
              </div>
            </div>
          }
          open={isNotifModalOpen}
          onCancel={() => setIsNotifModalOpen(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setIsNotifModalOpen(false)} style={{ borderRadius: 8, background: '#e6b83b', borderColor: '#e6b83b', color: '#1f2937', fontWeight: 600 }}>
              Đóng thư
            </Button>
          ]}
          width={550}
          style={{ top: 80 }}
        >
          {selectedNotif && (
            <div style={{ padding: '16px 4px', fontSize: 15, color: '#374151', lineHeight: 1.6 }}>
              <div style={{ whiteSpace: 'pre-line', marginBottom: 24 }}>
                {selectedNotif.content}
              </div>

              {selectedNotif.referenceLink && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  border: '2px dashed #d97706', 
                  padding: 20, 
                  borderRadius: 12, 
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
                }}>
                  <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#78350f', fontWeight: 700, marginBottom: 8 }}>
                    🎁 QUÀ TẶNG MÃ GIẢM GIÁ 🎁
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#b45309', fontFamily: 'monospace', letterSpacing: 1, margin: '8px 0' }}>
                    {selectedNotif.referenceLink}
                  </div>
                  <Button 
                    type="primary" 
                    icon={<CopyOutlined />} 
                    onClick={() => handleCopyCode(selectedNotif.referenceLink)}
                    style={{ background: '#d97706', borderColor: '#d97706', borderRadius: 8, marginTop: 8, fontWeight: 600 }}
                  >
                    Sao chép mã giảm giá
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* MODAL ĐỔI MẬT KHẨU */}
        <Modal
          title="Đổi mật khẩu"
          open={isPasswordModalOpen}
          onCancel={() => setIsPasswordModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item 
              label="Mật khẩu cũ" 
              name="oldPassword"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>

            <Form.Item 
              label="Mật khẩu mới" 
              name="newPassword"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item 
              label="Xác nhận mật khẩu mới" 
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <Form.Item label="Mã xác thực OTP">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="otp"
                  noStyle
                  rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                >
                  <Input prefix={<KeyOutlined />} placeholder="Nhập mã OTP (6 số)" maxLength={6} style={{ width: 'calc(100% - 130px)' }} />
                </Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleSendOtp} 
                  loading={sendingOtp}
                  style={{ width: '130px' }}
                >
                  {otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                </Button>
              </Space.Compact>
              {otpSent && <Typography.Text type="success" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>Mã OTP đã được gửi đến email của bạn.</Typography.Text>}
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setIsPasswordModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={changingPassword}>
                  Xác nhận đổi
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserProfilePage;
