import React, { useState, useEffect } from "react";
import { Card, Typography, Table, Button, Tag, Space, message } from "antd";
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import invoiceAPI from "../../api/invoiceAPI"; // Đảm bảo đường dẫn API đúng

const { Title, Text } = Typography;

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gọi API lấy toàn bộ hóa đơn khi vào trang
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await invoiceAPI.getAll(); 
        setInvoices(res.data);
      } catch (err) {
        message.error("Lỗi khi tải danh sách hóa đơn!");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Chuyển hướng sang trang Chi tiết Hóa đơn (cái trang A4 ní vừa làm)
  const handleViewInvoice = (invoiceId) => {
    navigate(`/admin/invoice/${invoiceId}`);
  };

  const columns = [
    { 
      title: 'Mã Hóa Đơn', 
      dataIndex: 'id', 
      key: 'id',
      render: (id) => <Text strong>INV-{id}</Text> 
    },
    { 
      title: 'Tổng Thanh Toán', 
      dataIndex: 'finalTotal', 
      key: 'finalTotal',
      align: 'right',
      render: (total) => <Text strong style={{ color: '#f5222d' }}>{total?.toLocaleString()} đ</Text> 
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'status', 
      key: 'status',
      align: 'center',
      render: (status) => {
        if (status === 'Cancelled' || status === 'Đã hủy') {
          return <Tag color="red">Đã Hủy</Tag>;
        }
        return <Tag color="green">Đã Thanh Toán</Tag>;
      }
    },
    { 
      title: 'Thao Tác', 
      key: 'action', 
      align: 'center',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EyeOutlined />} 
          onClick={() => handleViewInvoice(record.id)}
        >
          Xem chi tiết
        </Button>
      ) 
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <FileTextOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Lịch Sử Hóa Đơn</Title>
            <Text type="secondary">Quản lý và tra cứu các hóa đơn đã xuất</Text>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={invoices} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Card>
    </div>
  );
};

export default InvoiceHistory;