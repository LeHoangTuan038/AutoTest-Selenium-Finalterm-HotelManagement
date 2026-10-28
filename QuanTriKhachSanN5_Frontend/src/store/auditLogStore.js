import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import { auditLogApi } from '../api/auditLogApi';

/**
 * Zustand Store để quản lý Audit Logs toàn cộng
 * - Lưu tất cả audit logs
 * - Lưu notifications (real-time)
 * - Auto remove old logs
 * - Persist to localStorage
 */
export const useAuditLogStore = create(
  persist(
    (set, get) => ({
  // State
  auditLogs: [],
  notifications: [], // Thông báo mới (chưa xem)
  allNotifications: [], // Tất cả thông báo (kể cả đã xem)

  // Thêm audit log mới
  addAuditLog: (logData) => {
    const userName = logData.userName || localStorage.getItem('userName') || 'User';
    const email = logData.email || localStorage.getItem('userEmail') || '';

    const newLog = {
      id: Date.now(),
      timestamp: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      userName,
      email,
      ...logData,
    };

    console.log('🔔 [Store] addAuditLog called:', newLog);

    set((state) => {
      return {
        auditLogs: [newLog, ...state.auditLogs],
        notifications: [newLog, ...state.notifications],
        allNotifications: [newLog, ...state.allNotifications],
      };
    });

    // Sync to backend database real-time
    // We send it to backend, which will use the JWT token to identify the real User/Role
    auditLogApi.createAuditLog(newLog).catch(err => {
      // Chỉ in cảnh báo 1 lần để tránh spam console khi backend down
      if (!useAuditLogStore._backendSyncFailed) {
        useAuditLogStore._backendSyncFailed = true;
        console.warn('⚠️ Could not sync audit log to database. It is saved locally.', err.message || err);
        setTimeout(() => { useAuditLogStore._backendSyncFailed = false; }, 30000); // Reset sau 30 giây
      }
    });

    return newLog;
  },

  // Xóa notification khỏi danh sách chưa xem
  markNotificationAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    }));
  },

  // Xóa tất cả notifications chưa xem
  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: [],
    }));
  },

  // Xóa notification cụ thể
  deleteNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
      allNotifications: state.allNotifications.filter((n) => n.id !== notificationId),
    }));
  },

  // Xóa audit log cụ thể
  deleteAuditLog: (logId) => {
    set((state) => ({
      auditLogs: state.auditLogs.filter((log) => log.id !== logId),
      notifications: state.notifications.filter((n) => n.id !== logId),
      allNotifications: state.allNotifications.filter((n) => n.id !== logId),
    }));
  },

  // Xóa nhiều audit logs
  deleteMultipleAuditLogs: (logIds) => {
    set((state) => ({
      auditLogs: state.auditLogs.filter((log) => !logIds.includes(log.id)),
      notifications: state.notifications.filter((n) => !logIds.includes(n.id)),
      allNotifications: state.allNotifications.filter((n) => !logIds.includes(n.id)),
    }));
  },

  // Lấy audit logs
  getAuditLogs: () => get().auditLogs,

  // Lấy notifications chưa xem
  getNotifications: () => get().notifications,

  // Lấy tất cả notifications
  getAllNotifications: () => get().allNotifications,

  // Clear all (test/reset)
  clearAll: () => {
    set({
      auditLogs: [],
      notifications: [],
      allNotifications: [],
    });
  },
    }),
    {
      name: 'auditLogStore', // localStorage key
      partialize: (state) => ({
        auditLogs: state.auditLogs,
        notifications: state.notifications,
        allNotifications: state.allNotifications,
      }), // Only persist these fields
    }
  )
);