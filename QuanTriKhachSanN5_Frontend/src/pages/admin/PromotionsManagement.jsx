import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Table, 
  Tag, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Modal, 
  Form, 
  message, 
  Tabs,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  GiftOutlined, 
  PlusOutlined, 
  SendOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CalendarOutlined,
  MailOutlined,
  SearchOutlined,
  PercentageOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import axiosClient from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const PromotionsManagement = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  
  // Search state
  const [searchText, setSearchText] = useState('');
  
  const [voucherForm] = Form.useForm();
  const [sendForm] = Form.useForm();

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const vRes = await axiosClient.get('/vouchers');
      setVouchers(vRes.data);
      
      const uRes = await axiosClient.get('/UserManagement');
      setUsers(uRes.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khuyến mãi:', error);
      message.error('Không thể tải danh sách voucher và người dùng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create/Update Voucher
  const handleSaveVoucher = async (values) => {
    try {
      const payload = {
        code: values.code,
        discountType: values.discountType,
        discountValue: values.discountValue,
        minBookingValue: values.minBookingValue || 0,
        validFrom: values.dateRange ? values.dateRange[0].toISOString() : null,
        validTo: values.dateRange ? values.dateRange[1].toISOString() : null,
        usageLimit: values.usageLimit || null
      };

      if (editingVoucher) {
        await axiosClient.put(`/vouchers/${editingVoucher.id}`, payload);
        message.success('Cập nhật mã khuyến mãi thành công!');
      } else {
        await axiosClient.post('/vouchers', payload);
        message.success('Tạo mã khuyến mãi mới thành công!');
      }
      
      setIsVoucherModalOpen(false);
      voucherForm.resetFields();
      setEditingVoucher(null);
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu voucher!';
      message.error(errMsg);
    }
  };

  // Handle Delete Voucher
  const handleDeleteVoucher = async (id) => {
    try {
      await axiosClient.delete(`/vouchers/${id}`);
      message.success('Xóa mã khuyến mãi thành công!');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Không thể xóa voucher!');
    }
  };

  // Handle Custom Send
  const handleSendCustom = async (values) => {
    try {
      setLoading(true);
      const payload = {
        userIds: values.userIds,
        title: values.title,
        content: values.content,
        voucherCode: values.voucherCode || null
      };

      await axiosClient.post('/vouchers/send-custom', payload);
      message.success('Đã gửi thư và quà tặng khuyến mãi tới khách hàng thành công!');
      sendForm.resetFields();
      setActiveTab('1');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Lỗi khi gửi thư khuyến mãi!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingVoucher(null);
    voucherForm.resetFields();
    setIsVoucherModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (record) => {
    setEditingVoucher(record);
    voucherForm.setFieldsValue({
      code: record.code,
      discountType: record.discountType,
      discountValue: record.discountValue,
      minBookingValue: record.minBookingValue,
      usageLimit: record.usageLimit,
      dateRange: record.validFrom && record.validTo ? [dayjs(record.validFrom), dayjs(record.validTo)] : null
    });
    setIsVoucherModalOpen(true);
  };

  // Table Columns
  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (text) => (
        <Tag color="gold" style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #d97706' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Loại giảm giá',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (type) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          {type === 'PERCENT' ? (
            <>
              <PercentageOutlined style={{ color: '#8b5cf6' }} />
              Phần trăm
            </>
          ) : (
            <>
              <DollarCircleOutlined style={{ color: '#10b981' }} />
              Số tiền cố định
            </>
          )}
        </span>
      )
    },
    {
      title: 'Giá trị giảm',
      dataIndex: 'discountValue',
      key: 'discountValue',
      render: (val, record) => (
        <Text strong style={{ color: record.discountType === 'PERCENT' ? '#8b5cf6' : '#10b981' }}>
          {record.discountType === 'PERCENT' ? `${val}%` : `${val.toLocaleString('vi-VN')} VNĐ`}
        </Text>
      )
    },
    {
      title: 'Đơn hàng tối thiểu',
      dataIndex: 'minBookingValue',
      key: 'minBookingValue',
      render: (val) => (
        <Text style={{ color: '#4b5563' }}>
          {val ? `${val.toLocaleString('vi-VN')} VNĐ` : 'Không giới hạn'}
        </Text>
      )
    },
    {
      title: 'Thời hạn sử dụng',
      key: 'validity',
      render: (_, record) => {
        if (!record.validFrom || !record.validTo) return <Tag color="cyan">Vô thời hạn</Tag>;
        const from = dayjs(record.validFrom).format('DD/MM/YYYY');
        const to = dayjs(record.validTo).format('DD/MM/YYYY');
        const now = dayjs();
        const expired = now.isAfter(dayjs(record.validTo));
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 13 }}>{from} - {to}</Text>
            {expired ? (
              <Badge status="error" text="Hết hạn" />
            ) : (
              <Badge status="processing" text="Đang hoạt động" />
            )}
          </Space>
        );
      }
    },
    {
      title: 'Lượt dùng tối đa',
      dataIndex: 'usageLimit',
      key: 'usageLimit',
      render: (val) => val ?? 'Vô hạn'
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined style={{ color: '#3b82f6' }} />} 
              onClick={() => openEditModal(record)} 
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa mã voucher này không?"
              onConfirm={() => handleDeleteVoucher(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined style={{ color: '#ef4444' }} />} 
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Filtering vouchers
  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '8px 24px 24px 24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#111827' }}>Quản lý Khuyến Mãi & Quà Tặng</Title>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Thiết kế các chương trình giảm giá và gửi lời chúc kèm voucher tới khách hàng</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large" 
          onClick={openCreateModal}
          style={{ borderRadius: 8, background: '#e6b83b', borderColor: '#e6b83b', color: '#1f2937', fontWeight: 600 }}
        >
          Tạo mã giảm giá mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <Tabs.TabPane tab={<span><GiftOutlined />Danh sách mã giảm giá</span>} key="1">
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 20, background: '#e6b83b', borderRadius: 2 }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Tất cả mã voucher đang chạy</span>
              </div>
            }
            extra={
              <Input 
                placeholder="Tìm kiếm mã voucher..." 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260, borderRadius: 8 }}
                allowClear
              />
            }
          >
            <Table 
              columns={columns} 
              dataSource={filteredVouchers} 
              rowKey="id" 
              loading={loading}
              pagination={{ pageSize: 8 }}
              style={{ overflowX: 'auto' }}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><MailOutlined />Gửi thư tay & Voucher custom</span>} key="2">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card 
                bordered={false} 
                style={{ borderRadius: 16, boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 20, background: '#8b5cf6', borderRadius: 2 }} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Gửi thư & mã giảm giá tùy chỉnh</span>
                  </div>
                }
              >
                <Form
                  form={sendForm}
                  layout="vertical"
                  onFinish={handleSendCustom}
                  requiredMark={false}
                >
                  <Form.Item
                    name="userIds"
                    label={<span style={{ fontWeight: 600, color: '#374151' }}>Chọn người nhận (User)</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một người nhận!' }]}
                  >
                    <Select 
                      mode="multiple" 
                      placeholder="Tìm và chọn một hoặc nhiều tài khoản..." 
                      style={{ width: '100%' }}
                      size="large"
                      optionFilterProp="children"
                    >
                      {users.map(u => (
                        <Option key={u.id} value={u.id}>
                          {u.fullName} ({u.email})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="voucherCode"
                    label={<span style={{ fontWeight: 600, color: '#374151' }}>Đính kèm voucher giảm giá (Tùy chọn)</span>}
                  >
                    <Select 
                      placeholder="Chọn mã voucher từ danh sách có sẵn..." 
                      allowClear 
                      size="large"
                    >
                      {vouchers.map(v => (
                        <Option key={v.code} value={v.code}>
                          {v.code} - Giảm {v.discountType === 'PERCENT' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()} VNĐ`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="title"
                    label={<span style={{ fontWeight: 600, color: '#374151' }}>Tiêu đề thư tay</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bức thư!' }]}
                  >
                    <Input placeholder="Ví dụ: Chúc mừng ngày hội thành viên / Tri ân khách hàng thân thiết..." size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>

                  <Form.Item
                    name="content"
                    label={<span style={{ fontWeight: 600, color: '#374151' }}>Nội dung chi tiết thư</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung bức thư!' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="Nhập lời chúc và thông điệp tri ân gửi đến khách hàng..." 
                      style={{ borderRadius: 8 }} 
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SendOutlined />} 
                      size="large"
                      loading={loading}
                      style={{ background: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: 8, height: 46, width: '100%', fontWeight: 600 }}
                    >
                      Gửi ngay tới hộp thư khách hàng
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card 
                title={<span style={{ fontWeight: 700, fontSize: 16 }}>💡 Mẹo gửi chiến dịch hiệu quả</span>}
                bordered={false} 
                style={{ borderRadius: 16, background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '1px solid #fde68a' }}
              >
                <Space direction="vertical" size={16} style={{ color: '#78350f' }}>
                  <Text style={{ color: '#78350f' }}>
                    1. <b>Tri ân khách hàng:</b> Bạn nên chọn đính kèm các mã giảm giá có giá trị cao để kích thích khách hàng trung thành quay lại đặt phòng.
                  </Text>
                  <Text style={{ color: '#78350f' }}>
                    2. <b>Cá nhân hóa nội dung:</b> Mặc dù gửi cho nhiều người, hãy nhập nội dung thân thiện, chân thành để nâng cao trải nghiệm khách hàng.
                  </Text>
                  <Text style={{ color: '#78350f' }}>
                    3. <b>Thời hạn sử dụng:</b> Hãy nhắc nhở khách hàng sử dụng mã giảm giá trước ngày hết hạn trong thư của họ.
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      {/* CREATE/EDIT MODAL */}
      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            {editingVoucher ? '✏️ Chỉnh sửa mã giảm giá' : '🎁 Tạo mã giảm giá mới'}
          </div>
        }
        open={isVoucherModalOpen}
        onCancel={() => setIsVoucherModalOpen(false)}
        footer={null}
        style={{ top: 60 }}
      >
        <Form
          form={voucherForm}
          layout="vertical"
          onFinish={handleSaveVoucher}
          requiredMark={false}
          style={{ paddingTop: 12 }}
          initialValues={{
            discountType: 'PERCENT',
            discountValue: 10,
            minBookingValue: 0
          }}
        >
          <Form.Item
            name="code"
            label={<span style={{ fontWeight: 600 }}>Mã Voucher</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mã voucher!' },
              { pattern: /^[A-Z0-9_-]+$/i, message: 'Chỉ chấp nhận chữ cái không dấu, số và ký tự - _' }
            ]}
          >
            <Input placeholder="Ví dụ: TRIAN2026, SUMMER25" size="large" style={{ borderRadius: 8, textTransform: 'uppercase' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label={<span style={{ fontWeight: 600 }}>Loại giảm giá</span>}
                rules={[{ required: true }]}
              >
                <Select size="large" style={{ width: '100%' }}>
                  <Option value="PERCENT">Phần trăm (%)</Option>
                  <Option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label={<span style={{ fontWeight: 600 }}>Giá trị giảm</span>}
                rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minBookingValue"
                label={<span style={{ fontWeight: 600 }}>Giá trị phòng tối thiểu</span>}
              >
                <InputNumber min={0} style={{ width: '100%' }} size="large" placeholder="Ví dụ: 500,000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="usageLimit"
                label={<span style={{ fontWeight: 600 }}>Lượt dùng tối đa</span>}
              >
                <InputNumber min={1} style={{ width: '100%' }} size="large" placeholder="Vô hạn" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label={<span style={{ fontWeight: 600 }}>Thời gian áp dụng</span>}
          >
            <RangePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 24 }}>
            <Button onClick={() => setIsVoucherModalOpen(false)} size="large" style={{ borderRadius: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 8, background: '#e6b83b', borderColor: '#e6b83b', color: '#1f2937', fontWeight: 600 }}>
              {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionsManagement;
