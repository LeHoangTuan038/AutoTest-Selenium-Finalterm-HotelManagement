import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Tag, Space, message, Typography, 
  Popconfirm, Card, Image, Tooltip, Empty 
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  ClockCircleOutlined, PictureOutlined, ReloadOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { roleAPI } from '../../api/roleApi';
import { auditLogger } from '../../utils/auditLogger';
import { useDamageEventStore } from '../../store/damageEventStore';

const { Title, Text } = Typography;

const LossAndDamageManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🚨 BÍ KÍP MỚI TẠI ĐÂY: Móc trực tiếp cái biến tín hiệu ra (Cách này 1000% không bao giờ xịt)
  const lastDamageUpdate = useDamageEventStore((state) => state.lastDamageUpdate);

  // --- 1. LẤY DỮ LIỆU TỪ BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5070/api/LossAndDamages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Đưa biên bản mới nhất lên đầu bảng
      const sortedData = res.data.sort((a, b) => b.id - a.id);
      setData(sortedData);
    } catch (error) {
      console.error("Lỗi fetch biên bản:", error);
      message.error("Không tải được danh sách biên bản đền bù!");
    } finally {
      setLoading(false);
    }
  };

  // Chạy lần đầu tiên khi vừa mở trang
  useEffect(() => {
    fetchData();
  }, []);

  // Lắng nghe mỗi khi có ai đó bấm nút "Báo hỏng" hoặc "Thay mới" ở trang khác
  useEffect(() => {
    if (lastDamageUpdate > 0) {
      console.log('🔄 Đã nhận tín hiệu có thay đổi, tự động tải lại bảng đền bù...');
      fetchData();
    }
  }, [lastDamageUpdate]); // Bất cứ khi nào lastDamageUpdate thay đổi số, nó sẽ tự gọi fetchData()

  // --- 2. CẬP NHẬT TRẠNG THÁI BIÊN BẢN ---
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const currentRecord = data.find(item => item.id === id);
      
      // Gửi raw string bọc trong ngoặc kép theo chuẩn ASP.NET [FromBody]
      await axios.put(`http://localhost:5070/api/LossAndDamages/status/${id}`, 
        `"${newStatus}"`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
          }
        }
      );
      
      auditLogger.success(`Đã cập nhật trạng thái biên bản #DB${id} thành: ${newStatus}`, {
        action: 'Cập nhật',
        actionType: 'UPDATE',
        module: 'Biên Bản Thiệt Hại',
        objectName: `Biên bản #DB${id}`,
        description: `Cập nhật trạng thái biên bản thành: ${newStatus}`,
        oldValue: { status: currentRecord?.status },
        newValue: { status: newStatus },
      });
      
      message.success(`Đã cập nhật trạng thái: ${newStatus}`);
      
      // Thông báo cho toàn hệ thống cập nhật lại số liệu hỏng hóc
      useDamageEventStore.getState().triggerDamageUpdate();
      
      fetchData(); 
    } catch (error) {
      message.error("Lỗi cập nhật! Kiểm tra lại kết nối Server.");
    }
  };

  // --- 3. ĐỊNH NGHĨA CÁC CỘT CỦA BẢNG ---
  const columns = [
    {
      title: 'Mã số',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      align: 'center',
      render: (id) => <Tag color="blue">#DB{id}</Tag>
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      align: 'center',
      render: (url) => url ? (
        <Image 
          src={url} 
          width={60} 
          height={45} 
          style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }} 
          fallback="https://via.placeholder.com/60?text=No+Img"
        />
      ) : (
        <div style={{ backgroundColor: '#fafafa', padding: '8px', borderRadius: 4 }}>
          <PictureOutlined style={{ color: '#bfbfbf', fontSize: 20 }} />
        </div>
      )
    },
    {
      title: 'Nội dung sự cố',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#141414' }}>{text || 'Chưa có mô tả'}</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Kiểm tra lúc báo hỏng
          </div>
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty) => <b style={{ fontSize: 16 }}>{qty}</b>
    },
    {
      title: 'Tiền đền bù',
      dataIndex: 'penaltyAmount',
      key: 'penaltyAmount',
      width: 150,
      render: (val) => (
        <Text type="danger" strong style={{ fontSize: 16 }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)}
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (status) => {
        let config = { color: 'gold', text: 'CHỜ XỬ LÝ' };
        if (status === 'Đã đền bù') config = { color: 'green', text: 'ĐÃ THU TIỀN' };
        if (status === 'Đã hủy' || status === 'Hủy') config = { color: 'red', text: 'ĐÃ HỦY PHẠT' };
        
        return (
          <Tag color={config.color} style={{ fontWeight: 'bold', borderRadius: 10, padding: '2px 10px' }}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác Lễ tân',
      key: 'action',
      width: 220,
      align: 'center',
      render: (_, record) => {
        const isDone = record.status === 'Đã đền bù' || record.status === 'Đã hủy';
        
        return (
          <Space>
            <Popconfirm
              title="Khách đã nộp tiền?"
              onConfirm={() => handleUpdateStatus(record.id, 'Đã đền bù')}
              disabled={isDone}
              okText="Xác nhận"
              cancelText="Đóng"
            >
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  disabled={isDone}
                  style={!isDone ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
                >
                  Thu tiền
                </Button>
            </Popconfirm>

            <Popconfirm
              title="Xác nhận hủy biên bản này?"
              onConfirm={() => handleUpdateStatus(record.id, 'Đã hủy')}
              disabled={isDone}
              okText="Hủy phạt"
              okType="danger"
            >
              <Button danger icon={<CloseCircleOutlined />} disabled={isDone} ghost>
                Hủy
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px 40px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        bordered={false} 
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Quản Lý Đền Bù Tài Sản</Title>
            <Text type="secondary">Danh sách biên bản hỏng hóc, mất mát cần Lễ tân xử lý thu tiền</Text>
          </div>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{ pageSize: 7 }}
          locale={{ 
            emptyText: <Empty description="Hiện không có biên bản đền bù nào cần xử lý." /> 
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default LossAndDamageManagement;