import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Steps } from 'antd';
import { MailOutlined, ArrowLeftOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/authApi';

const { Title } = Typography;

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Nhập Email, 1: Nhập OTP & Mật khẩu mới
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSendOtp = async (values) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(values.email);
      message.success('Đã gửi mã OTP khôi phục mật khẩu! Vui lòng kiểm tra email.');
      setEmail(values.email);
      setStep(1);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không tìm thấy email này trong hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      await authAPI.resetPassword({
        email,
        otp: values.otp,
        newPassword: values.newPassword
      });
      message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>HOTEL ERP</Title>
          <p style={{ color: '#8c8c8c' }}>Khôi phục mật khẩu</p>
        </div>

        <Steps current={step} style={{ marginBottom: 24 }} size="small">
          <Steps.Step title="Email" />
          <Steps.Step title="Xác nhận & Đổi MK" />
        </Steps>

        {step === 0 && (
          <Form layout="vertical" onFinish={handleSendOtp} size="large">
            <p style={{ textAlign: 'center', marginBottom: 20 }}>
              Vui lòng nhập địa chỉ email bạn đã sử dụng để đăng ký. Chúng tôi sẽ gửi một mã OTP để xác nhận.
            </p>
            <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
              <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Gửi mã xác nhận
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 1 && (
          <Form form={form} layout="vertical" onFinish={handleResetPassword} size="large">
            <p style={{ textAlign: 'center', marginBottom: 20 }}>
              Mã OTP đã được gửi đến email <b>{email}</b>. Vui lòng kiểm tra và nhập mã xác nhận cùng mật khẩu mới.
            </p>
            
            <Form.Item name="otp" rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}>
              <Input prefix={<KeyOutlined />} placeholder="Nhập mã OTP (6 số)" maxLength={6} />
            </Form.Item>

            <Form.Item name="newPassword" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
            </Form.Item>

            <Form.Item name="confirmPassword" dependencies={['newPassword']} rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Xác nhận đổi mật khẩu
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={() => setStep(0)} style={{ color: '#8c8c8c' }}>
                Đổi email khác
              </Button>
            </div>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ color: '#8c8c8c' }}>
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;