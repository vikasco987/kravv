import AsyncStorage from '@react-native-async-storage/async-storage';

let isSyncing = false;
let lastSyncAttempt = 0;

export const SyncManager = {
  syncPendingBills: async (token: string | null) => {
    if (!token || isSyncing) return;
    
    const now = Date.now();
    if (now - lastSyncAttempt < 60000) return; // Only try once per minute
    
    isSyncing = true;
    lastSyncAttempt = now;

    try {
      const queueStr = await AsyncStorage.getItem('@pending_bills');
      if (!queueStr) {
        isSyncing = false;
        return;
      }

      const queue = JSON.parse(queueStr);
      if (queue.length === 0) {
        isSyncing = false;
        return;
      }

      console.log(`[SyncManager] Found ${queue.length} bills in queue. Attempting background sync...`);
      const remainingQueue = [];

      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(item.body),
          });

          if (!res.ok) {
            remainingQueue.push(item);
          }
        } catch (error) {
          remainingQueue.push(item);
        }
      }

      await AsyncStorage.setItem('@pending_bills', JSON.stringify(remainingQueue));
      const syncedCount = queue.length - remainingQueue.length;
      if (syncedCount > 0) {
        console.log(`[SyncManager] Successfully synced ${syncedCount} bills! (${remainingQueue.length} remaining)`);
      }
    } catch (e) {
      // Very silent error
    } finally {
      isSyncing = false;
    }
  }
};
