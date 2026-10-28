import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/authApi';
import { auditLogger } from '../utils/auditLogger';

const { Title, Text } = Typography;

// Bảng màu sang trọng của IT HOTEL
const COLORS = {
  primary: "#e6b83b", // Vàng gold
  dark: "#1a1a1a",
  gray: "#8c8c8c"
};

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tempData, setTempData] = useState(null); // Lưu thông tin người dùng ở Bước 1
  const navigate = useNavigate();

  // BƯỚC 1: Xử lý Gửi OTP
  const onSendOtp = async (values) => {
    setLoading(true);
    try {
      // Gọi API gửi OTP
      const res = await authAPI.sendOtp({ email: values.email });
      message.success(res.data.message || 'Mã OTP đã được gửi đến email của bạn!');
      
      // Lưu thông tin lại để dùng ở bước 2
      setTempData(values);
      setStep(2); // Chuyển sang màn hình nhập OTP
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi gửi OTP, vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Xử lý Xác nhận Đăng ký
  const onVerifyAndRegister = async (values) => {
    setLoading(true);
    try {
      const payloadToSend = {
        Username: tempData.fullName,
        Email: tempData.email,
        Password: tempData.password,
        Otp: values.otp // Truyền thêm mã OTP
      };

      await authAPI.register(payloadToSend); 
      
      message.success('Đăng ký thành công! Đang chuyển hướng...');
      auditLogger.success('Đăng ký thành công!', {
        actionType: "CREATE",
        module: "Hệ thống",
        objectName: "Tài khoản",
        description: `Người dùng mới đăng ký: ${tempData.fullName} (${tempData.email})`
      });
      setTimeout(() => navigate('/login'), 1500); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại!';
      message.error(errorMsg);
      auditLogger.error(errorMsg, { module: "Hệ thống", objectName: "Đăng ký" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      
      {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
      <Col xs={24} md={10} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '5% 8%' 
      }}>
        <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ 
              width: 50, height: 50, background: COLORS.primary, 
              borderRadius: 12, display: 'flex', justifyContent: 'center', 
              alignItems: 'center', margin: '0 auto 15px auto' 
            }}>
              <BankFilled style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>Đăng ký tài khoản</Title>
            <Text type="secondary">Trở thành thành viên của IT HOTEL</Text>
          </div>

          {step === 1 && (
            <Form layout="vertical" onFinish={onSendOtp} size="large">
              <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                <Input prefix={<UserOutlined style={{ color: COLORS.gray, marginRight: 8 }}/>} placeholder="Họ và tên" style={{ borderRadius: 8 }}/>
              </Form.Item>

              <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                <Input prefix={<MailOutlined style={{ color: COLORS.gray, marginRight: 8 }}/>} placeholder="Email đăng nhập (Bắt buộc dùng Gmail thật)" style={{ borderRadius: 8 }}/>
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu ít nhất 6 ký tự!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: COLORS.gray, marginRight: 8 }}/>} placeholder="Mật khẩu" style={{ borderRadius: 8 }}/>
              </Form.Item>

              <Form.Item name="confirmPassword" dependencies={['password']} rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}>
                <Input.Password prefix={<LockOutlined style={{ color: COLORS.gray, marginRight: 8 }}/>} placeholder="Xác nhận mật khẩu" style={{ borderRadius: 8 }}/>
              </Form.Item>

              <Form.Item style={{ marginTop: 10 }}>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ background: COLORS.primary, borderColor: COLORS.primary, height: 45, borderRadius: 8, fontWeight: 'bold', fontSize: 16 }}>
                  Đăng Ký
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 15 }}>
                <Text style={{ color: COLORS.gray }}>Đã có tài khoản? <Link to="/login" style={{ color: COLORS.primary, fontWeight: 'bold' }}>Đăng nhập</Link></Text>
              </div>
            </Form>
          )}

          {step === 2 && (
            <Form layout="vertical" onFinish={onVerifyAndRegister} size="large">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Text>Mã xác thực đã được gửi tới email <b style={{color: COLORS.primary}}>{tempData?.email}</b>.</Text><br/>
                <Text type="secondary" style={{ fontSize: 12 }}>Vui lòng kiểm tra Hộp thư đến hoặc Thư rác (Spam).</Text>
              </div>

              <Form.Item name="otp" rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}>
                <Input 
                  prefix={<SafetyCertificateOutlined style={{ color: COLORS.gray, marginRight: 8 }}/>} 
                  placeholder="Nhập mã OTP 6 số" 
                  style={{ borderRadius: 8, textAlign: 'center', fontSize: 20, letterSpacing: 5 }}
                  maxLength={6}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 10 }}>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ background: COLORS.primary, borderColor: COLORS.primary, height: 45, borderRadius: 8, fontWeight: 'bold', fontSize: 16 }}>
                  Xác nhận & Đăng Ký
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 15 }}>
                <Button type="link" onClick={() => setStep(1)} style={{ color: COLORS.gray }}>
                  Quay lại sửa thông tin
                </Button>
              </div>
            </Form>
          )}

        </div>
      </Col>

      {/* CỘT PHẢI: HÌNH ẢNH BACKGROUND TỪ CLOUDINARY */}
      <Col xs={0} md={14} style={{
        backgroundImage: `url('https://res.cloudinary.com/dqx8hqmcv/image/upload/f_auto,q_auto/v1774629245/trang-dang-ky_hs5ann.jpg')`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '60px'
        }}>
          <Title level={1} style={{ color: '#fff', margin: 0, fontFamily: 'serif' }}>Khởi đầu hành trình</Title>
          <Title level={1} style={{ color: '#fff', marginTop: 0, fontFamily: 'serif' }}>Trải nghiệm đẳng cấp</Title>
          <Text style={{ color: '#e0e0e0', fontSize: 18, marginTop: 10 }}>Đăng ký ngay để nhận những đặc quyền dành riêng cho hội viên</Text>
        </div>
      </Col>
      
    </Row>
  );
};

export default RegisterPage;