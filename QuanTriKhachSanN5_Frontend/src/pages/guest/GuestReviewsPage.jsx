import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layout,
  Breadcrumb,
  Card,
  Typography,
  List,
  Rate,
  Space,
  Empty
} from "antd";
import { StarOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const GuestReviewsPage = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const userEmail = storedUser?.email || localStorage.getItem('userEmail') || 'guest@hotel.com';
    const savedReviews = localStorage.getItem(`guestReviews_${userEmail}`);
    
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch {
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
  }, []);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f4f5f7" }}>
      <Content style={{ padding: "40px 50px" }}>
        <Breadcrumb separator=">" style={{ marginBottom: 24 }}>
          <Breadcrumb.Item>
            <Link to="/guest/dashboard">Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Đánh giá của tôi</Breadcrumb.Item>
        </Breadcrumb>

        <Card
          title={<><StarOutlined style={{ color: '#fadb14' }} /> Đánh giá của tôi</>}
          style={{ borderRadius: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        >
          {reviews.length === 0 ? (
            <Empty description="Bạn chưa có bài đánh giá nào." />
          ) : (
            <List
              dataSource={reviews}
              renderItem={(review) => (
                <List.Item
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    marginBottom: 16,
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space size="middle">
                        <Title level={5} style={{ margin: 0 }}>{review.roomName}</Title>
                        <Text type="secondary">{review.date}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                        <Rate disabled defaultValue={review.rating} />
                        <Text style={{ fontSize: 15, color: '#333' }}>"{review.comment}"</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default GuestReviewsPage;
