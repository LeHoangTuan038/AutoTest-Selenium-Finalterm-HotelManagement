import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Card, Typography, Popconfirm, Row, Col, Tabs,
  Drawer, Statistic, Switch, InputNumber, Tooltip, Badge, Upload, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  FileTextOutlined, EnvironmentOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckCircleOutlined, ClockCircleOutlined, GlobalOutlined, HomeOutlined,
  UploadOutlined, TagsOutlined
} from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import axiosClient from '../../api/axios';
import LocationPicker from '../../components/LocationPicker';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const PostsManagement = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [postFilterCat, setPostFilterCat] = useState('all');
  const [postFilterStatus, setPostFilterStatus] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingContentImg, setUploadingContentImg] = useState(false);
  const [previewImg, setPreviewImg] = useState('');
  const [postForm] = Form.useForm();

  const [attractions, setAttractions] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attSearch, setAttSearch] = useState('');
  const [attModalOpen, setAttModalOpen] = useState(false);
  const [editingAtt, setEditingAtt] = useState(null);
  const [attLocation, setAttLocation] = useState({});
  const [attForm] = Form.useForm();
  const [uploadingAttImg, setUploadingAttImg] = useState(false);
  const [previewAttImg, setPreviewAttImg] = useState('');

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => { fetchPosts(); fetchCategories(); fetchRoomTypes(); }, []);
  useEffect(() => { 
    if (activeTab === 'attractions') fetchAttractions(); 
    if (activeTab === 'comments') fetchComments();
  }, [activeTab]);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try { const r = await axiosClient.get('/Posts'); setPosts(r.data || []); }
    catch { message.error('Lỗi tải bài viết!'); }
    finally { setPostsLoading(false); }
  };
  const fetchCategories = async () => {
    try { const r = await axiosClient.get('/Categories'); setCategories(r.data || []); }
    catch { }
  };
  const fetchRoomTypes = async () => {
    try { const r = await axiosClient.get('/RoomTypes/public'); setRoomTypes(r.data || []); }
    catch { }
  };
  const fetchAttractions = async () => {
    setAttLoading(true);
    try { const r = await axiosClient.get('/Attractions'); setAttractions(r.data || []); }
    catch { message.error('Lỗi tải điểm tham quan!'); }
    finally { setAttLoading(false); }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try { 
      const r = await axiosClient.get('/Reviews'); 
      setComments(r.data || []); 
    }
    catch { message.error('Lỗi tải đánh giá phòng!'); }
    finally { setCommentsLoading(false); }
  };

  const handleDeleteComment = async (id) => {
    try { 
      await axiosClient.delete(`/Reviews/${id}`); 
      message.success('Đã xóa đánh giá thành công!'); 
      fetchComments(); 
    }
    catch { message.error('Xóa đánh giá thất bại!'); }
  };

  // Upload ảnh lên Cloudinary
  const handleUploadImage = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImg(true);
    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || '';
      postForm.setFieldValue('imageUrl', url);
      setPreviewImg(url);
      message.success('Tải ảnh lên thành công!');
    } catch { message.error('Lỗi tải ảnh lên Cloudinary!'); }
    finally { setUploadingImg(false); }
    return false; // ngăn antd tự upload
  };

  // Upload ảnh chèn trực tiếp vào nội dung (Markdown)
  const handleUploadContentImage = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingContentImg(true);
    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || '';
      // Tự động chèn thẻ ảnh Markdown vào vị trí cuối hoặc hiện tại của văn bản
      setPostContent(prev => (prev || '') + `\n\n![Mô tả ảnh](${url})\n\n`);
      message.success('Đã tải ảnh lên Cloudinary & tự động chèn vào nội dung bài viết!');
    } catch { message.error('Lỗi tải ảnh chèn nội dung lên Cloudinary!'); }
    finally { setUploadingContentImg(false); }
    return false;
  };

  // Toggle IsPublished trực tiếp trong bảng
  const handleTogglePublish = async (record) => {
    const dto = {
      title: record.title,
      content: record.content,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: !record.isPublished,
      isHot: record.isHot,
    };
    try {
      await axiosClient.put(`/Posts/${record.id}`, dto);
      message.success(dto.isPublished ? '✅ Đã xuất bản bài viết!' : '🔒 Đã ẩn bài viết!');
      fetchPosts();
    } catch { message.error('Cập nhật trạng thái thất bại!'); }
  };

  // Toggle IsHot trực tiếp trong bảng
  const handleToggleHot = async (record) => {
    const dto = {
      title: record.title,
      content: record.content,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: record.isPublished,
      isHot: !record.isHot,
    };
    try {
      await axiosClient.put(`/Posts/${record.id}`, dto);
      message.success(dto.isHot ? '🔥 Đã ghim làm Tin Hot trang chủ!' : '🧊 Đã chuyển thành Tin thường!');
      fetchPosts();
    } catch { message.error('Cập nhật trạng thái Tin Hot thất bại!'); }
  };

  const openAddPost = () => {
    setEditingPost(null);
    setPostContent('');
    setPreviewImg('');
    postForm.resetFields();
    postForm.setFieldsValue({ isPublished: false, isHot: false });
    setDrawerOpen(true);
  };

  const openEditPost = (record) => {
    setEditingPost(record);
    setPostContent(record.content || '');
    setPreviewImg(record.imageUrl || '');
    postForm.setFieldsValue({
      title: record.title,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: record.isPublished,
      isHot: record.isHot,
    });
    setDrawerOpen(true);
  };

  const handleSavePost = async () => {
    try {
      const values = await postForm.validateFields();
      if (!postContent || postContent === '<p><br></p>') {
        message.warning('Vui lòng nhập nội dung!'); return;
      }
      const dto = { ...values, content: postContent };
      setPostsLoading(true);
      if (editingPost) {
        await axiosClient.put(`/Posts/${editingPost.id}`, dto);
        message.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('/Posts', dto);
        message.success('Đăng bài thành công!');
      }
      setDrawerOpen(false);
      fetchPosts();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Có lỗi xảy ra!');
    } finally { setPostsLoading(false); }
  };

  const handleDeletePost = async (id) => {
    try { await axiosClient.delete(`/Posts/${id}`); message.success('Đã xóa!'); fetchPosts(); }
    catch { message.error('Xóa thất bại!'); }
  };

  const handleUploadAttImage = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingAttImg(true);
    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || '';
      attForm.setFieldValue('imageUrl', url);
      setPreviewAttImg(url);
      message.success('Tải ảnh điểm tham quan lên thành công!');
    } catch { message.error('Lỗi tải ảnh lên Cloudinary!'); }
    finally { setUploadingAttImg(false); }
    return false;
  };

  const handleToggleAttHot = async (record) => {
    const dto = {
      name: record.name,
      description: record.description,
      location: record.address || '',
      distanceKm: record.distanceKm,
      mapEmbedLink: record.mapEmbedLink || '',
      latitude: record.latitude,
      longitude: record.longitude,
      isActive: record.isActive !== false,
      imageUrl: record.imageUrl,
      isHot: !record.isHot,
    };
    try {
      await axiosClient.put(`/Attractions/${record.id}`, dto);
      message.success(dto.isHot ? '🔥 Đã ghim làm Điểm Hot trang chủ!' : '🧊 Đã chuyển thành điểm thường!');
      fetchAttractions();
    } catch { message.error('Cập nhật trạng thái thất bại!'); }
  };

  const openAddAtt = () => { 
    setEditingAtt(null); 
    setAttLocation({}); 
    setPreviewAttImg(''); 
    attForm.resetFields(); 
    attForm.setFieldsValue({ isActive: true, isHot: false }); 
    setAttModalOpen(true); 
  };

  const openEditAtt = (r) => {
    setEditingAtt(r);
    const loc = { address: r.address, lat: r.latitude, lng: r.longitude, mapEmbedLink: r.mapEmbedLink };
    setAttLocation(loc);
    setPreviewAttImg(r.imageUrl || '');
    attForm.setFieldsValue({ 
      name: r.name, 
      description: r.description, 
      distanceKm: r.distanceKm, 
      isActive: r.isActive !== false,
      imageUrl: r.imageUrl,
      isHot: r.isHot === true
    });
    setAttModalOpen(true);
  };

  const handleSaveAtt = async () => {
    try {
      const v = await attForm.validateFields();
      const dto = {
        name: v.name,
        description: v.description,
        location: attLocation?.address || '',
        distanceKm: v.distanceKm,
        mapEmbedLink: attLocation?.mapEmbedLink || '',
        latitude: attLocation?.lat ? parseFloat(attLocation.lat) : null,
        longitude: attLocation?.lng ? parseFloat(attLocation.lng) : null,
        isActive: v.isActive !== false,
        imageUrl: v.imageUrl || '',
        isHot: v.isHot === true
      };
      setAttLoading(true);
      if (editingAtt) await axiosClient.put(`/Attractions/${editingAtt.id}`, dto);
      else await axiosClient.post('/Attractions', dto);
      message.success('Lưu thành công!');
      setAttModalOpen(false); fetchAttractions();
    } catch (e) { if (!e?.errorFields) message.error('Lỗi!'); }
    finally { setAttLoading(false); }
  };

  const handleDeleteAtt = async (id) => {
    try { await axiosClient.delete(`/Attractions/${id}`); message.success('Đã xóa!'); fetchAttractions(); }
    catch { message.error('Xóa thất bại!'); }
  };

  const filteredPosts = posts.filter(p => {
    const s = p.title?.toLowerCase().includes(postSearch.toLowerCase());
    const c = postFilterCat === 'all' || p.categoryId === parseInt(postFilterCat);
    const st = postFilterStatus === 'all' || (postFilterStatus === 'published' && p.isPublished) || (postFilterStatus === 'draft' && !p.isPublished);
    return s && c && st;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filteredAttractions = attractions.filter(a => a.name?.toLowerCase().includes(attSearch.toLowerCase()) || a.address?.toLowerCase().includes(attSearch.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const publishedCount = posts.filter(p => p.isPublished).length;

  const postColumns = [
    {
      title: 'Bài viết', dataIndex: 'title', key: 'title',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {r.imageUrl
            ? <img src={r.imageUrl} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
            : <div style={{ width: 56, height: 42, background: '#f0f0f0', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 20 }}>📄</div>
          }
          <div>
            <Text strong style={{ fontSize: 14 }}>{t}</Text>
            {r.excerpt && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.excerpt.substring(0, 65)}...</Text></div>}
          </div>
        </div>
      )
    },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName', width: 130, render: t => t ? <Tag color="blue">{t}</Tag> : <Tag>—</Tag> },
    {
      title: 'Vị trí đăng', dataIndex: 'roomTypeName', key: 'roomTypeName', width: 150,
      render: t => t
        ? <Tag icon={<HomeOutlined />} color="purple">{t}</Tag>
        : <Tag color="cyan" icon={<GlobalOutlined />}>Trang Tin Tức</Tag>
    },
    {
      title: 'Trạng thái', dataIndex: 'isPublished', key: 'isPublished', width: 120, align: 'center',
      render: (v, record) => (
        <Tooltip title={v ? 'Đang hiển thị — nhấn để ẩn' : 'Đang ẩn — nhấn để hiển thị'}>
          <Switch
            checked={v}
            onChange={() => handleTogglePublish(record)}
            checkedChildren={<><EyeOutlined /> Hiện</>}
            unCheckedChildren={<><EyeInvisibleOutlined /> Ẩn</>}
            style={{ minWidth: 80 }}
          />
        </Tooltip>
      )
    },
    {
      title: 'Điểm Hot 🔥', dataIndex: 'isHot', key: 'isHot', width: 110, align: 'center',
      render: (v, record) => (
        <Tooltip title={v ? 'Đang bật Điểm Hot — nhấn để tắt' : 'Nhấn để đặt làm Điểm Hot trang chủ (Đẩy lên đầu hàng)'}>
          <Switch
            checked={v}
            onChange={() => handleToggleHot(record)}
            checkedChildren="Hot 🔥"
            unCheckedChildren="Thường"
            style={{ minWidth: 75 }}
          />
        </Tooltip>
      )
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: d => d ? new Date(d).toLocaleDateString('vi-VN') : '—' },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, r) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button type="primary" ghost icon={<EditOutlined />} size="small" onClick={() => openEditPost(r)} />
          </Tooltip>
          <Popconfirm title="Xóa bài viết này?" onConfirm={() => handleDeletePost(r.id)} okText="Xóa" cancelText="Hủy" okType="danger">
            <Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} size="small" /></Tooltip>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const attColumns = [
    {
      title: 'Tên địa điểm', dataIndex: 'name', key: 'name',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {r.imageUrl
            ? <img src={r.imageUrl} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
            : <div style={{ width: 56, height: 42, background: '#f0f0f0', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 16 }}>📍</div>
          }
          <Text strong>{t}</Text>
        </div>
      )
    },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: t => t || '—' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true, render: t => t || '—' },
    { title: 'Khoảng cách', dataIndex: 'distanceKm', key: 'distanceKm', width: 115, align: 'center', render: v => v ? `${v} km` : '—' },
    {
      title: 'Điểm Hot 🔥', dataIndex: 'isHot', key: 'isHot', width: 110, align: 'center',
      render: (v, record) => (
        <Tooltip title={v ? 'Đang bật Điểm Hot — nhấn để tắt' : 'Nhấn để đặt làm Điểm Hot trang chủ (Đẩy lên đầu hàng)'}>
          <Switch
            checked={v}
            onChange={() => handleToggleAttHot(record)}
            checkedChildren="Hot 🔥"
            unCheckedChildren="Thường"
            style={{ minWidth: 75 }}
          />
        </Tooltip>
      )
    },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 110, align: 'center', render: v => v !== false ? <Tag color="green">Hiển thị</Tag> : <Tag color="red">Ẩn</Tag> },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, r) => (
        <Space>
          <Button type="primary" ghost icon={<EditOutlined />} size="small" onClick={() => openEditAtt(r)} />
          <Popconfirm title="Xóa địa điểm này?" onConfirm={() => handleDeleteAtt(r.id)} okText="Xóa" cancelText="Hủy" okType="danger">
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const commentColumns = [
    { title: 'Loại phòng', dataIndex: 'roomTypeName', key: 'roomTypeName', width: 220, ellipsis: true, render: t => <Text strong>{t || 'Loại phòng'}</Text> },
    { title: 'Khách hàng', dataIndex: 'username', key: 'username', width: 180, render: t => t || 'Khách ẩn danh' },
    { title: 'Đánh giá', dataIndex: 'rating', key: 'rating', width: 130, align: 'center', render: r => <span style={{ color: '#fadb14', fontSize: 15 }}>{'★'.repeat(r || 5)}{'☆'.repeat(5 - (r || 5))}</span> },
    { title: 'Nội dung nhận xét', dataIndex: 'comment', key: 'comment', render: t => t || '—' },
    { title: 'Ngày đánh giá', dataIndex: 'createdAt', key: 'createdAt', width: 130, align: 'center', render: d => d ? new Date(d).toLocaleDateString('vi-VN') : '—' },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, r) => (
        <Popconfirm title="Xóa đánh giá này khỏi hệ thống?" onConfirm={() => handleDeleteComment(r.id)} okText="Xóa" cancelText="Hủy" okType="danger">
          <Tooltip title="Xóa đánh giá">
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 28px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>📝 Quản Lý Nội Dung</Title>
        <Text type="secondary">Quản lý bài viết tin tức và điểm tham quan du lịch</Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: 'Tổng bài viết', value: posts.length, color: '#1890ff', icon: '📄' },
          { title: 'Đã xuất bản', value: publishedCount, color: '#52c41a', icon: '✅' },
          { title: 'Đang ẩn', value: posts.length - publishedCount, color: '#faad14', icon: '🔒' },
          { title: 'Điểm tham quan', value: attractions.length, color: '#722ed1', icon: '📍' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card style={{ borderRadius: 10, borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{s.title}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
          tabBarExtraContent={
            activeTab === 'posts'
              ? <Button type="primary" icon={<PlusOutlined />} onClick={openAddPost} style={{ margin: '12px 24px 12px 0', borderRadius: 8, fontWeight: 600 }}>+ Thêm bài viết</Button>
              : <Button type="primary" icon={<PlusOutlined />} onClick={openAddAtt} style={{ margin: '12px 24px 12px 0', borderRadius: 8, fontWeight: 600 }}>+ Thêm địa điểm</Button>
          }
          items={[
            {
              key: 'posts', label: <span><FileTextOutlined /> Bài Viết & Tin Tức</span>,
              children: (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', background: '#fafafa', padding: '14px 16px', borderRadius: 8 }}>
                    <Search placeholder="Tìm theo tiêu đề..." value={postSearch} onChange={e => setPostSearch(e.target.value)} style={{ width: 260 }} allowClear />
                    <Select style={{ width: 170 }} value={postFilterCat} onChange={setPostFilterCat}>
                      <Option value="all">Tất cả danh mục</Option>
                      {categories.map(c => <Option key={c.id} value={c.id.toString()}>{c.name}</Option>)}
                    </Select>
                    <Select style={{ width: 155 }} value={postFilterStatus} onChange={setPostFilterStatus}>
                      <Option value="all">Tất cả trạng thái</Option>
                      <Option value="published">Đang hiển thị</Option>
                      <Option value="draft">Đang ẩn</Option>
                    </Select>
                  </div>
                  <Table columns={postColumns} dataSource={filteredPosts} rowKey="id" loading={postsLoading}
                    pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} bài viết` }} scroll={{ x: 900 }} />
                </div>
              )
            },
            {
              key: 'attractions', label: <span><EnvironmentOutlined /> Điểm Tham Quan</span>,
              children: (
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 18, background: '#fafafa', padding: '14px 16px', borderRadius: 8 }}>
                    <Search placeholder="Tìm theo tên hoặc địa chỉ..." value={attSearch} onChange={e => setAttSearch(e.target.value)} style={{ width: 320 }} allowClear />
                  </div>
                  <Table columns={attColumns} dataSource={filteredAttractions} rowKey="id" loading={attLoading}
                    pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} địa điểm` }} scroll={{ x: 800 }} />
                </div>
              )
            },
            {
              key: 'comments', label: <span><FileTextOutlined /> Bình luận & Đánh giá</span>,
              children: (
                <div style={{ padding: 24 }}>
                  <Table columns={commentColumns} dataSource={comments} rowKey="id" loading={commentsLoading}
                    pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} đánh giá` }} scroll={{ x: 900 }} />
                </div>
              )
            },
          ]}
        />
      </Card>

      {/* ===== DRAWER SOẠN BÀI VIẾT ===== */}
      <Drawer
        title={<span style={{ fontSize: 17 }}>{editingPost ? '✏️ Chỉnh Sửa Bài Viết' : '📝 Tạo Bài Viết Mới'}</span>}
        width="82%"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button size="large" onClick={() => setDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSavePost} loading={postsLoading} size="large" style={{ minWidth: 130 }}>
              {editingPost ? '💾 Lưu thay đổi' : '🚀 Tạo bài viết'}
            </Button>
          </div>
        }
        destroyOnClose
      >
        <Row gutter={24}>
          {/* CỘT TRÁI */}
          <Col span={16}>
            <Form form={postForm} layout="vertical">
              <Form.Item label="Tiêu đề bài viết" name="title" rules={[{ required: true, message: 'Nhập tiêu đề!' }]}>
                <Input size="large" placeholder="Nhập tiêu đề bài viết..." />
              </Form.Item>
              <Form.Item label="Tóm tắt (hiển thị ở danh sách)" name="excerpt">
                <Input.TextArea rows={3} placeholder="Mô tả ngắn về bài viết..." maxLength={500} showCount />
              </Form.Item>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  Nội dung bài viết <span style={{ color: '#ff4d4f' }}>*</span>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>Hỗ trợ Markdown</span>
                </div>
                <div data-color-mode="light">
                  <MDEditor value={postContent} onChange={setPostContent} height={380} preview="live" visibleDragbar={false} />
                </div>
              </div>
            </Form>
          </Col>

          {/* CỘT PHẢI */}
          <Col span={8}>
            {/* TRẠNG THÁI XUẤT BẢN */}
            <Card title="⚡ Trạng thái xuất bản & Tin Hot" style={{ borderRadius: 10, marginBottom: 16 }}>
              <Form form={postForm} layout="vertical">
                <Form.Item name="isPublished" valuePropName="checked" style={{ marginBottom: 12 }}>
                  <Switch
                    checkedChildren={<span><EyeOutlined /> Hiển thị</span>}
                    unCheckedChildren={<span><EyeInvisibleOutlined /> Ẩn</span>}
                    style={{ width: '100%', justifyContent: 'center' }}
                  />
                </Form.Item>
                <Form.Item name="isHot" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Switch
                    checkedChildren={<span>🔥 Điểm Hot (Đẩy lên đầu)</span>}
                    unCheckedChildren={<span>🧊 Tin thường</span>}
                    style={{ width: '100%', justifyContent: 'center' }}
                  />
                </Form.Item>
                <div style={{ marginTop: 10, fontSize: 12, color: '#888' }}>
                  💡 Bài viết ẩn chỉ Admin thấy. Điểm Hot sẽ tự động đưa bài viết này lên vị trí đầu hàng ở các mục Trang Chủ.
                </div>
              </Form>
            </Card>

            {/* VỊ TRÍ ĐĂNG BÀI */}
            <Card title="📍 Phân loại & Vị trí đăng" style={{ borderRadius: 10, marginBottom: 16 }}>
              <Form form={postForm} layout="vertical">
                <Form.Item 
                  label="Danh mục hiển thị" 
                  name="categoryId" 
                  rules={[{ required: true, message: 'Chọn danh mục!' }]}
                  extra={
                    <span style={{ fontSize: 12, color: '#1890ff' }}>
                      💡 Chọn "Tiện Ích", "Khám Phá" hoặc "Câu Chuyện" để đưa bài viết lên các phân vùng Trang Chủ.
                    </span>
                  }
                >
                  <Select placeholder="-- Chọn danh mục --" size="large">
                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Vị trí đăng bài (Gắn phòng)"
                  name="roomTypeId"
                  extra={<span style={{ fontSize: 12, color: '#888' }}>Tùy chọn: Chọn một loại phòng nếu đây là bài viết giới thiệu cho riêng phòng đó. (Mặc định: Trang Tin Tức)</span>}
                  style={{ marginTop: 16 }}
                >
                  <Select placeholder="🌐 Trang Tin Tức (mặc định)" allowClear size="large">
                    {roomTypes.map(rt => <Option key={rt.id} value={rt.id}>🏨 {rt.name}</Option>)}
                  </Select>
                </Form.Item>
              </Form>
            </Card>

            {/* UPLOAD ẢNH */}
            <Card title="🖼️ Ảnh bìa bài viết" style={{ borderRadius: 10 }}>
              <Form form={postForm} layout="vertical">
                <Spin spinning={uploadingImg} description="Đang tải ảnh lên Cloudinary...">
                  <Upload.Dragger
                    name="file"
                    accept="image/*"
                    showUploadList={false}
                    customRequest={handleUploadImage}
                    style={{ borderRadius: 8, marginBottom: 12 }}
                  >
                    {previewImg ? (
                      <img src={previewImg} alt="preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 6 }} onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{ padding: '20px 0' }}>
                        <p style={{ fontSize: 28, margin: 0 }}>📁</p>
                        <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</p>
                        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>PNG, JPG, WEBP (tối đa 10MB)</p>
                      </div>
                    )}
                  </Upload.Dragger>
                </Spin>
                {previewImg && (
                  <Button size="small" danger block onClick={() => { setPreviewImg(''); postForm.setFieldValue('imageUrl', ''); }}>
                    🗑️ Xóa ảnh
                  </Button>
                )}
                <Form.Item name="imageUrl" style={{ display: 'none' }}><Input /></Form.Item>
              </Form>
            </Card>

            {/* UPLOAD ẢNH CHÈN NỘI DUNG */}
            <Card title="📎 Tải ảnh chèn vào bài viết" style={{ borderRadius: 10, marginTop: 16 }}>
              <Spin spinning={uploadingContentImg} description="Đang tải ảnh chèn nội dung...">
                <Upload.Dragger
                  name="file"
                  accept="image/*"
                  showUploadList={false}
                  customRequest={handleUploadContentImage}
                  style={{ borderRadius: 8 }}
                >
                  <div style={{ padding: '16px 0' }}>
                    <p style={{ fontSize: 24, margin: 0 }}>📷</p>
                    <p style={{ margin: '6px 0 2px', fontWeight: 500, fontSize: 13 }}>Tải lên & chèn tự động</p>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Click để đẩy ảnh từ máy lên Cloudinary</p>
                  </div>
                </Upload.Dragger>
              </Spin>
              <div style={{ marginTop: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>
                💡 Ảnh sẽ tự động chèn cú pháp Markdown vào cuối nội dung.
              </div>
            </Card>
          </Col>
        </Row>
      </Drawer>

      {/* ===== MODAL ĐIỂM THAM QUAN ===== */}
      <Modal
        title={editingAtt ? '✏️ Sửa Điểm Tham Quan' : '📍 Thêm Điểm Tham Quan'}
        open={attModalOpen} onCancel={() => setAttModalOpen(false)}
        onOk={handleSaveAtt} confirmLoading={attLoading}
        okText={editingAtt ? 'Lưu thay đổi' : 'Thêm mới'} cancelText="Hủy"
        width={680} centered destroyOnClose
      >
        <Form form={attForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tên điểm tham quan" name="name" rules={[{ required: true, message: 'Nhập tên!' }]}>
            <Input size="large" placeholder="VD: Cầu Vàng, Hồ Hoàn Kiếm..." />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về địa điểm..." maxLength={500} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item label="Khoảng cách từ khách sạn" name="distanceKm">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="2.5" addonAfter="km" />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item label="Điểm Hot 🔥" name="isHot" valuePropName="checked">
                <Switch checkedChildren="Hot 🔥" unCheckedChildren="Thường" />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
                <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="🖼️ Hình ảnh điểm tham quan">
            <Spin spinning={uploadingAttImg} description="Đang tải ảnh lên Cloudinary...">
              <Upload.Dragger
                name="file"
                accept="image/*"
                showUploadList={false}
                customRequest={handleUploadAttImage}
                style={{ borderRadius: 8, marginBottom: 12 }}
              >
                {previewAttImg ? (
                  <div style={{ position: 'relative' }}>
                    <img src={previewAttImg} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6 }} />
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <Button size="small" type="primary" danger onClick={(e) => { e.stopPropagation(); setPreviewAttImg(''); attForm.setFieldValue('imageUrl', ''); }}>
                        🗑️ Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 0' }}>
                    <p style={{ fontSize: 24, margin: 0 }}>📁</p>
                    <p style={{ margin: '6px 0 2px', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</p>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Tải ảnh bìa điểm tham quan lên Cloudinary</p>
                  </div>
                )}
              </Upload.Dragger>
            </Spin>
            <Form.Item name="imageUrl" style={{ display: 'none' }}><Input /></Form.Item>
          </Form.Item>

          <Form.Item label={
            <span style={{ fontWeight: 600 }}>
              🗺️ Vị trí trên bản đồ
              <span style={{ fontWeight: 400, fontSize: 12, color: '#888', marginLeft: 6 }}>
                — Tìm kiếm rồi chọn địa điểm để gắn bản đồ tự động
              </span>
            </span>
          }>
            <LocationPicker
              value={attLocation}
              onChange={(loc) => setAttLocation(loc)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`.w-md-editor{border-radius:8px!important}.w-md-editor-toolbar{border-radius:8px 8px 0 0!important}`}</style>
    </div>
  );
};

export default PostsManagement;
