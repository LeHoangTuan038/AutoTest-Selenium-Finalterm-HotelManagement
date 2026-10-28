import { useAuditLogStore } from '../store/auditLogStore';
import { message } from 'antd';

/**
 * Custom Hook để ghi Audit Log và hiển thị notification
 * Sử dụng: const { logAction } = useAuditLog();
 *         logAction({ action: 'Thêm', module: 'Nhân viên & Quyền', ... })
 */
export const useAuditLog = () => {
  const addAuditLog = useAuditLogStore((state) => state.addAuditLog);

  const logAction = ({
    action = 'Khác',
    actionType = 'OTHER',
    module = 'Hệ thống',
    objectName = '',
    description = '',
    oldValue = null,
    newValue = null,
    userName = localStorage.getItem('userName') || 'User',
    email = localStorage.getItem('userEmail') || '',
    userId = localStorage.getItem('userId') || null,
    ipAddress = '127.0.0.1',
  }) => {
    console.log('📝 [Audit Log] Logging action:', { action, module, objectName, description });
    
    // Thêm vào store
    const log = addAuditLog({
      action,
      actionType,
      module,
      objectName,
      description,
      oldValue,
      newValue,
      userName,
      email,
      userId,
      ipAddress,
    });

    console.log('✅ [Audit Log] Added to store with ID:', log.id);

    // Hiển thị toast notification
    const messageKey = `audit-${log.id}`;
    message.success({
      content: `${description} (${module} • ${objectName})`,
      key: messageKey,
      duration: 3,
    });

    return log;
  };

  return { logAction };
};
