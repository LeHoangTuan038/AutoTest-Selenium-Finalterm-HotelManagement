import React, { useState, useEffect } from "react";
import { Button, Card, Typography, Divider, Table, Row, Col, message, Modal, Spin, Tag } from "antd";
import { PrinterOutlined, ExclamationCircleOutlined, RollbackOutlined, HistoryOutlined, EyeOutlined, QrcodeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import invoiceAPI from "../../api/invoiceAPI";
import momoAPI from "../../api/momoAPI";

const { Title, Text } = Typography;

const InvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Bắt ID trên thanh URL

  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [historyList, setHistoryList] = useState([]); // Chứa danh sách lịch sử
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // 🚨 TỰ ĐỘNG CHUYỂN ĐỔI: Có ID thì lấy 1 Hóa đơn, Không có ID thì lấy Lịch sử
  useEffect(() => {
    if (id) {
      fetchInvoiceDetail();
    } else {
      fetchHistoryList();
    }
  }, [id]);

  // 🚨 GỌI API LẤY MÃ QR VIETQR/MOMO KHI CÓ INVOICE DATA
  useEffect(() => {
    if (id && invoiceData) {
      fetchPaymentQR();
    }
  }, [id, invoiceData]);

  const fetchPaymentQR = async () => {
    setQrLoading(true);
    try {
      const res = await momoAPI.getPaymentQRByInvoiceId(id);
      setQrData(res.data);
    } catch (err) {
      message.error("Không thể tải mã QR thanh toán!");
    } finally {
      setQrLoading(false);
    }
  };

  // HÀM LẤY 1 HÓA ĐƠN
  const fetchInvoiceDetail = async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.getById(id);
      setInvoiceData(res.data);
    } catch (err) {
      message.error("Không thể tải thông tin hóa đơn!");
    } finally {
      setLoading(false);
    }
  };

  // HÀM LẤY LỊCH SỬ
  const fetchHistoryList = async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.getAll();
      setHistoryList(res.data);
    } catch (err) {
      message.error("Lỗi khi tải lịch sử hóa đơn!");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // Xác nhận lễ tân đã nhận tiền → cập nhật status Pending → Paid
  const handleConfirmPayment = () => {
    Modal.confirm({
      title: 'Xác nhận đã thanh toán?',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p>Xác nhận rằng khách hàng đã <b>thanh toán đầy đủ</b> hóa đơn này.</p>
          <p style={{ color: '#52c41a' }}>✅ Hóa đơn sẽ chuyển sang trạng thái <b>Đã thanh toán</b>.</p>
        </div>
      ),
      okText: 'Xác nhận đã nhận tiền',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await invoiceAPI.confirmPayment(id);
          message.success('Xác nhận thanh toán thành công!');
          fetchInvoiceDetail(); // Reload lại hóa đơn để cập nhật trạng thái
        } catch (err) {
          message.error(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán!');
        }
      }
    });
  };

  const handleCancelInvoice = () => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn HỦY hóa đơn này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Phòng sẽ được khôi phục về trạng thái "Đang ở".',
      okText: 'Xác nhận Hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          await invoiceAPI.cancel(id);
          message.success("Hủy hóa đơn thành công! Phòng đã được khôi phục.");
          navigate('/admin/checkout', { replace: true });
          window.location.reload();
        } catch (err) {
          message.error(err.response?.data?.message || "Lỗi khi hủy hóa đơn!");
        }
      }
    });
  };

  // ==========================================
  // CẤU HÌNH CỘT CHO CÁC BẢNG
  // ==========================================
  const roomColumns = [
    { title: 'Phòng', dataIndex: 'roomNumber', render: text => <b>P.{text}</b> },
    { title: 'Số đêm', dataIndex: 'nights', align: 'center' },
    { title: 'Đơn giá', dataIndex: 'pricePerNight', render: val => `${val?.toLocaleString()} đ` },
    { title: 'Thành tiền', dataIndex: 'lineTotal', align: 'right', render: val => <b>{val?.toLocaleString()} đ</b> },
  ];

  const serviceColumns = [
    { title: 'Dịch vụ / Phát sinh', dataIndex: 'serviceName' },
    { title: 'Số lượng', dataIndex: 'quantity', align: 'center' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', render: val => `${val?.toLocaleString()} đ` },
    { title: 'Thành tiền', dataIndex: 'total', align: 'right', render: val => <b>{val?.toLocaleString()} đ</b> },
  ];

  const penaltyColumns = [
    { title: 'Sự cố / Vật dụng hỏng', dataIndex: 'itemName', render: text => <Text type="danger">{text}</Text> },
    { title: 'Số lượng', dataIndex: 'quantity', align: 'center' },
    { title: 'Phí đền bù', dataIndex: 'penaltyAmount', align: 'right', render: val => <b style={{ color: '#f5222d' }}>{val?.toLocaleString()} đ</b> },
  ];

  // Helper hiển thị trạng thái hóa đơn
  const renderInvoiceStatus = (status) => {
    if (status === 'Cancelled' || status === 'Đã hủy') return <Tag color="red">Đã hủy</Tag>;
    if (status === 'Paid' || status === 'Đã thanh toán') return <Tag color="green">✅ Đã thanh toán</Tag>;
    return <Tag color="orange">⏳ Chờ thanh toán</Tag>;
  };

  // Bảng Lịch sử Hóa Đơn
  const historyColumns = [
    { title: 'Mã HĐ', dataIndex: 'id', render: id => <b>INV-{id}</b> },
    { title: 'Mã Đặt Phòng', dataIndex: 'bookingId', render: bookingId => `Booking #${bookingId}` },
    { title: 'Tổng tiền', dataIndex: 'finalTotal', align: 'right', render: val => <b style={{ color: '#f5222d' }}>{val?.toLocaleString()} đ</b> },
    {
      title: 'Trạng thái', dataIndex: 'status', align: 'center',
      render: status => renderInvoiceStatus(status)
    },
    {
      title: 'Thao tác', align: 'center',
      render: (_, record) => <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => navigate(`/admin/invoice/${record.id}`)}>Xem</Button>
    }
  ];

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  // =======================================================
  // 1. GIAO DIỆN LỊCH SỬ HÓA ĐƠN (KHI KHÔNG CÓ ID)
  // =======================================================
  if (!id) {
    return (
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <HistoryOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>Lịch Sử Hóa Đơn</Title>
              <Text type="secondary">Quản lý và tra cứu các hóa đơn đã xuất</Text>
            </div>
          </div>
          <Table columns={historyColumns} dataSource={historyList} rowKey="id" pagination={{ pageSize: 10 }} bordered />
        </Card>
      </div>
    );
  }

  // =======================================================
  // 2. GIAO DIỆN CHI TIẾT (TỜ HÓA ĐƠN A4) (KHI CÓ ID)
  // =======================================================
  if (!invoiceData) return <div style={{ textAlign: 'center', marginTop: 100 }}><h2>Không tìm thấy dữ liệu hóa đơn!</h2></div>;

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', background: '#f0f2f5', minHeight: '100vh' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 0; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Card id="printable-invoice" style={{ width: '100%', maxWidth: 800, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} styles={{ body: { padding: '40px' } }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 40 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>HOTEL IT CODE</Title>
            <Text type="secondary">123 Đường Lê Hoàng Tuấn, phường Biên Hòa, Thành phố Đồng Nai</Text>
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <Title level={3} style={{ margin: 0 }}>HÓA ĐƠN THANH TOÁN</Title>
            <Text strong>Mã Đơn: {invoiceData.bookingCode}</Text>
            <div style={{ marginTop: 8 }}>
              {invoiceData.status === 'Paid' || invoiceData.status === 'Đã thanh toán'
                ? <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>✅ ĐÃ THANH TOÁN</Tag>
                : invoiceData.status === 'Cancelled' || invoiceData.status === 'Đã hủy'
                  ? <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>❌ ĐÃ HỦY</Tag>
                  : <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>⏳ CHỜ THANH TOÁN</Tag>
              }
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#d9d9d9' }} />

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16 }}>Khách hàng: </Text>
          <Text style={{ fontSize: 16 }}>{invoiceData.guestName}</Text>
        </div>

        <Title level={5}>I. Chi phí lưu trú</Title>
        <Table columns={roomColumns} dataSource={invoiceData.roomDetails} pagination={false} size="small" rowKey="roomNumber" bordered style={{ marginBottom: 24 }} />

        {invoiceData.serviceDetails && invoiceData.serviceDetails.length > 0 && (
          <>
            <Title level={5}>II. Dịch vụ & Phụ thu</Title>
            <Table columns={serviceColumns} dataSource={invoiceData.serviceDetails} pagination={false} size="small" rowKey="serviceName" bordered style={{ marginBottom: 24 }} />
          </>
        )}

        {invoiceData.penaltyDetails && invoiceData.penaltyDetails.length > 0 && (
          <>
            <Title level={5} type="danger">III. Phí đền bù & Phạt sự cố</Title>
            <Table columns={penaltyColumns} dataSource={invoiceData.penaltyDetails} pagination={false} size="small" rowKey="itemName" bordered style={{ marginBottom: 24 }} />
          </>
        )}

        <Divider style={{ borderColor: '#d9d9d9' }} />

        <Row justify="space-between">
          <Col span={10} style={{ textAlign: 'center' }}>
            <Title level={5}>Quét mã QR để thanh toán <QrcodeOutlined /></Title>
            {qrLoading ? (
              <div style={{ marginBottom: 8 }}><Spin size="small" /></div>
            ) : qrData ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <img src={qrData.qrImageUrl || qrData.qrDataUrl} alt="Payment QR" style={{ width: 180, height: 180, objectFit: 'contain' }} />
                </div>
                <Text type="secondary">{qrData.bankName || qrData.provider} - {qrData.accountName}</Text>
                <br />
                <Text strong style={{ color: '#f5222d' }}>{qrData.amount?.toLocaleString()} đ</Text>
              </>
            ) : (
              <Text type="danger">Không thể tải mã QR</Text>
            )}
          </Col>
          <Col span={10}>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Cộng tiền phòng:</Text>
              <Text strong>{invoiceData.totalRoomAmount?.toLocaleString()} đ</Text>
            </Row>
            {invoiceData.discountAmount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8, color: '#52c41a' }}>
                <Text style={{ color: '#52c41a' }}>Giảm giá phòng (Voucher):</Text>
                <Text strong style={{ color: '#52c41a' }}>- {invoiceData.discountAmount?.toLocaleString()} đ</Text>
              </Row>
            )}
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Cộng dịch vụ:</Text>
              <Text strong>{invoiceData.totalServiceAmount?.toLocaleString()} đ</Text>
            </Row>
            {invoiceData.totalPenaltyAmount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Text type="danger">Cộng tiền phạt:</Text>
                <Text strong type="danger">{invoiceData.totalPenaltyAmount?.toLocaleString()} đ</Text>
              </Row>
            )}
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Thuế VAT (8%):</Text>
              <Text strong>{invoiceData.taxAmount?.toLocaleString()} đ</Text>
            </Row>
            {invoiceData.depositAmount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Text style={{ color: '#52c41a' }}>Tiền đặt cọc (Đã trừ):</Text>
                <Text strong style={{ color: '#52c41a' }}>- {invoiceData.depositAmount?.toLocaleString()} đ</Text>
              </Row>
            )}
            <Divider style={{ margin: '12px 0' }} />
            <Row justify="space-between" align="middle">
              <Title level={4} style={{ margin: 0, color: '#f5222d' }}>TỔNG THANH TOÁN:</Title>
              <Title level={4} style={{ margin: 0, color: '#f5222d' }}>{invoiceData.finalTotal?.toLocaleString()} đ</Title>
            </Row>
          </Col>
        </Row>

        {/* CÁC NÚT BẤM */}
        <div className="no-print" style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Nút Xác nhận thanh toán - chỉ hiện khi đang Pending */}
          {invoiceData.status !== 'Paid' && invoiceData.status !== 'Đã thanh toán' && invoiceData.status !== 'Cancelled' && invoiceData.status !== 'Đã hủy' && (
            <Button
              size="large"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirmPayment}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Xác nhận đã thanh toán
            </Button>
          )}
          <Button size="large" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>In Hóa Đơn</Button>
          {/* Chỉ cho hủy khi đang Pending */}
          {invoiceData.status !== 'Paid' && invoiceData.status !== 'Đã thanh toán' && (
            <Button size="large" danger icon={<RollbackOutlined />} onClick={handleCancelInvoice}>Bỏ Hóa Đơn</Button>
          )}
          <Button size="large" icon={<HistoryOutlined />} onClick={() => navigate('/admin/invoice')}>Lịch sử Hóa Đơn</Button>
        </div>
      </Card>
    </div>
  );
};

export default InvoicePage;
