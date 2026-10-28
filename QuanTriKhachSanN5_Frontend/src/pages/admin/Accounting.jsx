import React, { useState, useEffect } from "react";
import { Table, Card, Row, Col, Statistic, DatePicker, Button, Space, Input, Tag, Select, message, Spin, Tooltip } from "antd";
import { 
  DollarOutlined, 
  SearchOutlined, 
  DownloadOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  PercentageOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Accounting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState(null);
  const [timePreset, setTimePreset] = useState("ALL");

  // Fetch data
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/Invoices/report`);
      setInvoices(response.data || []);
      setFilteredInvoices(response.data || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu kế toán:", error);
      message.error("Không thể kết nối đến máy chủ để tải dữ liệu kế toán!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter handler
  useEffect(() => {
    let result = [...invoices];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(inv => inv.status === statusFilter);
    }

    // Search text filter
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        inv => 
          inv.bookingCode.toLowerCase().includes(lowerSearch) ||
          inv.guestName.toLowerCase().includes(lowerSearch) ||
          inv.id.toString().includes(lowerSearch)
      );
    }

    // Date preset or custom date range filter
    const now = dayjs();
    if (timePreset === "TODAY") {
      result = result.filter(inv => dayjs(inv.createdDate).isSame(now, "day"));
    } else if (timePreset === "WEEK") {
      result = result.filter(inv => dayjs(inv.createdDate).isAfter(now.subtract(7, "day")));
    } else if (timePreset === "MONTH") {
      result = result.filter(inv => dayjs(inv.createdDate).isSame(now, "month"));
    } else if (timePreset === "YEAR") {
      result = result.filter(inv => dayjs(inv.createdDate).isSame(now, "year"));
    } else if (timePreset === "CUSTOM" && dateRange) {
      const [start, end] = dateRange;
      result = result.filter(inv => {
        const cDate = dayjs(inv.createdDate);
        return cDate.isAfter(start.startOf("day")) && cDate.isBefore(end.endOf("day"));
      });
    }

    setFilteredInvoices(result);
  }, [searchText, statusFilter, dateRange, timePreset, invoices]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      message.warning("Không có dữ liệu hóa đơn nào để xuất!");
      return;
    }

    const headers = [
      "Mã hóa đơn",
      "Mã đặt phòng",
      "Tên khách hàng",
      "Số điện thoại",
      "Tiền phòng (VND)",
      "Tiền dịch vụ (VND)",
      "Chiết khấu (VND)",
      "Thuế VAT 8% (VND)",
      "Tổng thanh toán (VND)",
      "Ngày tạo",
      "Trạng thái"
    ];

    const rows = filteredInvoices.map(inv => [
      `HD${inv.id.toString().PadLeft?.(5, "0") || inv.id}`,
      inv.bookingCode,
      inv.guestName,
      inv.guestPhone,
      inv.totalRoomAmount,
      inv.totalServiceAmount,
      inv.discountAmount,
      inv.taxAmount,
      inv.finalTotal,
      dayjs(inv.createdDate).format("YYYY-MM-DD HH:mm"),
      inv.status === "Paid" ? "Đã thanh toán" : inv.status === "Pending" ? "Chờ thanh toán" : "Đã hủy"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BaoCaoKeToan_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Xuất file báo cáo kế toán CSV thành công!");
  };

  // Calculations for KPI Cards (based on filtered invoices)
  const paidInvoices = filteredInvoices.filter(inv => inv.status === "Paid" || inv.status === "Completed" || inv.status === "Đã thanh toán");
  const totalRoomRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalRoomAmount, 0);
  const totalServiceRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalServiceAmount, 0);
  const totalDiscount = paidInvoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalTax = paidInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
  const netRevenue = paidInvoices.reduce((sum, inv) => sum + inv.finalTotal, 0);

  // Group revenue by date for the Chart
  const getChartData = () => {
    const dailyMap = {};
    paidInvoices.forEach(inv => {
      const dateStr = dayjs(inv.createdDate).format("DD/MM");
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + inv.finalTotal;
    });

    const dates = Object.keys(dailyMap).sort((a, b) => {
      const [dayA, monthA] = a.split("/").map(Number);
      const [dayB, monthB] = b.split("/").map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

    return dates.map(date => ({
      date,
      amount: dailyMap[date]
    })).slice(-7); // Keep last 7 active days
  };

  const chartData = getChartData();
  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 1000000;

  const columns = [
    {
      title: "Mã HĐ",
      dataIndex: "id",
      key: "id",
      render: (id) => <span style={{ fontWeight: 600, color: "#1890ff" }}>HD{id.toString().padStart(5, '0')}</span>,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Mã Đặt Phòng",
      dataIndex: "bookingCode",
      key: "bookingCode",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Khách Hàng",
      dataIndex: "guestName",
      key: "guestName",
      fontWeight: 500,
    },
    {
      title: "Tiền Phòng",
      dataIndex: "totalRoomAmount",
      key: "totalRoomAmount",
      render: (val) => <span>{val?.toLocaleString()} đ</span>,
      sorter: (a, b) => a.totalRoomAmount - b.totalRoomAmount,
    },
    {
      title: "Tiền Dịch Vụ",
      dataIndex: "totalServiceAmount",
      key: "totalServiceAmount",
      render: (val) => <span>{val?.toLocaleString()} đ</span>,
      sorter: (a, b) => a.totalServiceAmount - b.totalServiceAmount,
    },
    {
      title: "Chiết Khấu",
      dataIndex: "discountAmount",
      key: "discountAmount",
      render: (val) => <span style={{ color: "#cf1322" }}>-{val?.toLocaleString()} đ</span>,
    },
    {
      title: "Thuế (8%)",
      dataIndex: "taxAmount",
      key: "taxAmount",
      render: (val) => <span style={{ color: "#8c8c8c" }}>{val?.toLocaleString()} đ</span>,
    },
    {
      title: "Thực Thu",
      dataIndex: "finalTotal",
      key: "finalTotal",
      render: (val) => <span style={{ fontWeight: 700, color: "#3f8600" }}>{val?.toLocaleString()} đ</span>,
      sorter: (a, b) => a.finalTotal - b.finalTotal,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "gold";
        let text = "Chờ thanh toán";
        if (status === "Paid" || status === "Completed" || status === "Đã thanh toán") {
          color = "green";
          text = "Đã thanh toán";
        } else if (status === "Cancelled" || status === "Đã hủy") {
          color = "red";
          text = "Đã hủy";
        }
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: "Đã thanh toán", value: "Paid" },
        { text: "Chờ thanh toán", value: "Pending" },
        { text: "Đã hủy", value: "Cancelled" }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết & in hóa đơn">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<FileTextOutlined />} 
              onClick={() => navigate(`/admin/invoice/${record.id}`)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "20px 24px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Noto Serif', serif", fontSize: 28, color: "#1e293b" }}>Báo Cáo Kế Toán</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>Thống kê chi tiết doanh thu, dòng tiền và hóa đơn dịch vụ</p>
        </div>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          size="large" 
          onClick={handleExportCSV}
          style={{ background: "#059669", borderColor: "#059669", borderRadius: 6, fontWeight: 600 }}
        >
          Xuất File CSV
        </Button>
      </div>

      <Spin spinning={loading} size="large" tip="Đang tính toán số liệu tài chính...">
        {/* Statistics Filters Row */}
        <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Space wrap size={16} style={{ width: "100%", justifyContent: "space-between" }}>
            <Space wrap size={12}>
              <Select 
                value={timePreset} 
                onChange={(val) => {
                  setTimePreset(val);
                  if (val !== "CUSTOM") setDateRange(null);
                }}
                style={{ width: 160 }}
                size="large"
              >
                <Option value="ALL">Tất cả thời gian</Option>
                <Option value="TODAY">Hôm nay</Option>
                <Option value="WEEK">7 ngày qua</Option>
                <Option value="MONTH">Tháng này</Option>
                <Option value="YEAR">Năm nay</Option>
                <Option value="CUSTOM">Khoảng ngày tùy chỉnh</Option>
              </Select>

              {timePreset === "CUSTOM" && (
                <RangePicker 
                  value={dateRange} 
                  onChange={(dates) => setDateRange(dates)} 
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              )}

              <Select 
                value={statusFilter} 
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 180 }}
                size="large"
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="Paid">Đã thanh toán</Option>
                <Option value="Pending">Chờ thanh toán</Option>
                <Option value="Cancelled">Đã hủy</Option>
              </Select>
            </Space>

            <Input
              placeholder="Tìm theo khách hàng, mã ĐP..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, borderRadius: 6 }}
              size="large"
              allowClear
            />
          </Space>
        </Card>

        {/* Financial KPIs Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <Statistic
                  title={<span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>TỔNG DOANH THU THỰC THU</span>}
                  value={netRevenue}
                  precision={0}
                  formatter={(val) => <span style={{ color: "#fadb14", fontSize: 26, fontWeight: 700 }}>{val.toLocaleString()} đ</span>}
                  prefix={<DollarOutlined style={{ marginRight: 8 }} />}
                />
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag color="success" style={{ border: "none", borderRadius: 4 }} icon={<ArrowUpOutlined />}>12.5%</Tag>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>So với tháng trước</span>
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <Statistic
                  title={<span style={{ color: "#64748b", fontWeight: 500 }}>Tiền Phòng</span>}
                  value={totalRoomRevenue}
                  precision={0}
                  formatter={(val) => <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{val.toLocaleString()} đ</span>}
                />
                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  Tỷ trọng: {netRevenue > 0 ? ((totalRoomRevenue / netRevenue) * 100).toFixed(1) : 0}%
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <Statistic
                  title={<span style={{ color: "#64748b", fontWeight: 500 }}>Tiền Dịch Vụ</span>}
                  value={totalServiceRevenue}
                  precision={0}
                  formatter={(val) => <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{val.toLocaleString()} đ</span>}
                />
                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  Tỷ trọng: {netRevenue > 0 ? ((totalServiceRevenue / netRevenue) * 100).toFixed(1) : 0}%
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <Statistic
                  title={<span style={{ color: "#64748b", fontWeight: 500 }}>Chiết Khấu</span>}
                  value={totalDiscount}
                  precision={0}
                  formatter={(val) => <span style={{ color: "#cf1322", fontSize: 20, fontWeight: 700 }}>-{val.toLocaleString()} đ</span>}
                  prefix={<PercentageOutlined />}
                />
                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  Tiết kiệm cho khách
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <Statistic
                  title={<span style={{ color: "#64748b", fontWeight: 500 }}>Thuế VAT (8%)</span>}
                  value={totalTax}
                  precision={0}
                  formatter={(val) => <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{val.toLocaleString()} đ</span>}
                  prefix={<SafetyCertificateOutlined />}
                />
                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  Phải nộp ngân sách
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Visual Revenue Trend & Info Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {/* Revenue Trend SVG Chart */}
          <Col xs={24} lg={16}>
            <Card title="Biểu Đồ Xu Hướng Doanh Thu (7 Ngày Gần Nhất)" style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              {chartData.length === 0 ? (
                <div style={{ height: 250, display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b" }}>
                  Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div style={{ padding: "10px 0" }}>
                  <svg width="100%" height="250" viewBox="0 0 700 250" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                      <line 
                        key={idx} 
                        x1="50" 
                        y1={20 + ratio * 180} 
                        x2="680" 
                        y2={20 + ratio * 180} 
                        stroke="#e2e8f0" 
                        strokeDasharray="4" 
                      />
                    ))}

                    {/* Area fill */}
                    <path
                      d={`
                        M 50,200
                        ${chartData.map((d, i) => {
                          const x = 70 + i * 95;
                          const y = 200 - (d.amount / maxAmount) * 160;
                          return `L ${x},${y}`;
                        }).join(" ")}
                        L ${70 + (chartData.length - 1) * 95},200
                        Z
                      `}
                      fill="url(#chartGrad)"
                    />

                    {/* Connection Line */}
                    <path
                      d={`
                        M ${70},${200 - (chartData[0].amount / maxAmount) * 160}
                        ${chartData.map((d, i) => {
                          const x = 70 + i * 95;
                          const y = 200 - (d.amount / maxAmount) * 160;
                          return `L ${x},${y}`;
                        }).join(" ")}
                      `}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />

                    {/* Data dots and tooltips */}
                    {chartData.map((d, i) => {
                      const x = 70 + i * 95;
                      const y = 200 - (d.amount / maxAmount) * 160;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                          {/* Value label on top of dot */}
                          <text x={x} y={y - 10} textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                            {(d.amount / 1000).toFixed(0)}k
                          </text>
                          {/* Date label at bottom */}
                          <text x={x} y="225" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
                            {d.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </Card>
          </Col>

          {/* Revenue distribution breakdown */}
          <Col xs={24} lg={8}>
            <Card title="Phân Tích Dòng Tiền" style={{ borderRadius: 12, height: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    <span>Doanh Thu Phòng</span>
                    <span>{netRevenue > 0 ? ((totalRoomRevenue / netRevenue) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${netRevenue > 0 ? (totalRoomRevenue / netRevenue) * 100 : 0}%`, height: "100%", background: "#3b82f6", borderRadius: 5 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    <span>Dịch Vụ & Tiện Ích</span>
                    <span>{netRevenue > 0 ? ((totalServiceRevenue / netRevenue) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${netRevenue > 0 ? (totalServiceRevenue / netRevenue) * 100 : 0}%`, height: "100%", background: "#10b981", borderRadius: 5 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    <span>Khuyến Mãi & Giảm Giá</span>
                    <span style={{ color: "#cf1322" }}>{totalRoomRevenue > 0 ? ((totalDiscount / totalRoomRevenue) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${totalRoomRevenue > 0 ? Math.min((totalDiscount / totalRoomRevenue) * 100, 100) : 0}%`, height: "100%", background: "#ef4444", borderRadius: 5 }} />
                  </div>
                </div>

                <div style={{ marginTop: 10, padding: 12, background: "#f8fafc", borderRadius: 8, borderLeft: "4px solid #fadb14" }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: 13, color: "#1e293b" }}>Lưu ý về dòng tiền</h4>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                    Doanh thu thực tế được ghi nhận khi các hóa đơn có trạng thái "Đã thanh toán".
                    Tiền cọc (Deposit) đã được tính trừ trực tiếp khi khách thanh toán lúc Checkout.
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Detailed Invoices Table */}
        <Card title="Danh Sách Hóa Đơn Chi Tiết" style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Table 
            columns={columns} 
            dataSource={filteredInvoices.map(inv => ({ ...inv, key: inv.id }))} 
            pagination={{ pageSize: 10, showSizeChanger: true }} 
            bordered 
            style={{ borderRadius: 8, overflow: "hidden" }}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default Accounting;
