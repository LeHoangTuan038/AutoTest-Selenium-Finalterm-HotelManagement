import { create } from 'zustand';

/**
 * Global store để track khi equipment data thay đổi
 * Đồng bộ cập nhật giữa WarehouseManagement và InventoryManagement
 */
export const useEquipmentEventStore = create((set) => {
  console.log('🏭 [EquipmentEventStore] Initializing global equipment event store');

  return {
    // Mỗi lần equipment thay đổi, timestamp sẽ update
    lastEquipmentUpdate: 0,
    
    // Gọi hàm này từ bất kỳ đâu khi equipment thay đổi
    triggerEquipmentUpdate: () => {
      const now = Date.now();
      console.log('🔄 [EquipmentEventStore] Trigger equipment update at:', now);
      set({ lastEquipmentUpdate: now });
    },
    
    // Get current timestamp
    getLastUpdate: () => {
      return useEquipmentEventStore.getState().lastEquipmentUpdate;
    }
  };
});