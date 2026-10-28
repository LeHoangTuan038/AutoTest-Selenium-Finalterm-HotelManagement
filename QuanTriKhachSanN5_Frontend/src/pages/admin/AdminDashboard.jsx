import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Select, 
  Table, 
  Tag, 
  Input, 
  Spin, 
  message, 
  Badge,
  Tooltip,
  Modal
} from 'antd';
import { 
  DollarOutlined, 
  CalendarOutlined, 
  PieChartOutlined, 
  UserAddOutlined, 
  ArrowUpOutlined, 
  DownloadOutlined, 
  ReloadOutlined, 
  SearchOutlined,
  EyeOutlined,
  RiseOutlined
} from '@ant-design/icons';
import axiosClient from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Khởi tạo dữ liệu thực tế trống để hiển thị chính xác 100% dữ liệu từ CSDL
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 0,
      revenueGrowth: 0,
      totalBookings: 0,
      bookingsGrowth: 0,
      occupancyRate: 0,
      occupancyGrowth: 0,
      newCustomers: 0,
      customersGrowth: 0
    },
    revenueChart: [
      { month: 'Tháng 1', revenue: 0 },
      { month: 'Tháng 2', revenue: 0 },
      { month: 'Tháng 3', revenue: 0 },
      { month: 'Tháng 4', revenue: 0 },
      { month: 'Tháng 5', revenue: 0 },
      { month: 'Tháng 6', revenue: 0 },
    ],
    roomStatus: {
      booked: 0,
      available: 0,
      maintenance: 0
    },
    recentBookings: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Gọi API backend thông qua axiosClient đã cấu hình sẵn baseURL (localhost:5070)
      const res = await axiosClient.get('/dashboard/admin', { params: { period } });
      if (res.data && res.data.summary) {
        setDashboardData(res.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard từ CSDL SQL:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Bộ lọc danh sách đặt phòng
  const filteredBookings = dashboardData.recentBookings.filter(item => {
    const matchSearch = item.customer.toLowerCase().includes(searchText.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Mã ĐP',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text style={{ fontWeight: 600, color: '#3b82f6' }}>{text}</Text>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => <Text style={{ fontWeight: 500 }}>{text}</Text>
    },
    {
      title: 'Loại phòng',
      dataIndex: 'roomType',
      key: 'roomType',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'date',
      key: 'date',
      render: (text) => <Text style={{ color: '#8c8c8c' }}>{dayjs(text).format('DD/MM/YYYY')}</Text>
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text style={{ fontWeight: 600, color: '#10b981' }}>{amount.toLocaleString('vi-VN')} VNĐ</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Hoàn thành') color = 'success';
        if (status === 'Chờ xử lý') color = 'warning';
        if (status === 'Đã hủy') color = 'error';
        return <Tag color={color} style={{ borderRadius: 6, px: 8, py: 2 }}>{status}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button 
            type="text" 
            icon={<EyeOutlined style={{ color: '#3b82f6' }} />} 
            size="small" 
            onClick={() => {
              setSelectedBooking(record);
              setIsDetailModalOpen(true);
            }}
          />
        </Tooltip>
      )
    }
  ];

  // Tính toán thông số cho biểu đồ SVG
  const maxRevenue = Math.max(...dashboardData.revenueChart.map(d => d.revenue), 140000000);
  const chartHeight = 260;
  const chartWidth = 700;
  
  const getCoordinates = (index, value) => {
    const x = (index / (dashboardData.revenueChart.length - 1)) * (chartWidth - 80) + 40;
    const y = chartHeight - (value / maxRevenue) * (chartHeight - 60) - 30;
    return { x, y };
  };

  const points = dashboardData.revenueChart.map((d, i) => {
    const coord = getCoordinates(i, d.revenue);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  const areaPoints = dashboardData.revenueChart.length > 0 ? 
    `40,${chartHeight - 30} ${points} ${chartWidth - 40},${chartHeight - 30}` : '';

  // Tổng số phòng cho Doughnut chart
  const totalRooms = (dashboardData.roomStatus.booked + dashboardData.roomStatus.available + dashboardData.roomStatus.maintenance) || 1;

  return (
    <div style={{ padding: '8px 0', fontFamily: "'Inter', sans-serif" }}>
      {/* Tiêu đề & Công cụ điều khiển */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Tổng quan hệ thống</Title>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Theo dõi hoạt động kinh doanh và hiệu suất vận hành khách sạn</Text>
        </div>
        <Space size={12}>
          <Select value={period} onChange={setPeriod} style={{ width: 140 }} size="large">
            <Option value="day">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
            <Option value="year">Năm nay</Option>
          </Select>
          <Button type="primary" icon={<DownloadOutlined />} size="large" style={{ borderRadius: 8, background: '#3b82f6' }}>
            Xuất báo cáo
          </Button>
          <Button icon={<ReloadOutlined />} size="large" onClick={fetchDashboardData} style={{ borderRadius: 8 }}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* TOP ROW: 4 KPI Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
          {/* Card 1: Tổng doanh thu */}
          <Col xs={24} sm={12} xl={6}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                transition: 'transform 0.3s, boxShadow 0.3s',
                cursor: 'pointer'
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}>Tổng doanh thu</Text>
                  <Title level={3} style={{ margin: '8px 0 12px 0', fontWeight: 700, color: '#111827', fontSize: 26 }}>
                    {dashboardData.summary.totalRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: 18, fontWeight: 600 }}>VNĐ</span>
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                      +{dashboardData.summary.revenueGrowth}%
                    </Tag>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>so với tháng trước</Text>
                  </div>
                </div>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: '#fef3c7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <DollarOutlined style={{ fontSize: 28, color: '#d97706' }} />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 2: Đặt phòng */}
          <Col xs={24} sm={12} xl={6}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                transition: 'transform 0.3s, boxShadow 0.3s',
                cursor: 'pointer'
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}>Đặt phòng</Text>
                  <Title level={3} style={{ margin: '8px 0 12px 0', fontWeight: 700, color: '#111827', fontSize: 26 }}>
                    {dashboardData.summary.totalBookings.toLocaleString('vi-VN')}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                      +{dashboardData.summary.bookingsGrowth}%
                    </Tag>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>so với tháng trước</Text>
                  </div>
                </div>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: '#dbeafe', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CalendarOutlined style={{ fontSize: 28, color: '#2563eb' }} />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 3: Tỷ lệ lấp đầy */}
          <Col xs={24} sm={12} xl={6}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                transition: 'transform 0.3s, boxShadow 0.3s',
                cursor: 'pointer'
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}>Tỷ lệ lấp đầy</Text>
                  <Title level={3} style={{ margin: '8px 0 12px 0', fontWeight: 700, color: '#111827', fontSize: 26 }}>
                    {dashboardData.summary.occupancyRate}%
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                      +{dashboardData.summary.occupancyGrowth}%
                    </Tag>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>so với tháng trước</Text>
                  </div>
                </div>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: '#f3e8ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <RiseOutlined style={{ fontSize: 28, color: '#9333ea' }} />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 4: Khách hàng mới */}
          <Col xs={24} sm={12} xl={6}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                transition: 'transform 0.3s, boxShadow 0.3s',
                cursor: 'pointer'
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}>Khách hàng mới</Text>
                  <Title level={3} style={{ margin: '8px 0 12px 0', fontWeight: 700, color: '#111827', fontSize: 26 }}>
                    {dashboardData.summary.newCustomers.toLocaleString('vi-VN')}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                      +{dashboardData.summary.customersGrowth}%
                    </Tag>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>so với tháng trước</Text>
                  </div>
                </div>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: '#cffafe', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <UserAddOutlined style={{ fontSize: 28, color: '#0891b2' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* MIDDLE ROW: Biểu đồ doanh thu & Trạng thái phòng */}
        <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
          {/* Main Revenue Chart (2/3) */}
          <Col xs={24} lg={16}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                height: '100%'
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 20, background: '#3b82f6', borderRadius: 2 }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Thống kê doanh thu theo thời gian</span>
                </div>
              }
              extra={
                <Space>
                  <Tag color="blue" style={{ borderRadius: 6 }}>Năm 2026</Tag>
                </Space>
              }
            >
              {/* Biểu đồ SVG mượt mà và cao cấp */}
              <div style={{ width: '100%', overflowX: 'auto', paddingTop: 10 }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', minWidth: 500 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Lưới ngang */}
                  {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                    const y = (chartHeight - 60) * ratio;
                    const val = Math.round(maxRevenue * (1 - ratio));
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2={chartWidth - 40} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="35" y={y + 4} fill="#9ca3af" fontSize="10" textAnchor="end">{val / 1000000}M</text>
                      </g>
                    );
                  })}
                  <line x1="40" y1={chartHeight - 30} x2={chartWidth - 40} y2={chartHeight - 30} stroke="#e5e7eb" strokeWidth="2" />

                  {/* Vùng Area gradient */}
                  {areaPoints && (
                    <polygon points={areaPoints} fill="url(#areaGradient)" />
                  )}

                  {/* Đường Line */}
                  <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Các điểm dữ liệu & Tên tháng */}
                  {dashboardData.revenueChart.map((d, i) => {
                    const coord = getCoordinates(i, d.revenue);
                    return (
                      <g key={i}>
                        <circle cx={coord.x} cy={coord.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" style={{ cursor: 'pointer', transition: 'r 0.2s' }} />
                        <text x={coord.x} y={coord.y - 12} fill="#1f2937" fontSize="11" fontWeight="600" textAnchor="middle">
                          {(d.revenue / 1000000).toFixed(1)}M
                        </text>
                        <text x={coord.x} y={chartHeight - 10} fill="#6b7280" fontSize="12" fontWeight="500" textAnchor="middle">{d.month}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
          </Col>

          {/* Room Status Doughnut Chart (1/3) */}
          <Col xs={24} lg={8}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                background: '#ffffff', 
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                height: '100%'
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 20, background: '#10b981', borderRadius: 2 }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Trạng thái phòng</span>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
                {/* Custom SVG Doughnut Chart */}
                <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {/* Circle 1: Đã đặt (Blue) */}
                    <circle 
                      cx="50" cy="50" r="38" 
                      fill="transparent" 
                      stroke="#3b82f6" 
                      strokeWidth="16"
                      strokeDasharray={`${(dashboardData.roomStatus.booked / totalRooms) * 238.76} 238.76`}
                      strokeDashoffset="0"
                    />
                    {/* Circle 2: Trống (Green) */}
                    <circle 
                      cx="50" cy="50" r="38" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="16"
                      strokeDasharray={`${(dashboardData.roomStatus.available / totalRooms) * 238.76} 238.76`}
                      strokeDashoffset={`-${(dashboardData.roomStatus.booked / totalRooms) * 238.76}`}
                    />
                    {/* Circle 3: Bảo trì (Red) */}
                    <circle 
                      cx="50" cy="50" r="38" 
                      fill="transparent" 
                      stroke="#ef4444" 
                      strokeWidth="16"
                      strokeDasharray={`${(dashboardData.roomStatus.maintenance / totalRooms) * 238.76} 238.76`}
                      strokeDashoffset={`-${((dashboardData.roomStatus.booked + dashboardData.roomStatus.available) / totalRooms) * 238.76}`}
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>Tổng số phòng</Text>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 28 }}>{totalRooms}</Title>
                  </div>
                </div>

                {/* Legend chi tiết */}
                <div style={{ width: '100%', marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge color="#3b82f6" />
                      <Text style={{ fontWeight: 500, color: '#1f2937' }}>Đã đặt</Text>
                    </div>
                    <Space size={16}>
                      <Text style={{ fontWeight: 600, color: '#3b82f6' }}>{dashboardData.roomStatus.booked} phòng</Text>
                      <Text style={{ color: '#64748b' }}>({Math.round((dashboardData.roomStatus.booked/totalRooms)*100)}%)</Text>
                    </Space>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge color="#10b981" />
                      <Text style={{ fontWeight: 500, color: '#1f2937' }}>Trống</Text>
                    </div>
                    <Space size={16}>
                      <Text style={{ fontWeight: 600, color: '#10b981' }}>{dashboardData.roomStatus.available} phòng</Text>
                      <Text style={{ color: '#64748b' }}>({Math.round((dashboardData.roomStatus.available/totalRooms)*100)}%)</Text>
                    </Space>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge color="#ef4444" />
                      <Text style={{ fontWeight: 500, color: '#1f2937' }}>Bảo trì</Text>
                    </div>
                    <Space size={16}>
                      <Text style={{ fontWeight: 600, color: '#ef4444' }}>{dashboardData.roomStatus.maintenance} phòng</Text>
                      <Text style={{ color: '#64748b' }}>({Math.round((dashboardData.roomStatus.maintenance/totalRooms)*100)}%)</Text>
                    </Space>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* BOTTOM ROW: Bảng danh sách đặt phòng gần đây */}
        <Card 
          bordered={false} 
          style={{ 
            borderRadius: 16, 
            background: '#ffffff', 
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            border: '1px solid #f3f4f6'
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 20, background: '#f59e0b', borderRadius: 2 }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Danh sách đặt phòng gần đây</span>
            </div>
          }
          extra={
            <Space size={12}>
              <Input 
                placeholder="Tìm mã ĐP / khách hàng..." 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220, borderRadius: 8 }}
                allowClear
              />
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140, borderRadius: 8 }}>
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="Hoàn thành">Hoàn thành</Option>
                <Option value="Chờ xử lý">Chờ xử lý</Option>
                <Option value="Đã hủy">Đã hủy</Option>
              </Select>
            </Space>
          }
        >
          <Table 
            columns={columns} 
            dataSource={filteredBookings} 
            rowKey="id" 
            pagination={{ pageSize: 5 }}
            style={{ overflowX: 'auto' }}
          />
        </Card>

        {/* MODAL CHI TIẾT ĐẶT PHÒNG CAO CẤP */}
        <Modal 
          title={<div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>🏷️ Chi Tiết Đơn Đặt Phòng</div>}
          open={isDetailModalOpen} 
          onCancel={() => setIsDetailModalOpen(false)} 
          footer={[
            <Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)} style={{ borderRadius: 8, background: '#3b82f6' }}>
              Đóng
            </Button>
          ]}
          style={{ top: 40 }}
        >
          {selectedBooking && (
            <div style={{ padding: '16px 0', fontSize: 15, color: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Mã Đơn:</Text>
                <Text strong style={{ color: '#3b82f6', fontSize: 16 }}>{selectedBooking.id}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Khách Hàng:</Text>
                <Text strong>{selectedBooking.customer}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Số Điện Thoại:</Text>
                <Text strong>{selectedBooking.phone || 'N/A'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Email:</Text>
                <Text strong>{selectedBooking.email || 'N/A'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Loại Phòng:</Text>
                <Tag color="blue" style={{ fontSize: 14 }}>{selectedBooking.roomType}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Ngày Nhận Phòng:</Text>
                <Text strong>{dayjs(selectedBooking.date).format('DD/MM/YYYY')}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <Text style={{ color: '#6b7280' }}>Tổng Tiền:</Text>
                <Text strong style={{ color: '#10b981', fontSize: 18 }}>{selectedBooking.amount.toLocaleString('vi-VN')} VNĐ</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                <Text style={{ color: '#6b7280' }}>Trạng Thái:</Text>
                <Tag color={selectedBooking.status === 'Hoàn thành' ? 'success' : selectedBooking.status === 'Chờ xử lý' ? 'warning' : 'error'} style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedBooking.status}
                </Tag>
              </div>
            </div>
          )}
        </Modal>
      </Spin>
    </div>
  );
};

export default AdminDashboard;