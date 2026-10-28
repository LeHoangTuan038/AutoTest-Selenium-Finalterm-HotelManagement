import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Rate, Input, Button, Form, message, Spin, Avatar, Divider, List, Card } from 'antd';
import { UserOutlined, LeftOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import axiosClient from '../../api/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        axiosClient.get(`/Posts/${id}`),
        axiosClient.get(`/PostComments/post/${id}`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data || []);
    } catch (error) {
      message.error('Không thể tải bài viết');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const onFinishComment = async (values) => {
    setSubmitting(true);
    try {
      await axiosClient.post('/PostComments', {
        ...values,
        postId: parseInt(id)
      });
      message.success('Gửi bình luận thành công! Đang chờ admin duyệt.');
      form.resetFields();
    } catch (error) {
      message.error('Gửi bình luận thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  if (!post) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Bài viết không tồn tại.</div>;

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: 60 }}>
      {/* HEADER BANNER */}
      <div style={{
        height: 400,
        backgroundImage: `url(${post.imageUrl || 'https://images.unsplash.com/photo-1542314831-c53cd4b85d05?w=1600'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))' }} />
        <div style={{ position: 'absolute', bottom: 40, left: '10%', right: '10%', color: 'white' }}>
          <Button type="text" icon={<LeftOutlined />} style={{ color: 'white', marginBottom: 16 }} onClick={() => navigate(-1)}>Quay lại</Button>
          {post.categoryName && <span style={{ background: '#1890ff', padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>{post.categoryName}</span>}
          <Title style={{ color: 'white', margin: 0, fontSize: 42 }}>{post.title}</Title>
          <div style={{ marginTop: 16, display: 'flex', gap: 20, fontSize: 14, opacity: 0.8 }}>
            <span>📅 {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {/* POST CONTENT */}
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 40 }}>
          {post.excerpt && (
            <Paragraph style={{ fontSize: 18, fontStyle: 'italic', color: '#555', borderLeft: '4px solid #1890ff', paddingLeft: 16, marginBottom: 30 }}>
              {post.excerpt}
            </Paragraph>
          )}
          <div data-color-mode="light" style={{ fontSize: 16, lineHeight: 1.8 }}>
            <MDEditor.Markdown source={post.content} style={{ background: 'transparent' }} />
          </div>
        </Card>

        {/* COMMENTS SECTION */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Title level={3} style={{ marginBottom: 24 }}>Bình luận & Đánh giá ({comments.length})</Title>
          
          <List
            dataSource={comments}
            locale={{ emptyText: 'Chưa có bình luận nào. Hãy là người đầu tiên đánh giá!' }}
            renderItem={item => (
              <List.Item style={{ borderBottom: '1px solid #f0f0f0', padding: '20px 0' }}>
                <List.Item.Meta
                  avatar={<Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 16 }}>{item.guestName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Rate disabled defaultValue={item.rating} style={{ fontSize: 14, marginBottom: 8 }} />
                      <div style={{ color: '#333', fontSize: 15 }}>{item.content}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
            style={{ marginBottom: 40 }}
          />

          <Divider />

          <Title level={4} style={{ marginBottom: 20 }}>Viết bình luận của bạn</Title>
          <Form form={form} layout="vertical" onFinish={onFinishComment}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="guestName" rules={[{ required: true, message: 'Nhập tên của bạn' }]} style={{ flex: 1 }}>
                <Input size="large" placeholder="Tên của bạn" prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item name="guestEmail" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]} style={{ flex: 1 }}>
                <Input size="large" placeholder="Email của bạn (không hiển thị công khai)" />
              </Form.Item>
            </div>
            <Form.Item name="rating" label="Đánh giá của bạn" rules={[{ required: true, message: 'Vui lòng chọn sao đánh giá' }]}>
              <Rate style={{ fontSize: 24 }} />
            </Form.Item>
            <Form.Item name="content" rules={[{ required: true, message: 'Nhập nội dung bình luận' }]}>
              <TextArea rows={4} placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..." size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={submitting} style={{ borderRadius: 8, padding: '0 32px' }}>
                Gửi Bình Luận
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
