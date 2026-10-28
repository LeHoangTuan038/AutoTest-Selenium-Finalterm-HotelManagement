import { message } from 'antd';
import { useAuditLogStore } from '../store/auditLogStore';

/**
 * Utility to handle success/error messages and automatically log them to the Audit Log.
 */
export const auditLogger = {
  success: (msg, details = {}) => {
    message.success(msg);
    
    // Auto-extract user info from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const userName = user?.fullName || localStorage.getItem('userName') || 'User';
    const email = user?.email || localStorage.getItem('userEmail') || '';

    useAuditLogStore.getState().addAuditLog({
      action: 'Thông báo',
      actionType: details.actionType || 'OTHER',
      module: details.module || 'Hệ thống',
      objectName: details.objectName || 'Web App',
      description: details.description || msg,
      userName: userName,
      email: email,
      ...details
    });
  },

  error: (msg, details = {}) => {
    message.error(msg);
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userName = user?.fullName || localStorage.getItem('userName') || 'User';
    
    useAuditLogStore.getState().addAuditLog({
      action: 'Lỗi',
      actionType: 'OTHER',
      module: details.module || 'Hệ thống',
      objectName: details.objectName || 'Web App',
      description: `Lỗi: ${msg}`,
      userName: userName,
      status: 'Error',
      ...details
    });
  },
  
  info: (msg, details = {}) => {
    message.info(msg);
  }
};
