import React from 'react';
import { Layout, Typography, Row, Col, Button } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const COLORS = {
  gold: "#c19b4a",
  dark: "#0a0a0a",
  gray: "#b3b3b3"
};

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ background: '#fff', minHeight: '100vh' }}>
      <Content>
        {/* Hero Section */}
        <div style={{ 
          height: '60vh', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '0 20px' }}
          >
            <Text style={{ color: COLORS.gold, letterSpacing: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>THƯƠNG HIỆU</Text>
            <Title level={1} style={{ color: '#fff', fontSize: '64px', fontFamily: "'Noto Serif', serif", margin: '20px 0' }}>Lịch Sử & <i style={{ fontWeight: 300 }}>Sứ Mệnh</i></Title>
          </motion.div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '100px 80px', color: COLORS.dark }}>
          <Row gutter={[80, 40]} align="middle">
            <Col xs={24} md={12}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Title level={2} style={{ color: COLORS.dark, fontFamily: "'Noto Serif', serif", fontSize: '40px' }}>Câu Chuyện Của Chúng Tôi</Title>
                <Paragraph style={{ color: '#595959', fontSize: '18px', lineHeight: '1.8', marginTop: 30 }}>
                  Được thành lập từ tâm huyết mang đến một không gian nghỉ dưỡng thuần khiết và đẳng cấp, IT Hotel không chỉ là một điểm dừng chân, mà là nơi lưu giữ những khoảnh khắc quý giá nhất của bạn.
                </Paragraph>
                <Paragraph style={{ color: '#595959', fontSize: '18px', lineHeight: '1.8' }}>
                  Với kiến trúc đương đại hòa quyện cùng nét văn hóa bản địa đặc sắc, chúng tôi tự hào tạo dựng một hệ sinh thái dịch vụ chuẩn mực, nơi mỗi khách hàng đều là một thượng khách được trân trọng bậc nhất.
                </Paragraph>
                <Button 
                  onClick={() => navigate('/homepage')}
                  style={{ 
                    marginTop: 40, background: COLORS.gold, borderColor: COLORS.gold, color: COLORS.dark, 
                    borderRadius: 0, height: 50, padding: '0 40px', fontWeight: 'bold' 
                  }}
                >
                  QUAY LẠI TRANG CHỦ
                </Button>
              </motion.div>
            </Col>
            <Col xs={24} md={12}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ overflow: 'hidden', borderRadius: 20 }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop" 
                  alt="Hotel Story" 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </motion.div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default AboutPage;
