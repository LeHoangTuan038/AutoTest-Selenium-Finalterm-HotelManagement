import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber,
  Select, message, Card, Typography, Popconfirm, Row, Col, Dropdown, Segmented, Statistic, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CheckCircleOutlined, SyncOutlined, SearchOutlined,
  AppstoreOutlined, BarsOutlined, MoreOutlined,
  HomeOutlined, ExclamationCircleOutlined, BlockOutlined
} from '@ant-design/icons';
import { roomApi } from '../../api/roomApi';
import { auditLogger } from '../../utils/auditLogger';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCleaning, setFilterCleaning] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); 
  
  // 🚨 BÍ KÍP: State quản lý chế độ thêm (1 phòng hay hàng loạt)
  const [addMode, setAddMode] = useState('single'); 
  const [editingRoom, setEditingRoom] = useState(null); 
  const [form] = Form.useForm();

  // --- 1. HÚT DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const responseRooms = await roomApi.getRooms();
      setRooms(responseRooms.data);

      const token = localStorage.getItem('token');
      const responseTypes = await axios.get('http://localhost:5070/api/RoomTypes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomTypes(responseTypes.data);

    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối Backend tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. LỌC VÀ THỐNG KÊ ---
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'All' || room.status === filterStatus;
    const matchesCleaning = filterCleaning === 'All' || room.cleaningStatus === filterCleaning;
    return matchesSearch && matchesStatus && matchesCleaning;
  });

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'Available').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    maintenance: rooms.filter(r => r.status === 'Maintenance').length,
  };

  // --- 3. CÁC HÀM XỬ LÝ ---
  const handleAddNew = () => {
    setEditingRoom(null);
    setAddMode('single'); // Reset về chế độ thêm 1 phòng
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRoom(record);
    setAddMode('single'); // Chỉnh sửa thì bắt buộc là 1 phòng
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields(); 
      setLoading(true);

      // XỬ LÝ: CHẾ ĐỘ THÊM HÀNG LOẠT
      if (addMode === 'bulk' && !editingRoom) {
        const { prefix, startNum, endNum, excludeRooms, floor, roomTypeId, status, cleaningStatus } = values;
        
        // Cắt chuỗi các phòng loại trừ (vd: "102, 104" -> ["102", "104"])
        const excludes = excludeRooms ? excludeRooms.split(',').map(s => s.trim()) : [];
        const roomsToCreate = [];

        // Chạy vòng lặp từ số bắt đầu đến số kết thúc
        for (let i = startNum; i <= endNum; i++) {
          // Nếu số này KHÔNG bị nằm trong danh sách loại trừ thì mới tạo
          if (!excludes.includes(i.toString())) {
            const roomName = (prefix || '') + i.toString();
            roomsToCreate.push({
               roomNumber: roomName,
               floor: Number(floor),
               roomTypeId: Number(roomTypeId),
               status,
               cleaningStatus
            });
          }
        }

        if (roomsToCreate.length === 0) {
           message.error("Lỗi: Không có phòng hợp lệ nào được tạo ra!");
           setLoading(false);
           return;
        }

        // Gọi API tạo liên tục cho mảng phòng vừa sinh ra
        await Promise.all(roomsToCreate.map(payload => roomApi.createRoom(payload)));

        auditLogger.success(`Đã thêm hàng loạt ${roomsToCreate.length} phòng thành công!`, {
          actionType: 'CREATE', 
          module: 'Quản lý Phòng',
          objectName: `Hàng loạt (${roomsToCreate.length} phòng)`, 
          description: `Tạo từ ${startNum} đến ${endNum}, tiền tố: ${prefix || 'Không'}`
        });

      } 
      // XỬ LÝ: CHẾ ĐỘ THÊM/SỬA 1 PHÒNG (Bình thường)
      else {
        const payload = {
          id: editingRoom ? editingRoom.id : 0,
          roomNumber: values.roomNumber,
          floor: Number(values.floor),
          roomTypeId: Number(values.roomTypeId),
          status: values.status,
          cleaningStatus: values.cleaningStatus
        };

        if (editingRoom) {
          await roomApi.updateRoom(editingRoom.id, payload);
          auditLogger.success("Cập nhật phòng thành công!", {
            actionType: 'UPDATE',
            module: 'Quản lý Phòng',
            objectName: `Phòng ${values.roomNumber}`,
            description: `Cập nhật thông tin phòng ${values.roomNumber}`
          });
        } else {
          await roomApi.createRoom(payload);
          auditLogger.success("Thêm mới phòng thành công!", {
            actionType: 'CREATE',
            module: 'Quản lý Phòng',
            objectName: `Phòng ${values.roomNumber}`,
            description: `Tạo mới phòng ${values.roomNumber}`
          });
        }
      }

      setIsModalVisible(false);
      fetchData(); 
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng kiểm tra lại dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, roomNumber) => {
    Modal.confirm({
      title: 'Cảnh báo xóa phòng',
      icon: <ExclamationCircleOutlined style={{ color: 'red' }}/>,
      content: `Bạn có chắc chắn muốn xóa phòng ${roomNumber} không?`,
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await roomApi.deleteRoom(id);
          auditLogger.success(`Đã xóa phòng ${roomNumber} thành công!`, {
            actionType: 'DELETE',
            module: 'Quản lý Phòng',
            objectName: `Phòng ${roomNumber}`,
            description: `Xóa phòng ${roomNumber} khỏi hệ thống.`
          });
          fetchData();
        } catch (error) {
          auditLogger.error("Lỗi khi xóa phòng!", { module: 'Quản lý Phòng', objectName: `Phòng ${roomNumber}` });
        }
      }
    });
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Available': return { color: '#52c41a', text: 'Trống', bg: '#f6ffed', border: '#b7eb8f' };
      case 'Occupied': return { color: '#ff4d4f', text: 'Đang ở', bg: '#fff2f0', border: '#ffccc7' };
      case 'Maintenance': return { color: '#faad14', text: 'Bảo trì', bg: '#fffbe6', border: '#ffe58f' };
      default: return { color: '#8c8c8c', text: status, bg: '#fafafa', border: '#d9d9d9' };
    }
  };

  const renderGridView = () => (
    <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
      {filteredRooms.map(room => {
        const ui = getStatusConfig(room.status);
        const isClean = room.cleaningStatus === 'Clean';
        const isEditable = room.status === 'Available' && room.cleaningStatus === 'Clean';
        const actionItems = [
          { 
            key: 'edit', 
            icon: <EditOutlined />, 
            label: isEditable ? 'Chỉnh sửa' : 'Chỉnh sửa (Chỉ khi Trống & Sạch)', 
            disabled: !isEditable,
            onClick: () => handleEdit(room) 
          },
          { 
            key: 'delete', 
            danger: true, 
            icon: <DeleteOutlined />, 
            label: isEditable ? 'Xóa phòng' : 'Xóa phòng (Chỉ khi Trống & Sạch)', 
            disabled: !isEditable,
            onClick: () => confirmDelete(room.id, room.roomNumber) 
          }
        ];
        const roomTypeNameDisplay = roomTypes.find(type => type.id === room.roomTypeId)?.name || `Hạng ${room.roomTypeId}`;

        return (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={room.id}>
            <Card hoverable bodyStyle={{ padding: '16px' }} style={{ borderRadius: 12, borderTop: `4px solid ${ui.color}`, backgroundColor: ui.bg, borderColor: ui.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Tag color={isClean ? 'cyan' : 'warning'} style={{ margin: 0, borderRadius: 10 }}>
                  {isClean ? <CheckCircleOutlined /> : <SyncOutlined spin />} {isClean ? 'Sạch' : 'Chưa dọn'}
                </Tag>
                <Dropdown menu={{ items: actionItems }} trigger={['click']}>
                  <Button type="text" size="small" icon={<MoreOutlined style={{ fontSize: 18 }} />} />
                </Dropdown>
              </div>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>{room.roomNumber}</Title>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', padding: '0 5px' }}>Tầng {room.floor} • {roomTypeNameDisplay}</Text>
              </div>
              <div style={{ textAlign: 'center' }}><Tag color={ui.color} style={{ padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>{ui.text}</Tag></div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  const columns = [
    { title: 'Số Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: t => <b style={{fontSize: 16}}>{t}</b> },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor', align: 'center' },
    { title: 'Loại Phòng', key: 'roomType', align: 'center', render: (_, record) => <Text>{roomTypes.find(type => type.id === record.roomTypeId)?.name || 'Chưa rõ'}</Text> },
    { title: 'Trạng Thái', dataIndex: 'status', key: 'status', align: 'center', render: s => { const ui = getStatusConfig(s); return <Tag color={ui.color} style={{ fontWeight: 'bold' }}>{ui.text}</Tag>; }},
    { title: 'Dọn Dẹp', dataIndex: 'cleaningStatus', key: 'cleaningStatus', align: 'center', render: s => { let isClean = s === 'Clean'; return <Tag icon={isClean ? <CheckCircleOutlined /> : <SyncOutlined spin />} color={isClean ? 'cyan' : 'warning'}>{isClean ? 'Sạch sẽ' : 'Đang dọn'}</Tag>; }},
    { title: 'Thao tác', key: 'action', align: 'center', render: (_, record) => {
        const isEditable = record.status === 'Available' && record.cleaningStatus === 'Clean';
        return (
          <Space size="middle">
            <Tooltip title={!isEditable ? "Chỉ được sửa khi phòng đang TRỐNG và SẠCH SẼ!" : "Chỉnh sửa phòng này"}>
              <Button 
                type="primary" 
                ghost 
                icon={<EditOutlined />} 
                size="small" 
                onClick={() => handleEdit(record)}
                disabled={!isEditable}
              >
                Sửa
              </Button>
            </Tooltip>
            <Tooltip title={!isEditable ? "Chỉ được xóa khi phòng đang TRỐNG và SẠCH SẼ!" : "Xóa phòng này"}>
              <Button 
                type="primary" 
                danger 
                icon={<DeleteOutlined />} 
                size="small" 
                onClick={() => confirmDelete(record.id, record.roomNumber)}
                disabled={!isEditable}
              >
                Xóa
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Tổng số phòng" value={stats.total} prefix={<HomeOutlined />} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} /></Card></Col>
        <Col span={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Đang trống" value={stats.available} valueStyle={{ color: '#52c41a', fontWeight: 'bold' }} /></Card></Col>
        <Col span={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Đang có khách" value={stats.occupied} valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }} /></Card></Col>
        <Col span={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Đang bảo trì" value={stats.maintenance} valueStyle={{ color: '#faad14', fontWeight: 'bold' }} /></Card></Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
          <div><Title level={3} style={{ margin: 0, color: '#1f1f1f' }}>Quản Lý Tình Trạng Phòng</Title><Text type="secondary">Theo dõi sơ đồ và trạng thái phòng theo thời gian thực</Text></div>
          <Space size="large">
            <Segmented options={[{ value: 'grid', icon: <AppstoreOutlined />, label: 'Sơ đồ' }, { value: 'table', icon: <BarsOutlined />, label: 'Danh sách' }]} value={viewMode} onChange={setViewMode} />
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddNew} style={{ borderRadius: 8 }}>Thêm Phòng</Button>
          </Space>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: 24, backgroundColor: '#fafafa', padding: 16, borderRadius: 8 }}>
          <Search placeholder="Tìm theo số phòng..." allowClear onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} size="large" />
          <Select size="large" style={{ width: 200 }} onChange={setFilterStatus} value={filterStatus}>
            <Option value="All">Tất cả trạng thái</Option><Option value="Available">Trống</Option><Option value="Occupied">Đang ở</Option><Option value="Maintenance">Bảo trì</Option>
          </Select>
          <Select size="large" style={{ width: 220 }} onChange={setFilterCleaning} value={filterCleaning}>
            <Option value="All">Tất cả dọn dẹp</Option><Option value="Clean">Sạch sẽ</Option><Option value="Dirty">Chưa dọn</Option>
          </Select>
        </div>

        {viewMode === 'table' ? <Table columns={columns} dataSource={filteredRooms} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 800 }} /> : renderGridView()}

        {/* ======================================================== */}
        {/* MODAL THÊM/SỬA PHÒNG ĐÃ NÂNG CẤP TÍNH NĂNG THÊM HÀNG LOẠT */}
        {/* ======================================================== */}
        <Modal
          title={<div style={{ fontSize: 18 }}>{editingRoom ? "Sửa Thông Tin Phòng" : "Thêm Phòng Mới"}</div>}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleSave}
          confirmLoading={loading}
          centered
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            
            {/* THIẾT KẾ CHUYỂN TAB: CHỈ HIỆN KHI LÀ THÊM MỚI */}
            {!editingRoom && (
              <Form.Item style={{ marginBottom: 24 }}>
                <Segmented
                  block
                  size="large"
                  options={[
                    { label: 'Thêm 1 phòng', value: 'single', icon: <PlusOutlined /> },
                    { label: 'Thêm hàng loạt', value: 'bulk', icon: <BlockOutlined /> }
                  ]}
                  value={addMode}
                  onChange={setAddMode}
                />
              </Form.Item>
            )}

            {/* GIAO DIỆN NẾU CHỌN THÊM 1 PHÒNG (Hoặc đang Sửa) */}
            {addMode === 'single' ? (
              <Form.Item label="Số Phòng" name="roomNumber" rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}>
                <Input placeholder="VD: 101, 102..." size="large" />
              </Form.Item>
            ) : (
            // GIAO DIỆN NẾU CHỌN THÊM HÀNG LOẠT
              <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #e8e8e8', marginBottom: '24px' }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: '#1890ff' }}>Cấu hình tạo phòng tự động:</Text>
                <Space size="small" style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                  <Form.Item label="Tiền tố (Tùy chọn)" name="prefix" tooltip="Vd: Nhập 'VILLA-' sẽ tạo ra VILLA-1">
                    <Input size="large" placeholder="Vd: VILLA-" style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item label="Từ số" name="startNum" rules={[{ required: true, message: 'Nhập số bắt đầu' }]}>
                    <InputNumber min={1} size="large" style={{ width: 100 }} placeholder="Vd: 101" />
                  </Form.Item>
                  <Text style={{ marginTop: 40, marginHorizonal: 10 }}>Đến</Text>
                  <Form.Item label="Đến số" name="endNum" rules={[{ required: true, message: 'Nhập số kết thúc' }]}>
                    <InputNumber min={1} size="large" style={{ width: 100 }} placeholder="Vd: 105" />
                  </Form.Item>
                </Space>
                <Form.Item label="Các phòng KHÔNG tạo (Bỏ qua)" name="excludeRooms" tooltip="Nhập các số không muốn tạo, cách nhau bằng dấu phẩy. Vd: 102, 104">
                  <Input size="large" placeholder="Vd: 102, 104 (Sẽ tạo ra 101, 103, 105)" />
                </Form.Item>
              </div>
            )}
            
            {/* THÔNG TIN CHUNG DÙNG CHO CẢ 2 CHẾ ĐỘ */}
            <Space size="large" style={{ width: '100%', display: 'flex' }}>
              <Form.Item label="Tầng" name="floor" rules={[{ required: true }]} style={{ width: 120 }}>
                <Input type="number" size="large" />
              </Form.Item>

              <Form.Item label="Loại Phòng" name="roomTypeId" rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]} style={{ width: 380 }}>
                <Select size="large" placeholder="-- Chọn loại phòng --" showSearch optionFilterProp="children">
                  {roomTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Space>

            <Form.Item label="Trạng Thái" name="status" initialValue="Available">
              <Select size="large">
                <Option value="Available">Trống (Available)</Option>
                <Option value="Occupied">Đang ở (Occupied)</Option>
                <Option value="Maintenance">Bảo trì (Maintenance)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Dọn Dẹp" name="cleaningStatus" initialValue="Clean">
              <Select size="large">
                <Option value="Clean">Sạch sẽ (Clean)</Option>
                <Option value="Dirty">Chưa dọn (Dirty)</Option>
                <Option value="Inspecting">Đang kiểm tra (Inspecting)</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default RoomManagement;