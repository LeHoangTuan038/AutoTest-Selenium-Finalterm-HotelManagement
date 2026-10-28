import React from 'react';
import { Badge, Dropdown, Empty, Tag, Divider, Button, Space, Typography } from 'antd';
import { BellOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useAuditLogStore } from '../store/auditLogStore';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

// Màu sắc cho các hành động (match với AuditLogsPage)
const ACTION_COLORS = {
  CREATE: '#52c41a',
  UPDATE: '#faad14',
  DELETE: '#ff4d4f',
  CHECKIN: '#1890ff',
  CHECKOUT: '#13c2c2',
  PAYMENT: '#722ed1',
  LOGIN: '#eb2f96',
  OTHER: '#666',
};

// Dịch các giá trị tiếng Anh sang tiếng Việt
const ENGLISH_TO_VI = {
  // Status
  'Active': 'Hoạt động',
  'Inactive': 'Không hoạt động',
  'Pending': 'Chờ xử lý',
  'Paid': 'Đã thanh toán',
  'Unpaid': 'Chưa thanh toán',
  'Confirmed': 'Đã xác nhận',
  'Cancelled': 'Đã hủy',
  'Completed': 'Hoàn thành',
  
  // Room status
  'Available': 'Có sẵn',
  'Occupied': 'Đã cho thuê',
  'Dirty': 'Bẩn',
  'Clean': 'Sạch',
  'Maintenance': 'Bảo trì',
  
  // Check-in/out
  'Checked-in': 'Đã nhận phòng',
  'Checked-out': 'Đã trả phòng',
  'Full': 'Đầy',
  'Partial': 'Thiếu',
  
  // Payment
  'Cash': 'Tiền mặt',
  'Card': 'Thẻ',
  'Bank Transfer': 'Chuyển khoản',
  'Router': 'Bộ phát WiFi',
  
  // Role
  'Admin': 'Quản trị viên',
  'Manager': 'Quản lý',
  'Receptionist': 'Lễ tân',
  'Housekeeper': 'Nhân viên vệ sinh',
};

const translateValue = (value) => {
  if (typeof value === 'string' && ENGLISH_TO_VI[value]) {
    return ENGLISH_TO_VI[value];
  }
  return value;
};

const NotificationBell = () => {
  const notifications = useAuditLogStore((state) => state.notifications);
  const markNotificationAsRead = useAuditLogStore((state) => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useAuditLogStore((state) => state.markAllNotificationsAsRead);
  const deleteNotification = useAuditLogStore((state) => state.deleteNotification);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  console.log('🔔 [NotificationBell] Rendered with notifications count:', notifications.length);
  console.log('🔔 [NotificationBell] Notifications:', notifications);

  // Render item notification
  const renderNotificationItem = (notification) => {
    const isDeleting = deleteConfirm === notification.id;
    return (
      <div
        key={notification.id}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'background 0.3s',
          backgroundColor: isDeleting ? '#fff7e6' : 'transparent',
        }}
        onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.background = '#fafafa')}
        onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.background = 'transparent')}
        onClick={() => !isDeleting && markNotificationAsRead(notification.id)}
      >
        {isDeleting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13 }}>
              ✓ Xác nhận xóa?
            </Text>
            <Space size="small">
              <Button 
                type="primary" 
                danger 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                  setDeleteConfirm(null);
                }}
              >
                Xóa
              </Button>
              <Button 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(null);
                }}
              >
                Hủy
              </Button>
            </Space>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4 }}>
                <Tag color={ACTION_COLORS[notification.actionType] || ACTION_COLORS.OTHER}>
                  {notification.action}
                </Tag>
                <Text strong style={{ marginLeft: 8 }}>
                  {notification.module}
                </Text>
              </div>
              <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>
                {translateValue(notification.description)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                👤 {notification.userName} • {dayjs(notification.timestamp).fromNow()}
              </div>
            </div>
            <DeleteOutlined
              style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(notification.id);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const items = [
    {
      key: 'notifications',
      label: (
        <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: 14 }}>
            🔔 Thông báo ({notifications.length})
          </div>
          <Divider style={{ margin: 0 }} />

          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px' }}>
              <Empty description="Không có thông báo mới" style={{ margin: 0 }} />
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map(renderNotificationItem)}
              {notifications.length > 10 && (
                <div style={{ padding: '12px 16px', textAlign: 'center', color: '#1890ff', cursor: 'pointer' }}>
                  Xem thêm {notifications.length - 10} thông báo...
                </div>
              )}
            </div>
          )}

          {notifications.length > 0 && (
            <>
              <Divider style={{ margin: 0 }} />
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  size="small"
                  style={{ flex: 1 }}
                  onClick={() => markAllNotificationsAsRead()}
                >
                  Đánh dấu đã đọc
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      placement="bottomRight"
      arrow={{ pointAtCenter: true }}
      trigger={['click']}
    >
      <Badge
        count={notifications.length}
        style={{
          backgroundColor: '#ff4d4f',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        <BellOutlined
          style={{
            fontSize: 18,
            color: '#666',
            cursor: 'pointer',
            transition: 'color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1890ff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;