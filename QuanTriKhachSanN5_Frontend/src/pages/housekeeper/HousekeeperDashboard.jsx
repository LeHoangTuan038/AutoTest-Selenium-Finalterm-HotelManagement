import React, { useState, useEffect } from "react";
import {
  Button, Card, Typography, message, Table, Tag, Row, Col, Statistic, Space,
  Input, Select, Segmented, Spin, Tooltip, Modal, Checkbox, Divider, Alert
} from "antd";
import {
  CheckCircleOutlined, SyncOutlined, WarningOutlined, BuildOutlined,
  AppstoreOutlined, UnorderedListOutlined, UserOutlined, SearchOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import axiosClient from "../../api/axios";
import { auditLogger } from "../../utils/auditLogger";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const HousekeeperDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' hoặc 'table'

  // Modal / Drawer details for a single room
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Inventory details inside modal
  const [roomInventory, setRoomInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryConfirmed, setInventoryConfirmed] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/Rooms");
      setRoomsList(res.data || []);
    } catch (err) {
      message.error("Lỗi khi tải danh sách phòng vật lý!");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái phòng vật lý
  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      await axiosClient.put(`/Rooms/${roomId}/status`, JSON.stringify(newStatus));
      message.success(`Đã cập nhật trạng thái phòng thành: ${newStatus}`);
      
      const room = roomsList.find(r => r.id === roomId);
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(prev => ({ ...prev, status: newStatus }));
      }

      auditLogger.success(`🧹 Nhân viên buồng phòng cập nhật trạng thái phòng P.${room?.roomNumber} -> ${newStatus}`, {
        action: 'Cập nhật',
        actionType: 'UPDATE',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room?.roomNumber}`,
        description: `Cập nhật nhanh trạng thái phòng ${room?.roomNumber} sang ${newStatus}.`
      });

      fetchRooms();
    } catch (err) {
      message.error("Lỗi khi cập nhật trạng thái phòng!");
    }
  };

  // Xác nhận dọn sạch phòng hoàn tất
  const handleCompleteCleaning = async (roomId) => {
    try {
      await axiosClient.put(`/RoomInventory/rooms/${roomId}/mark-clean`, {});
      const room = roomsList.find(r => r.id === roomId);
      message.success(`Đã xác nhận dọn sạch phòng P.${room?.roomNumber || roomId} thành công!`);
      
      setIsDetailOpen(false);

      auditLogger.success(`🧹 Hoàn thành dọn dẹp phòng P.${room?.roomNumber}`, {
        action: 'Hoàn tất dọn dẹp',
        actionType: 'UPDATE',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room?.roomNumber}`,
        description: `Nhân viên buồng phòng dọn sạch và chuyển phòng ${room?.roomNumber} sang Sẵn sàng (Available).`
      });

      fetchRooms();
    } catch (err) {
      message.error("Lỗi khi xác nhận dọn sạch phòng!");
    }
  };

  // Tải danh sách vật tư khi mở hộp thoại
  const handleOpenRoomDetail = async (room) => {
    setSelectedRoom(room);
    setInventoryConfirmed(false);
    setIsDetailOpen(true);
    setInventoryLoading(true);
    try {
      const res = await axiosClient.get(`/RoomInventory/rooms/${room.id}/inventory`);
      setRoomInventory(res.data || []);
    } catch (err) {
      message.error("Lỗi khi tải danh sách vật tư phòng!");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Báo hỏng / mất đồ dùng
  const handleReportDamage = (record) => {
    Modal.confirm({
      title: 'Xác nhận báo hỏng / mất vật tư',
      content: (
        <div>
          Xác nhận vật tư <b style={{ color: 'red' }}>{record.amenity?.name}</b> của phòng <b>P.{selectedRoom?.roomNumber}</b> bị hỏng hoặc mất?
          <p style={{ marginTop: 10, color: '#888' }}>Hệ thống sẽ lập biên bản đền bù phạt dựa trên đơn giá: <b>{record.amenity?.price?.toLocaleString() || '500,000'} đ</b></p>
        </div>
      ),
      okText: 'Báo hỏng/mất',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          const payload = {
            roomInventoryId: record.id,
            quantity: 1,
            penaltyAmount: record.amenity?.price || record.amenity?.importPrice || 500000,
            description: `Buồng phòng báo hỏng/mất ${record.amenity?.name} tại phòng ${selectedRoom?.roomNumber}`,
            status: 'Chưa đền bù'
          };
          await axiosClient.post('/LossAndDamages', payload);
          message.success("Đã ghi nhận báo hỏng vật tư và lập biên bản phạt!");

          auditLogger.success(`🧹 Báo hỏng ${record.amenity?.name} tại phòng ${selectedRoom?.roomNumber}`, {
            action: 'Báo hỏng',
            actionType: 'CREATE',
            module: 'Nhiệm vụ Dọn Phòng',
            objectName: `Phòng ${selectedRoom?.roomNumber} - ${record.amenity?.name}`,
            description: `Báo cáo hỏng/mất vật tư tại phòng ${selectedRoom?.roomNumber}. Giá đền bù: ${payload.penaltyAmount.toLocaleString()}đ.`
          });

          // Tải lại danh sách vật tư
          const res = await axiosClient.get(`/RoomInventory/rooms/${selectedRoom.id}/inventory`);
          setRoomInventory(res.data || []);
        } catch (err) {
          message.error("Lỗi khi lập biên bản báo hỏng!");
        }
      }
    });
  };

  // Lọc phòng
  const filteredRooms = roomsList.filter(r => {
    const matchSearch = r.roomNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || r.roomTypeName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchStatus = false;
    if (statusFilter === "all") {
      matchStatus = true;
    } else if (statusFilter === "Dirty") {
      matchStatus = r.status === "Dirty" || r.status === "Chờ dọn dẹp";
    } else if (statusFilter === "Cleaning") {
      matchStatus = r.status === "Cleaning" || r.status === "Đang dọn";
    } else if (statusFilter === "Pending Check-out") {
      matchStatus = r.status === "Pending Check-out" || r.status === "Chờ kiểm tra";
    } else if (statusFilter === "Available") {
      matchStatus = r.status === "Available" || r.status === "Trống";
    } else if (statusFilter === "Occupied") {
      matchStatus = r.status === "Occupied" || r.status === "Đang ở";
    }

    return matchSearch && matchStatus;
  });

  // Gom nhóm phòng theo tầng
  const getRoomsByFloor = () => {
    const sorted = [...filteredRooms].sort((a, b) => (parseInt(a.roomNumber) || 0) - (parseInt(b.roomNumber) || 0));
    const floors = {};
    sorted.forEach(room => {
      const numStr = room.roomNumber?.toString() || "";
      let floorName = "Tầng Khác";
      const match = numStr.match(/\d/);
      if (match) {
        floorName = `Tầng ${match[0]}`;
      }
      if (!floors[floorName]) floors[floorName] = [];
      floors[floorName].push(room);
    });
    return floors;
  };

  const roomsByFloor = getRoomsByFloor();

  // Tính toán số liệu thống kê nhanh
  const countDirty = roomsList.filter(r => r.status === 'Dirty' || r.status === 'Chờ dọn dẹp').length;
  const countCleaning = roomsList.filter(r => r.status === 'Cleaning' || r.status === 'Đang dọn').length;
  const countPending = roomsList.filter(r => r.status === 'Pending Check-out' || r.status === 'Chờ kiểm tra').length;
  const countAvailable = roomsList.filter(r => r.status === 'Available' || r.status === 'Trống').length;

  // Cột cho bảng
  const columns = [
    { title: "Số phòng", dataIndex: "roomNumber", key: "roomNumber", render: text => <strong style={{ fontSize: 15 }}>P.{text}</strong> },
    { title: "Loại phòng", dataIndex: "roomTypeName", key: "roomTypeName", render: text => <Tag color="cyan">{text}</Tag> },
    {
      title: "Trạng thái vật lý",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color = 'default';
        if (status === 'Available' || status === 'Trống') color = 'green';
        else if (status === 'Occupied' || status === 'Đang ở') color = 'blue';
        else if (status === 'Dirty' || status === 'Chờ dọn dẹp') color = 'orange';
        else if (status === 'Cleaning' || status === 'Đang dọn') color = 'purple';
        else if (status === 'Pending Check-out' || status === 'Chờ kiểm tra') color = 'gold';

        return (
          <Select
            value={status === 'Trống' ? 'Available' : status === 'Đang ở' ? 'Occupied' : status === 'Chờ dọn dẹp' ? 'Dirty' : status === 'Đang dọn' ? 'Cleaning' : status === 'Chờ kiểm tra' ? 'Pending Check-out' : status}
            onChange={(val) => handleUpdateRoomStatus(record.id, val)}
            style={{ width: 180 }}
          >
            <Option value="Available"><Tag color="green">🟢 Sẵn sàng (Available)</Tag></Option>
            <Option value="Occupied"><Tag color="blue">🔵 Đang ở (Occupied)</Tag></Option>
            <Option value="Dirty"><Tag color="orange">🟠 Bẩn (Dirty)</Tag></Option>
            <Option value="Cleaning"><Tag color="purple">🟣 Đang dọn (Cleaning)</Tag></Option>
            <Option value="Pending Check-out"><Tag color="gold">🟡 Chờ Checkout (Pending)</Tag></Option>
          </Select>
        );
      }
    },
    {
      title: "Vệ sinh",
      dataIndex: "cleaningStatus",
      key: "cleaningStatus",
      render: (status) => {
        const isClean = status === 'Clean' || status === 'Sạch';
        return <Tag color={isClean ? 'green' : 'orange'} style={{ fontWeight: 'bold' }}>{isClean ? 'SẠCH' : 'CHƯA DỌN'}</Tag>;
      }
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          {(record.status === 'Dirty' || record.status === 'Chờ dọn dẹp') && (
            <Button type="primary" size="small" style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }} onClick={() => handleUpdateRoomStatus(record.id, 'Cleaning')}>
              Bắt đầu dọn
            </Button>
          )}
          <Button type="primary" ghost size="small" icon={<BuildOutlined />} onClick={() => handleOpenRoomDetail(record)}>
            Kiểm vật tư / Sạch
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "24px 28px", background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🧹 BÀN LÀM VIỆC BUỒNG PHÒNG (HOUSEKEEPING PANEL)</Title>
          <Text type="secondary">Cổng tiếp nhận nhiệm vụ, cập nhật trạng thái phòng vật lý, kiểm tra vật tư và báo hỏng đồ</Text>
        </div>
        <Button type="primary" size="large" icon={<SyncOutlined />} onClick={fetchRooms} loading={loading}>
          Làm mới sơ đồ
        </Button>
      </div>

      {/* Thống kê nhanh */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: "#fff2e8", borderRadius: 8 }}>
            <Statistic title="Phòng Bẩn (Cần Dọn)" value={countDirty} prefix={<WarningOutlined style={{ color: "#d4380d" }} />} valueStyle={{ color: "#d4380d", fontWeight: "bold" }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: "#f9f0ff", borderRadius: 8 }}>
            <Statistic title="Phòng Đang Dọn" value={countCleaning} prefix={<SyncOutlined spin style={{ color: "#722ed1" }} />} valueStyle={{ color: "#722ed1", fontWeight: "bold" }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: "#fffbe6", borderRadius: 8 }}>
            <Statistic title="Đang Chờ Kiểm Check-out" value={countPending} prefix={<ExclamationCircleOutlined style={{ color: "#d46b08" }} />} valueStyle={{ color: "#d46b08", fontWeight: "bold" }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: "#f6ffed", borderRadius: 8 }}>
            <Statistic title="Phòng Trống Sạch (Sẵn sàng)" value={countAvailable} prefix={<CheckCircleOutlined style={{ color: "#389e0d" }} />} valueStyle={{ color: "#389e0d", fontWeight: "bold" }} />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc & Điều hướng */}
      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Space size="middle" wrap>
            <Search
              placeholder="Tìm theo số phòng, loại..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select style={{ width: 180 }} value={statusFilter} onChange={setStatusFilter}>
              <Option value="all">Tất cả phòng</Option>
              <Option value="Dirty">⚠️ Cần dọn dẹp (Dirty)</Option>
              <Option value="Cleaning">🧹 Đang dọn (Cleaning)</Option>
              <Option value="Pending Check-out">⏳ Chờ checkout (Pending)</Option>
              <Option value="Available">✅ Sẵn sàng (Available)</Option>
              <Option value="Occupied">🔑 Đang có khách ở (Occupied)</Option>
            </Select>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: 'Sơ đồ phòng', value: 'grid', icon: <AppstoreOutlined /> },
                { label: 'Dạng bảng', value: 'table', icon: <UnorderedListOutlined /> }
              ]}
            />
          </Space>
          <Text type="secondary">Tìm thấy <b>{filteredRooms.length}</b> phòng</Text>
        </div>

        <Spin spinning={loading}>
          {viewMode === "table" ? (
            <Table columns={columns} dataSource={filteredRooms} rowKey="id" pagination={{ pageSize: 12 }} />
          ) : (
            <div style={{ background: "#fafafa", padding: 20, borderRadius: 8, border: "1px solid #f0f0f0" }}>
              {Object.keys(roomsByFloor).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>Không tìm thấy phòng phù hợp.</div>
              ) : (
                Object.keys(roomsByFloor).sort().map(floor => (
                  <div key={floor} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", borderLeft: "4px solid #722ed1", paddingLeft: 8, marginBottom: 12, color: "#262626" }}>
                      {floor}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                      {roomsByFloor[floor].map(room => {
                        let bgColor = '#f5f5f5';
                        let borderColor = '#d9d9d9';
                        let textColor = '#262626';
                        let statusLabel = 'Trống';

                        const status = room.status;
                        if (status === 'Available' || status === 'Trống') {
                          bgColor = '#f6ffed';
                          borderColor = '#b7eb8f';
                          textColor = '#389e0d';
                          statusLabel = 'Sẵn sàng';
                        } else if (status === 'Occupied' || status === 'Đang ở') {
                          bgColor = '#e6f7ff';
                          borderColor = '#91d5ff';
                          textColor = '#096dd9';
                          statusLabel = 'Có khách🔑';
                        } else if (status === 'Dirty' || status === 'Chờ dọn dẹp') {
                          bgColor = '#fff2e8';
                          borderColor = '#ffbb96';
                          textColor = '#d4380d';
                          statusLabel = 'Cần dọn🧹';
                        } else if (status === 'Cleaning' || status === 'Đang dọn') {
                          bgColor = '#f9f0ff';
                          borderColor = '#d3adf7';
                          textColor = '#722ed1';
                          statusLabel = 'Đang dọn...';
                        } else if (status === 'Pending Check-out' || status === 'Chờ kiểm tra') {
                          bgColor = '#fffbe6';
                          borderColor = '#ffe58f';
                          textColor = '#d46b08';
                          statusLabel = 'Chờ kiểm⏳';
                        }

                        const isClean = room.cleaningStatus === 'Clean' || room.cleaningStatus === 'Sạch';

                        return (
                          <Tooltip
                            key={room.id}
                            title={
                              <div>
                                <b>Phòng {room.roomNumber}</b>
                                <br />
                                Loại: {room.roomTypeName}
                                <br />
                                Trạng thái: {room.status}
                                <br />
                                Vệ sinh: {isClean ? 'Đã sạch' : 'Cần dọn dẹp'}
                              </div>
                            }
                          >
                            <Card
                              hoverable
                              onClick={() => handleOpenRoomDetail(room)}
                              style={{
                                width: 125,
                                height: 120,
                                borderRadius: 10,
                                border: `2px solid ${borderColor}`,
                                background: bgColor,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                padding: 6,
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              styles={{ body: { padding: 0 } }}
                            >
                              <div style={{ fontSize: 18, fontWeight: "bold", color: textColor }}>
                                P.{room.roomNumber}
                              </div>
                              <div style={{ fontSize: 10, color: "#8c8c8c", marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
                                {room.roomTypeName}
                              </div>
                              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                                {isClean ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}
                                <span style={{ fontSize: 10, fontWeight: "bold", color: textColor }}>{statusLabel}</span>
                              </div>
                            </Card>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Spin>
      </Card>

      {/* MODAL KIỂM KÊ TÀI SẢN & XÁC NHẬN SẠCH PHÒNG */}
      <Modal
        title={`Nhiệm Vụ Dọn Dẹp Phòng P.${selectedRoom?.roomNumber}`}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        width={700}
        centered
        destroyOnClose
        footer={[
          <Button key="back" onClick={() => setIsDetailOpen(false)}>Quay lại</Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!inventoryConfirmed}
            onClick={() => handleCompleteCleaning(selectedRoom.id)}
            style={{
              backgroundColor: inventoryConfirmed ? '#52c41a' : undefined,
              borderColor: inventoryConfirmed ? '#52c41a' : undefined,
              color: inventoryConfirmed ? '#fff' : undefined
            }}
          >
            Hoàn tất dọn dẹp & Xác nhận Sạch sẽ
          </Button>
        ]}
      >
        {selectedRoom && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p>Loại phòng: <b>{selectedRoom.roomTypeName}</b></p>
                  <p>Trạng thái vật lý hiện tại: <Tag color={selectedRoom.status === 'Available' ? 'green' : 'orange'}>{selectedRoom.status}</Tag></p>
                </Col>
                <Col span={12}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span>Đổi trạng thái:</span>
                    <Select
                      value={selectedRoom.status === 'Trống' ? 'Available' : selectedRoom.status === 'Đang ở' ? 'Occupied' : selectedRoom.status === 'Chờ dọn dẹp' ? 'Dirty' : selectedRoom.status === 'Đang dọn' ? 'Cleaning' : selectedRoom.status === 'Chờ kiểm tra' ? 'Pending Check-out' : selectedRoom.status}
                      onChange={(val) => handleUpdateRoomStatus(selectedRoom.id, val)}
                      style={{ width: 160 }}
                    >
                      <Option value="Available"><Tag color="green">Sẵn sàng</Tag></Option>
                      <Option value="Cleaning"><Tag color="purple">Đang dọn</Tag></Option>
                      <Option value="Dirty"><Tag color="orange">Bẩn</Tag></Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>

            {selectedRoom.status === 'Pending Check-out' && (
              <Alert
                message="⚠️ KIỂM PHÒNG CHECK-OUT"
                description="Khách hàng đang chờ tại quầy lễ tân để checkout! Vui lòng đối chiếu thật kỹ số lượng vật tư. Bấm nút 'Báo hỏng / Mất' ngay nếu có hao hụt để tự động phạt tính vào hóa đơn."
                type="warning"
                showIcon
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <Divider orientation="left" style={{ margin: '12px 0' }}>Bảng kiểm kê vật tư phòng</Divider>

            <Spin spinning={inventoryLoading}>
              <Table
                columns={[
                  {
                    title: "Tên Thiết Bị / Vật Tư",
                    key: "amenityName",
                    render: (_, record) => (
                      <Space>
                        {record.isActive ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                        <span style={{ textDecoration: record.isActive ? 'none' : 'line-through', color: record.isActive ? '#262626' : '#999' }}>
                          {record.amenity?.name}
                        </span>
                      </Space>
                    )
                  },
                  {
                    title: "Số lượng quy chuẩn",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "center",
                    render: q => <Tag color="blue">{q}</Tag>
                  },
                  {
                    title: "Báo cáo hao hụt",
                    key: "action",
                    align: "center",
                    render: (_, record) => (
                      <Button
                        danger
                        size="small"
                        disabled={!record.isActive}
                        onClick={() => handleReportDamage(record)}
                      >
                        {!record.isActive ? 'Đã báo hỏng/mất' : 'Báo hỏng / Mất'}
                      </Button>
                    )
                  }
                ]}
                dataSource={roomInventory}
                rowKey="id"
                pagination={false}
                bordered
                size="small"
              />
            </Spin>

            <div style={{ marginTop: 20, padding: 16, background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8 }}>
              <Checkbox
                checked={inventoryConfirmed}
                onChange={e => setInventoryConfirmed(e.target.checked)}
              >
                <span style={{ fontWeight: "bold", color: "#389e0d" }}>
                  Xác nhận phòng đã được vệ sinh sạch sẽ, thay mới khăn ga và bổ sung đầy đủ vật tư theo tiêu chuẩn.
                </span>
              </Checkbox>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HousekeeperDashboard;