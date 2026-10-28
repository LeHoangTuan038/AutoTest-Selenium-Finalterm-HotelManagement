import { create } from 'zustand';

/**
 * Global store để track khi damage status thay đổi
 * Không phụ thuộc vào component mount/unmount
 * Giải pháp cho vấn đề: listener không hoạt động khi component không render
 */
export const useDamageEventStore = create((set) => {
  console.log('🌍 [DamageEventStore] Initializing global damage event store');

  return {
    // Mỗi lần damage status thay đổi, timestamp sẽ update
    // Components có thể subscribe vào timestamp này để react
    lastDamageUpdate: 0,
    
    // Gọi hàm này từ bất kỳ đâu khi damage status thay đổi
    triggerDamageUpdate: () => {
      const now = Date.now();
      console.log('🔥 [DamageEventStore] Trigger damage update at:', now);
      set({ lastDamageUpdate: now });
    },
    
    // Get current timestamp
    getLastUpdate: () => {
      return useDamageEventStore.getState().lastDamageUpdate;
    }
  };
});
