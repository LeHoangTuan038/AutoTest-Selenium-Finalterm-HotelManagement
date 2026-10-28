import React, { useState } from "react";
// 1. ĐÃ SỬA: Thêm Row, Col vào import của antd
import { Form, Input, Button, Card, Typography, message, Row, Col } from "antd";
// 2. ĐÃ SỬA: Thêm BankFilled, MailOutlined vào import của icon
import { MailOutlined, LockOutlined, BankFilled } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuthStore } from "../store/adminAuthStore";
import { authAPI } from "../api/authApi";
import { jwtDecode } from "jwt-decode";
import { auditLogger } from "../utils/auditLogger";

const { Title, Text } = Typography;
const COLORS = {
  primary: "#e6b83b", // Vàng gold
  dark: "#1a1a1a",
  gray: "#8c8c8c"
};

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);

  // Hàm này tự động chạy khi người dùng điền đúng form và bấm Submit
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values);

      const { token, user, permissions } = response.data;

      // --- WORKAROUND: Kiểm tra trạng thái tài khoản ở Frontend ---
      if (user && user.isActive === false) {
        message.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        return; // Dừng quá trình đăng nhập
      }

      // ✅ Decode token
      const decoded = jwtDecode(token);

      let roles =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // 🔥 FIX: đảm bảo luôn là array
      if (!roles) roles = [];
      if (!Array.isArray(roles)) roles = [roles];

      console.log("Roles:", roles);

      // ✅ Lưu
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.fullName);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userPoints", String(user.points ?? 0));
      localStorage.setItem("userRank", user.rank || 'Khách Mới');

      setAuth(token, user, permissions);

      auditLogger.success("Đăng nhập thành công!", { 
        actionType: "LOGIN", 
        module: "Hệ thống", 
        objectName: "Tài khoản",
        description: `Người dùng ${user.fullName} (${user.email}) đã đăng nhập vào hệ thống.`
      });

      // ✅ 🔥 DÙNG roles (KHÔNG dùng user.role nữa)
      if (roles.includes("Admin")) {
        navigate("/admin/users");
      } else if (roles.includes("Receptionist")) {
        navigate("/receptionist/dashboard");
      } else if (roles.includes("Housekeeping")) {
        navigate("/housekeeper/dashboard");
      } else {
        navigate("/guest/dashboard");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Tài khoản hoặc mật khẩu không đúng!";
      
      // HIỂN THỊ THÔNG BÁO LỖI LÊN MÀN HÌNH CHO NGƯỜI DÙNG
      message.error(errorMsg);

      auditLogger.error(errorMsg, { module: "Hệ thống", objectName: "Đăng nhập" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
      <Col xs={24} md={10} style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 8%' // Căn lề hai bên cho form
      }}>
        <div style={{ maxWidth: 400, margin: '0 auto', width: '100%', textAlign: 'center' }}>

          {/* Logo & Tiêu đề */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              width: 50,
              height: 50,
              background: COLORS.primary,
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 15px auto'
            }}>
              <BankFilled style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>Hệ thống Khách sạn</Title>
            <Text type="secondary">Đăng nhập để tiếp tục</Text>
          </div>

          {/* Form Đăng nhập */}
          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="email"
              label={<Text strong>Email</Text>}
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: COLORS.gray, marginRight: 8 }} />}
                placeholder="email@example.com"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text strong>Mật khẩu</Text>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: COLORS.gray, marginRight: 8 }} />}
                placeholder="••••••••"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 30 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading} // Thêm loading vào đây
                style={{
                  background: COLORS.primary,
                  borderColor: COLORS.primary,
                  height: 45,
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 16
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* Quên mật khẩu & Đăng ký */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
            <Link to="/forgot-password" style={{ color: COLORS.gray, fontWeight: 500 }}>
              Quên mật khẩu?
            </Link>
            <Text>
              Chưa có tài khoản? <Link to="/register" style={{ color: COLORS.primary, fontWeight: 'bold' }}>Đăng ký</Link>
            </Text>
          </div>

        </div>
      </Col>

      {/* CỘT PHẢI: HÌNH ẢNH BACKGROUND */}
      <Col xs={0} md={14} style={{
        backgroundImage: `url('https://res.cloudinary.com/dqx8hqmcv/image/upload/f_auto,q_auto/v1774629245/trang-dang-ky_hs5ann.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        {/* Lớp phủ đen gradient từ dưới lên để chữ hiển thị rõ */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px'
        }}>
          <Title level={1} style={{ color: '#fff', margin: 0, fontFamily: 'serif' }}>
            Chào mừng đến với
          </Title>
          <Title level={1} style={{ color: '#fff', marginTop: 0, fontFamily: 'serif' }}>
            Hệ thống Quản trị Khách sạn
          </Title>
          <Text style={{ color: '#e0e0e0', fontSize: 18, marginTop: 10 }}>
            Giải pháp toàn diện cho quản lý khách sạn hiện đại
          </Text>
        </div>
      </Col>
    </Row>
  );
};

export default LoginPage;