import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd'; // Sử dụng Ant Design [cite: 625-634]
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import axiosClient from '../../api/axios';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gửi POST request để lấy JWT [cite: 256, 257]
      const res = await axiosClient.post('/Auth/login', values);
      const { token, user, permissions } = res.data;
      
      // Lưu Token & chuyển hướng [cite: 255]
      setAuth(token, user, permissions);
      message.success('Đăng nhập thành công!');
      navigate('/admin/dashboard');
      
    } catch (error) {
      message.error(error.response?.data?.message || 'Sai thông tin đăng nhập'); // Xử lý lỗi 400 [cite: 724, 725]
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="Đăng nhập Hệ thống ERP" style={{ width: 400 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
            <Input placeholder="admin@hotel.com" />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;