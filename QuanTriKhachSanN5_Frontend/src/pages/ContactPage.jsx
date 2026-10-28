import React from 'react';
import { Layout, Typography, Row, Col, Form, Input, Button, message } from 'antd';
import { motion } from 'framer-motion';
import { EnvironmentOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const COLORS = {
  gold: "#c19b4a",
  dark: "#0a0a0a",
  gray: "#b3b3b3"
};

const ContactPage = () => {
  const onFinish = (values) => {
    console.log('Contact form:', values);
    message.success('Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất.');
  };

  return (
    <Layout style={{ background: '#fff', minHeight: '100vh' }}>
      <Content>
        {/* Header Section */}
        <div style={{ padding: '120px 80px 60px', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <Text style={{ color: COLORS.gold, letterSpacing: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>LIÊN HỆ</Text>
            <Title level={1} style={{ color: '#fff', fontSize: '56px', fontFamily: "'Noto Serif', serif", margin: '20px 0' }}>Kết Nối Với <i style={{ fontWeight: 300 }}>Chúng Tôi</i></Title>
          </motion.div>
        </div>

        <div style={{ padding: '0 80px 100px' }}>
          <Row gutter={[80, 40]}>
            {/* Contact Information */}
            <Col xs={24} md={10}>
              <div style={{ textAlign: 'left' }}>
                <Title level={3} style={{ color: COLORS.dark, fontFamily: "'Noto Serif', serif" }}>Thông Tin Liên Hệ</Title>
                <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 30 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <EnvironmentOutlined style={{ color: COLORS.gold, fontSize: 24, marginTop: 5 }} />
                    <div>
                      <Text strong style={{ color: COLORS.dark, fontSize: 18, display: 'block' }}>Địa Chỉ</Text>
                      <Text style={{ color: '#595959' }}>123 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng, Việt Nam</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <PhoneOutlined style={{ color: COLORS.gold, fontSize: 24, marginTop: 5 }} />
                    <div>
                      <Text strong style={{ color: COLORS.dark, fontSize: 18, display: 'block' }}>Điện Thoại</Text>
                      <Text style={{ color: '#595959' }}>+84 (0) 236 123 4567</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <MailOutlined style={{ color: COLORS.gold, fontSize: 24, marginTop: 5 }} />
                    <div>
                      <Text strong style={{ color: COLORS.dark, fontSize: 18, display: 'block' }}>Email</Text>
                      <Text style={{ color: '#595959' }}>info@ithotel.com</Text>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Contact Form */}
            <Col xs={24} md={14}>
              <div style={{ background: '#f9f9f9', padding: 40, borderRadius: 20, border: '1px solid #eee' }}>
                <Form layout="vertical" onFinish={onFinish}>
                  <Row gutter={20}>
                    <Col span={12}>
                      <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Họ và tên" style={{ background: '#fff', color: COLORS.dark, borderRadius: 8, padding: '10px 15px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                        <Input placeholder="Địa chỉ email" style={{ background: '#fff', color: COLORS.dark, borderRadius: 8, padding: '10px 15px' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="message" rules={[{ required: true, message: 'Vui lòng nhập tin nhắn!' }]}>
                    <Input.TextArea rows={4} placeholder="Tin nhắn của bạn" style={{ background: '#fff', color: COLORS.dark, borderRadius: 8, padding: '10px 15px', marginTop: 20 }} />
                  </Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    style={{ 
                      marginTop: 30, background: COLORS.gold, borderColor: COLORS.gold, color: '#fff', 
                      borderRadius: 8, height: 50, padding: '0 60px', fontWeight: 'bold', width: '100%' 
                    }}
                  >
                    GỬI TIN NHẮN
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </div>

        {/* Map Section */}
        <div style={{ width: '100%', height: '500px', background: '#222' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.110435405637!2d108.24151771485863!3d16.059758288887413!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142177f196d66d7%3A0x1d47668641470559!2zVsO1IE5ndXnDqm4gR2nDoXAsIMSQw6AgTuG6tW5nLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1652610000000!5m2!1svi!2s" 
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default ContactPage;
