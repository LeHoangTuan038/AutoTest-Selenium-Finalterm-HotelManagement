// Mock data cho Audit Logs (vì backend chưa có)
const MOCK_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: '2026-04-03T20:45:12',
    userId: 'USR001',
    userName: 'Admin',
    email: 'admin@hotel.com',
    action: 'Sửa',
    actionType: 'UPDATE',
    module: 'Nhân viên & Quyền',
    objectName: 'Ngô Văn A',
    description: 'Thay đổi chức vụ từ \"Receptionist\" sang \"Manager\"',
    oldValue: { role: 'Receptionist', status: 'Active' },
    newValue: { role: 'Manager', status: 'Active' },
    ipAddress: '192.168.1.100',
  },
  // ... (keeping all mock data as is for brevity - full list in original)
  {
    id: 12,
    timestamp: '2026-04-02T19:45:00',
    userId: 'USR001',
    userName: 'Admin',
    email: 'admin@hotel.com',
    action: 'Xóa',
    actionType: 'DELETE',
    module: 'Nhân viên & Quyền',
    objectName: 'Trần Văn F',
    description: 'Xóa tài khoản nhân viên (Chức vụ: Receptionist, Trạng thái: Inactive)',
    oldValue: { role: 'Receptionist', status: 'Inactive', email: 'tranvanf@hotel.com' },
    newValue: null,
    ipAddress: '192.168.1.100',
  },
];

import api from './axios';

/**
 * API Audit Logs
 */
export const auditLogApi = {
  // Lấy danh sách audit logs từ backend
  getAuditLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs', { params });
      const rawLogs = response.data?.data || [];
      return { data: rawLogs };
    } catch (error) {
      console.error('Failed to fetch audit logs from backend:', error);
      return { data: MOCK_AUDIT_LOGS }; // Fallback to mock
    }
  },

  // Lọc audit logs (dùng chung getAuditLogs với params)
  filterAuditLogs: (filters = {}) => {
    return auditLogApi.getAuditLogs(filters);
  },

  // Lấy chi tiết một audit log
  getAuditLogDetail: (id) => {
    const log = MOCK_AUDIT_LOGS.find(l => l.id === id);
    return Promise.resolve({ data: log });
  },

  // Xuất audit logs ra Excel (tùy chọn - chưa implement)
  exportAuditLogs: (filters = {}) => {
    // TODO: Implement when backend is ready
    // return api.post('/audit-logs/export', filters, { responseType: 'blob' });
    return Promise.resolve({ data: null });
  },

  createAuditLog: async (eventsInput) => {
    try {
      let events = Array.isArray(eventsInput) ? eventsInput : [eventsInput];

      // Normalize events
      events = events.map(event => ({
        eventId: event.eventId || `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: event.timestamp || new Date().toISOString(),
        actionType: event.actionType || 'OTHER',
        module: event.module || 'Hệ thống',
        objectName: event.objectName || 'Web App',
        description: event.description || '',
        ...event
      }));

      const payload = {
        totalEvents: events.length,
        events: events
      };

      const response = await api.post('/audit-logs', payload);
      return response;
    } catch (error) {
      console.error('❌ Backend audit log sync failed:', error);
      throw error;
    }
  },
};
