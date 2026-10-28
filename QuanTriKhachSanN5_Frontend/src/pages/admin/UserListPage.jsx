import React, { useState, useEffect } from 'react';
import { 
  Table, Modal, Form, Input, Select, Button, Tag, Space, 
  Typography, message, Card, Popconfirm, Tabs, Row, Col, Checkbox, Switch
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UnlockOutlined, SearchOutlined, UserOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useLoadingStore } from '../../store/loadingStore';
import { userManagementAPI } from '../../api/userManagement';
import { roleAPI } from '../../api/roleApi';
import { auditLogger } from '../../utils/auditLogger';

import { useAdminAuthStore } from '../../store/adminAuthStore';

const { Title, Text } = Typography;
const { Option } = Select;

const PERMISSION_MAP = {
  "VIEW_DASHBOARD": "Xem Tổng quan",
  "MANAGE_USERS": "Quản lý Nhân viên",
  "MANAGE_ROLES": "Quản lý Vai trò",
  "VIEW_USERS": "Xem danh sách Nhân viên",
  "VIEW_ROLES": "Xem danh sách Vai trò",
  "EDIT_ROLES": "Chỉnh sửa Vai trò",
  "CREATE_USERS": "Thêm mới Nhân viên",
  "MANAGE_ROOMS": "Quản lý Phòng",
  "MANAGE_BOOKINGS": "Quản lý Đặt phòng",
  "MANAGE_INVOICES": "Quản lý Hóa đơn",
  "MANAGE_SERVICES": "Quản lý Dịch vụ",
  "VIEW_REPORTS": "Xem Báo cáo Kế toán",
  "MANAGE_CONTENT": "Quản lý Bài viết & Nội dung",
  "MANAGE_INVENTORY": "Quản lý Tài sản & Kho"
};

