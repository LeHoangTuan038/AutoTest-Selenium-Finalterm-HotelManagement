import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Dropdown, Space, Typography, message, Tooltip, Button, Drawer } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  InboxOutlined,
  ShopOutlined,
  WarningOutlined,
  ClearOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
  TeamOutlined,
  ExportOutlined,
  FileDoneOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  DatabaseOutlined,
  LinkOutlined,
  FileTextOutlined,
  PercentageOutlined
} from "@ant-design/icons";

import { getUserRoles } from "../utils/auth";
import { useAdminAuthStore } from "../store/adminAuthStore";
import NotificationBell from "../components/NotificationBell";

const { Header, Content, Sider } = Layout;

const COLORS = {
  siderBg: '#141414',
  siderMenuBg: '#141414',
  activeItemBg: '#fadb14',
  activeItemColor: '#000',
  textColor: '#a6a6a6',
  headerBg: '#ffffff',
  contentBg: '#f0f2f5',
  cardBg: '#ffffff'
};

const AdminLayout = () => {
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();
  const clearAuth = useAdminAuthStore((state) => state.clearAuth);
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const roles = getUserRoles();
    setUserRoles(Array.isArray(roles) ? roles : [roles]);

    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tự động tính toán và mở đúng thư mục mỗi khi chuyển trang
  useEffect(() => {
    const path = location.pathname;
    let keys = [];
    if (path.includes('/admin/rooms') || path.includes('/admin/housekeeping') || path.includes('/admin/bookings') || path.includes('/admin/checkout') || path.includes('/admin/arrivals') || path.includes('/admin/in-house') || path.includes('/admin/invoices') || path.includes('/receptionist/invoice-draft')) {
      keys = ['folder-reception'];
    } else if (path.includes('/admin/warehouse') || path.includes('/admin/inventory') || path.includes('/admin/loss-and-damage')) {
      keys = ['folder-assets'];
    } else if (path.includes('/receptionist/dashboard') && !getUserRoles().includes('Admin')) {
      keys = ['folder-main'];
    } else if (path.includes('/homepage') || path.includes('/receptionist/dashboard') || path.includes('/housekeeper/dashboard')) {
      keys = ['folder-links'];
    } else {
      keys = ['folder-main'];
    }
    setOpenKeys(keys);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    message.success("Đăng xuất thành công!");
    navigate("/login");
  };

  const handleGoToProfile = () => {
    // UserProfilePage trong App.jsx đang đăng ký route: /guest/profile
    // Tránh navigate nhầm sang /admin/profile (route không tồn tại hoặc bị chặn bởi guard).
    navigate("/guest/profile");
  };

  const isAdmin = userRoles.includes("Admin");
  const isReceptionist = userRoles.includes("Receptionist");
  const isHousekeeping = userRoles.includes("Housekeeping");
  
  const permissions = useAdminAuthStore(state => state.permissions) || [];
  
  // Ánh xạ toàn bộ quyền theo yêu cầu
  const canViewDashboard = permissions.includes("VIEW_DASHBOARD");
  const canManageUsers = permissions.includes("MANAGE_USERS") || permissions.includes("VIEW_USERS") || permissions.includes("MANAGE_ROLES") || permissions.includes("VIEW_ROLES");
  const canViewReports = permissions.includes("VIEW_REPORTS");
  const canManageContent = permissions.includes("MANAGE_CONTENT");
  const canManageRooms = permissions.includes("MANAGE_ROOMS");
  const canManageBookings = permissions.includes("MANAGE_BOOKINGS");
  const canManageInvoices = permissions.includes("MANAGE_INVOICES");
  const canManageInventory = permissions.includes("MANAGE_INVENTORY");
  
  // Lễ tân dùng chung cấu trúc menu với Admin, nhưng các trang có route chỉ dành cho Admin
  // (App.jsx: dashboard, users, accounting, audit, posts, promotions, inventory) thì ẩn đi
  const showReceptionistDesk = isReceptionist && !isAdmin;

  // Đảm bảo thư mục cha hiện nếu có ít nhất một chức năng con được hiển thị
  const showMainFolder = showReceptionistDesk || (isAdmin && (canViewDashboard || canManageUsers || canViewReports || canManageContent));
  const showReceptionFolder = canManageRooms || canManageBookings || canManageInvoices;
  const showAssetsFolder = canManageInventory;

  const menuItems = (isHousekeeping && !isAdmin) ? [
    {
      key: 'folder-links',
      icon: <LinkOutlined />,
      label: <span style={{ fontWeight: 'bold' }}>LIÊN KẾT NHANH</span>,
      children: [
        { key: "/homepage", icon: <HomeOutlined />, label: <Link to="/homepage">Trang chủ</Link> },
        { key: "/housekeeper/dashboard", icon: <ClearOutlined />, label: <Link to="/housekeeper/dashboard">Bàn Buồng phòng</Link> }
      ]
    }
  ] : [
    showMainFolder && {
      key: 'folder-main',
      icon: <AppstoreOutlined />,
      label: <span style={{ fontWeight: 'bold' }}>MENU CHÍNH</span>,
      children: [
        showReceptionistDesk && { key: "/receptionist/dashboard", icon: <DashboardOutlined />, label: <Link to="/receptionist/dashboard">Bàn Lễ tân</Link> },
        isAdmin && canViewDashboard && { key: "/admin/dashboard", icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Tổng quan</Link> },
        isAdmin && canManageUsers && { key: "/admin/users", icon: <UserOutlined />, label: <Link to="/admin/users">Nhân viên & Quyền</Link> },
        isAdmin && canViewReports && { key: "/admin/accounting", icon: <LineChartOutlined />, label: <Link to="/admin/accounting">Kế toán</Link> },
        isAdmin && canManageContent && { key: "/admin/audit", icon: <SafetyCertificateOutlined />, label: <Link to="/admin/audit">Audit Logs</Link> },
        isAdmin && canManageContent && { key: "/admin/posts", icon: <FileTextOutlined />, label: <Link to="/admin/posts">Quản lý Bài Viết</Link> },
        isAdmin && canManageContent && { key: "/admin/promotions", icon: <PercentageOutlined />, label: <Link to="/admin/promotions">Khuyến Mãi</Link> }
      ].filter(Boolean)
    },

    showReceptionFolder && {
      key: 'folder-reception',
      icon: <SolutionOutlined />,
      label: <span style={{ fontWeight: 'bold' }}>QUẦY LỄ TÂN</span>,
      children: [
        canManageRooms && { key: "/admin/rooms", icon: <HomeOutlined />, label: <Link to="/admin/rooms">Quản lý Phòng</Link> },
        canManageRooms && { key: "/admin/housekeeping", icon: <ClearOutlined />, label: <Link to="/admin/housekeeping">Dọn Phòng</Link> },
        canManageBookings && { key: "/admin/bookings", icon: <CalendarOutlined />, label: <Link to="/admin/bookings">Quản lý Đặt phòng</Link> },
        canManageBookings && { key: "/admin/arrivals", icon: <UsergroupAddOutlined />, label: <Link to="/admin/arrivals">Khách đến hôm nay</Link> },
        canManageBookings && { key: "/admin/in-house", icon: <TeamOutlined />, label: <Link to="/admin/in-house">Khách đang lưu trú</Link> },
        canManageBookings && { key: "/admin/checkout", icon: <ExportOutlined />, label: <Link to="/admin/checkout">Trả phòng</Link> },
        canManageInvoices && { key: "/admin/invoices", icon: <FileDoneOutlined />, label: <Link to="/admin/invoices">Hóa đơn</Link> }
      ].filter(Boolean)
    },

    showAssetsFolder && {
      key: 'folder-assets',
      icon: <DatabaseOutlined />,
      label: <span style={{ fontWeight: 'bold' }}>QUẢN LÝ TÀI SẢN</span>,
      children: [
        canManageInventory && { key: "/admin/warehouse", icon: <InboxOutlined />, label: <Link to="/admin/warehouse">Kho Vật Tư</Link> },
        isAdmin && canManageInventory && { key: "/admin/inventory", icon: <ShopOutlined />, label: <Link to="/admin/inventory">Vật Tư Phòng</Link> },
        canManageInventory && { key: "/admin/loss-and-damage", icon: <WarningOutlined />, label: <Link to="/admin/loss-and-damage">Đền Bù</Link> }
      ].filter(Boolean)
    },

    {
      key: 'folder-links',
      icon: <LinkOutlined />,
      label: <span style={{ fontWeight: 'bold' }}>LIÊN KẾT NHANH</span>,
      children: [
        { key: "/homepage", icon: <HomeOutlined />, label: <Link to="/homepage">Trang chủ</Link> },
        isAdmin && isReceptionist && { key: "/receptionist/dashboard", icon: <DashboardOutlined />, label: <Link to="/receptionist/dashboard">Bàn Lễ tân</Link> },
        isHousekeeping && { key: "/housekeeper/dashboard", icon: <ClearOutlined />, label: <Link to="/housekeeper/dashboard">Bàn Buồng phòng</Link> }
      ].filter(Boolean)
    }
  ].filter(Boolean);

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Hồ sơ của tôi" },
    { type: 'divider' },
    { key: "logout", label: <span style={{ color: 'red' }}>Đăng xuất</span>, icon: <LogoutOutlined style={{ color: 'red' }} />, onClick: handleLogout },
  ];

  // Xử lý sự kiện khi người dùng tự bấm mở/đóng thư mục (chế độ Accordion: chỉ mở duy nhất 1 mục)
  const onOpenChange = (keys) => {
    const rootSubmenuKeys = ['folder-main', 'folder-reception', 'folder-assets', 'folder-links'];
    const latestOpenKey = keys.find(key => !openKeys.includes(key));
    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  const siderContent = (
    <>
      <div style={{ padding: collapsed && !isMobile ? '24px 0' : '24px 20px', display: 'flex', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
        <div style={{ width: 40, height: 40, background: COLORS.activeItemBg, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <HomeOutlined style={{ color: COLORS.activeItemColor, fontSize: 20 }} />
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16, lineHeight: 1.2 }}>IT CODE</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>Hotel Management</div>
          </div>
        )}
      </div>

      <div className="custom-menu-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={() => { if (isMobile) setCollapsed(true); }}
          items={menuItems}
          style={{ background: COLORS.siderMenuBg, borderRight: 'none', padding: (collapsed && !isMobile) ? '0' : '0 10px' }}
        />
      </div>

      <div style={{ padding: (collapsed && !isMobile) ? '16px 0' : '16px 20px', borderTop: '1px solid #333', background: '#0d0d0d', display: 'flex', justifyContent: (collapsed && !isMobile) ? 'center' : 'space-between', alignItems: 'center' }}>
        {(!collapsed || isMobile) && (
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <Avatar size={32} style={{ backgroundColor: COLORS.activeItemBg, color: COLORS.activeItemColor, fontWeight: 'bold' }}>
                {userRoles[0]?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {isAdmin ? 'Quản Lý' : (isHousekeeping ? 'Buồng Phòng' : 'Nhân Viên')}
                </div>
              </div>
            </div>
          </Dropdown>
        )}

        {!isMobile && (
          <Tooltip title={collapsed ? "Mở rộng" : "Thu gọn"} placement="right">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#8c8c8c', fontSize: '18px', width: 40, height: 40 }}
            />
          </Tooltip>
        )}
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {!isMobile ? (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          collapsedWidth={80}
          style={{
            background: COLORS.siderBg,
            display: 'flex', flexDirection: 'column', height: '100vh',
            position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
            transition: 'all 0.2s ease'
          }}
        >
          {siderContent}
        </Sider>
      ) : (
        <Drawer
          title={null}
          placement="left"
          closable={false}
          onClose={() => setCollapsed(true)}
          open={!collapsed}
          width={260}
          styles={{
            body: { background: COLORS.siderBg, padding: 0, display: 'flex', flexDirection: 'column' },
            mask: { background: 'rgba(0, 0, 0, 0.6)' }
          }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 250), background: COLORS.contentBg, transition: 'all 0.2s ease', minHeight: '100vh' }}>
        <Header style={{ background: COLORS.headerBg, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 64, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '18px', width: 40, height: 40, marginRight: 16 }}
              />
            )}
            <Typography.Title level={5} style={{ margin: 0, color: '#262626' }}>
              {isMobile ? "Quản lý Khách sạn" : ""}
            </Typography.Title>
          </div>

          <Space size={16} style={{ alignItems: 'center' }}>
            <NotificationBell />
            <div style={{ height: 28, width: 1, background: '#e8e8e8' }}></div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Avatar size={36} style={{ backgroundColor: COLORS.activeItemBg, color: COLORS.activeItemColor, fontWeight: 'bold', fontSize: 15 }}>
                  {userRoles[0]?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
                <div style={{ minWidth: 'auto' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#262626', lineHeight: 1.2 }}>
                    {isAdmin ? 'Admin' : (isHousekeeping ? 'Buồng Phòng' : 'Nhân Viên')}
                  </div>
                  <div style={{ fontSize: 10, color: '#8c8c8c', lineHeight: 1.2 }}>{userRoles.join(', ')}</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? '12px' : '24px' }}>
          <div style={{ background: COLORS.cardBg, borderRadius: 12, minHeight: 'calc(100vh - 48px)', overflow: isMobile ? 'auto' : 'hidden' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <style>{`
        .custom-menu-scroll::-webkit-scrollbar { width: 6px; }
        .custom-menu-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-menu-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-menu-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); }

        .ant-menu-dark .ant-menu-item { color: ${COLORS.textColor}; border-radius: 8px; margin-bottom: 4px; }
        .ant-menu-dark .ant-menu-item:hover { color: white !important; background: rgba(255,255,255,0.08) !important; }
        
        .ant-menu-dark.ant-menu-dark .ant-menu-item-selected { background-color: ${COLORS.activeItemBg} !important; color: ${COLORS.activeItemColor} !important; font-weight: bold; }
        .ant-menu-dark.ant-menu-dark .ant-menu-item-selected .anticon { color: ${COLORS.activeItemColor} !important; }

        .ant-menu-dark .ant-menu-submenu-title { color: ${COLORS.textColor}; border-radius: 8px; margin-bottom: 4px; }
        .ant-menu-dark .ant-menu-submenu-title:hover { color: white !important; background: rgba(255,255,255,0.08) !important; }
        .ant-menu-dark .ant-menu-sub { background: transparent !important; }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;