const UserListPage = () => {
  const setLoading = useLoadingStore((state) => state.setLoading);

  const [users, setUsers] = useState([]); 
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [total, setTotal] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);

  // --- LẤY QUYỀN HIỆN TẠI TỪ STORE ---
  const currentPermissions = useAdminAuthStore(state => state.permissions) || [];
  const canManageUsers = currentPermissions.includes("MANAGE_USERS");
  const canCreateUsers = currentPermissions.includes("CREATE_USERS") || canManageUsers;
  const canViewUsers = currentPermissions.includes("VIEW_USERS") || canManageUsers;
  
  const canManageRoles = currentPermissions.includes("MANAGE_ROLES");
  const canViewRoles = currentPermissions.includes("VIEW_ROLES") || canManageRoles;
  const canEditRoles = currentPermissions.includes("EDIT_ROLES") || canManageRoles;

  // --- ROLE & PERMISSION STATE ---
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  // --- FETCH DỮ LIỆU ---
  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const response = await userManagementAPI.getUsers();
      const data = response.data.items || response.data.data || response.data || [];
      setUsers(data);
      setFilteredUsers(data); 
      setTotal(data.length);
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng!');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await roleAPI.getPermissions();
      setAllPermissions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchAllPermissions();
  }, []);

  // --- BỘ LỌC TỔNG HỢP ---
  useEffect(() => {
    const result = users.filter((user) => {
      const matchSearch = 
        (user.fullName && user.fullName.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchText.toLowerCase()));

      let matchRole = true;
      if (filterRole) {
          const selectedRoleObj = roles.find(r => r.id === filterRole);
          if (selectedRoleObj) matchRole = user.roleName === selectedRoleObj.name;
      }

      let matchStatus = true;
      if (filterStatus !== null && filterStatus !== undefined) {
          const statusBool = filterStatus === "true" || filterStatus === true;
          matchStatus = user.isActive === statusBool;
      }

      return matchSearch && matchRole && matchStatus;
    });

    setFilteredUsers(result);
    setTotal(result.length);
    setPagination(prev => ({ ...prev, current: 1 })); 
  }, [searchText, filterRole, filterStatus, users, roles]);

  const handleTableChange = (pag) => setPagination({ current: pag.current, pageSize: pag.pageSize });

  // --- XỬ LÝ FORM ---
  const handleAddNew = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    const roleObj = roles.find(r => r.name === user.roleName);
    form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roleId: roleObj ? roleObj.id : null
    });
    setModalVisible(true);
  };

  const handleToggleStatus = (user) => {
    const actionName = user.isActive ? 'TẮT (Disable)' : 'MỞ (Enable)';
    Modal.confirm({
      title: 'Xác nhận thay đổi trạng thái',
      content: `Bạn có chắc chắn muốn ${actionName} tài khoản ${user.email}?`,
      okText: 'Đồng ý',
      okType: user.isActive ? 'danger' : 'primary',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setLocalLoading(true);
          await userManagementAPI.toggleStatus(user.id);
          
          const successMsg = `Đã ${user.isActive ? 'tắt' : 'mở'} tài khoản thành công!`;
          message.success(successMsg);
          
          auditLogger.success(successMsg, {
            actionType: 'UPDATE',
            module: 'Nhân viên & Quyền',
            objectName: user.fullName,
            description: `[${user.email}] Trạng thái: ${user.isActive ? 'Hoạt động → Đã tắt' : 'Đã tắt → Hoạt động'}`,
            oldValue: { status: user.isActive ? 'Active' : 'Disabled' },
            newValue: { status: user.isActive ? 'Disabled' : 'Active' },
          });
          
          fetchUsers();
        } catch (error) {
          message.error('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
          setLocalLoading(false);
        }
      }
    });
  };

  const handleSubmitForm = async (values) => {
    try {
      setLocalLoading(true);
      if (editingId) {
        // Update
        await userManagementAPI.updateUser(editingId, values);
        
        message.success('Cập nhật nhân viên thành công!');
        auditLogger.success("Cập nhật thông tin nhân viên thành công!", {
          actionType: 'UPDATE',
          module: 'Nhân viên & Quyền',
          objectName: values.fullName,
          description: `Cập nhật thông tin nhân viên: ${values.email}`,
          newValue: values,
        });
      } else {
        // Create
        await userManagementAPI.createUser(values);
        
        message.success('Thêm nhân viên mới thành công!');
        auditLogger.success("Thêm nhân viên mới thành công!", {
          actionType: 'CREATE',
          module: 'Nhân viên & Quyền',
          objectName: values.fullName,
          description: `Thêm nhân viên mới: ${values.email}`,
          newValue: values,
        });
      }
      setModalVisible(false);
      fetchUsers(); 
    } catch (error) {
      message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
        setLocalLoading(false);
    }
  };

  // --- XỬ LÝ PHÂN QUYỀN VAI TRÒ ---
  const handleOpenRoleModal = async (role) => {
    setSelectedRole(role);
    setLocalLoading(true);
    try {
      const res = await roleAPI.getRolePermissions(role.id);
      setRolePermissions(res.data || []);
      setRoleModalVisible(true);
    } catch (error) {
      message.error("Lỗi khi tải quyền của chức vụ này!");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSaveRolePermissions = async () => {
    try {
      setLocalLoading(true);
      await roleAPI.assignPermissions(selectedRole.id, rolePermissions);
      
      message.success(`Đã cập nhật phân quyền cho chức vụ ${selectedRole.name} thành công!`);
      auditLogger.success(`Đã cập nhật phân quyền cho chức vụ ${selectedRole.name}!`, {
          actionType: 'UPDATE',
          module: 'Nhân viên & Quyền',
          objectName: selectedRole.name,
          description: `Cập nhật phân quyền cho chức vụ: ${selectedRole.name}`
      });
      setRoleModalVisible(false);
    } catch (error) {
      message.error('Lỗi khi lưu quyền: ' + (error.response?.data?.message || error.message));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleTogglePermission = (permissionId, e) => {
    if (e.target.checked) {
      setRolePermissions([...rolePermissions, permissionId]);
    } else {
      setRolePermissions(rolePermissions.filter(id => id !== permissionId));
    }
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', render: t => <b>{t}</b> },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'Điện thoại', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { 
      title: 'Vai trò', 
      dataIndex: 'roleName', 
      key: 'roleName', 
      render: (role) => <Tag color="blue">{role || 'N/A'}</Tag> 
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} style={{ borderRadius: 10 }}>
          {isActive ? '● Hoạt động' : '● Đang tắt'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      render: (_, user) => (
        <Space size="middle">
          {canManageUsers && <Button ghost type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEdit(user)}>Sửa</Button>}
          {canManageUsers && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{user.isActive ? 'Bật' : 'Tắt'}</Text>
              <Switch 
                checked={user.isActive} 
                onChange={() => handleToggleStatus(user)}
                loading={localLoading}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </div>
          )}
        </Space>
      ),
    },
  ];

  const userTabContent = (
    <>
      {/* BỘ LỌC DÀN HÀNG NGANG */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: 24, flexWrap: 'wrap' }}>
        <Input
          placeholder="Tìm theo tên, email..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        
        <Select 
          placeholder="Tất cả vai trò" 
          style={{ width: 200 }} 
          onChange={(v) => setFilterRole(v)} 
          allowClear
        >
          {roles.map(role => (<Option key={role.id} value={role.id}>{role.name}</Option>))}
        </Select>

        <Select 
          placeholder="Tất cả trạng thái" 
          style={{ width: 200 }} 
          onChange={(v) => setFilterStatus(v)} 
          allowClear
        >
          <Option value="true">Hoạt động</Option>
          <Option value="false">Đang tắt</Option>
        </Select>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        loading={localLoading} 
        rowKey="id" 
        pagination={{ 
            ...pagination, 
            total: total, 
            showTotal: (t) => `Tổng cộng ${t} nhân viên`,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize })
        }} 
        size="middle" 
        scroll={{ x: 900 }}
      />
    </>
  );

  const roleTabContent = (
    <Table 
      columns={[
        { title: 'ID', dataIndex: 'id', key: 'id', width: 100, render: id => `#ROL-${id}` },
        { title: 'TÊN VAI TRÒ', dataIndex: 'name', key: 'name', width: 200, render: (t) => <Space><SafetyCertificateOutlined style={{color: '#1890ff'}}/> <b>{t}</b></Space> },
        { title: 'MÔ TẢ', dataIndex: 'description', key: 'description' },
        { title: 'THAO TÁC', key: 'actions', width: 150, render: (_, record) => canEditRoles ? <Button type="primary" onClick={() => handleOpenRoleModal(record)}>PHÂN QUYỀN</Button> : null }
      ]}
      dataSource={roles}
      rowKey="id"
      pagination={false}
      bordered
      scroll={{ x: 600 }}
    />
  );

  const tabItems = [
    ...(canViewUsers ? [{ key: 'users', label: 'Danh sách nhân viên', children: userTabContent }] : []),
    ...(canViewRoles ? [{ key: 'roles', label: 'Vai trò & Phân quyền', children: roleTabContent }] : []),
  ];

  return (
    <Card style={{ margin: 24, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* PHẦN ĐẦU */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Nhân viên & Phân Quyền</Title>
          <Text type="secondary">Quản lý tài khoản nhân viên và cấu hình phân quyền hệ thống</Text>
        </div>
        {canCreateUsers && (
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddNew} style={{ borderRadius: 8 }}>
            Thêm nhân viên
          </Button>
        )}
      </div>

      {tabItems.length > 0 ? (
        <Tabs items={tabItems} defaultActiveKey={canViewUsers ? "users" : "roles"} />
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          Bạn không có quyền xem thông tin trong trang này.
        </div>
      )}

      {/* MODAL THÊM/SỬA */}
      <Modal 
        title={editingId ? "📝 Cập nhật Người dùng" : "✨ Thêm Người dùng mới"} 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        width={600} 
        centered
        destroyOnClose
      >
        <Form form={form} name="user-form" layout="vertical" onFinish={handleSubmitForm} style={{ marginTop: 15 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên đi ní!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email!' }, { type: 'email', message: 'Sai định dạng rồi!' }]}>
            <Input placeholder="example@domain.com" disabled={!!editingId} />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input placeholder="0123456789" />
          </Form.Item>
          
          {!editingId && (
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Ít nhất 6 ký tự nha!' }]}>
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
          )}
          
          <Form.Item name="roleId" label="Vai trò" rules={[{ required: true, message: 'Chọn chức vụ!' }]}>
            <Select placeholder="Chọn vai trò">
              {roles.map(role => (<Option key={role.id} value={role.id}>{role.name}</Option>))}
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Hủy bỏ</Button>
              <Button type="primary" htmlType="submit" loading={localLoading}>
                {editingId ? "Cập nhật ngay" : "Tạo tài khoản"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL PHÂN QUYỀN VAI TRÒ */}
      <Modal
        title={`Phân quyền cho: ${selectedRole?.name}`}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRoleModalVisible(false)}>Hủy</Button>,
          <Button key="save" type="primary" onClick={handleSaveRolePermissions} loading={localLoading}>Lưu thay đổi</Button>
        ]}
        width={700}
        centered
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Vui lòng tick chọn các chức năng mà vai trò này được phép truy cập
        </Text>
        <Row gutter={[16, 16]}>
          {allPermissions.map(p => (
             <Col span={8} key={p.id}>
               <Checkbox 
                 checked={rolePermissions.includes(p.id)} 
                 onChange={(e) => handleTogglePermission(p.id, e)}
               >
                 {PERMISSION_MAP[p.name] || p.name}
               </Checkbox>
             </Col>
          ))}
        </Row>
      </Modal>
    </Card>
  );
};

export default UserListPage;