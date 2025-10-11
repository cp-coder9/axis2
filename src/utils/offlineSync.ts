// Offline sync utilities for timer data persistence
interface OfflineData {
  [key: string]: any;
}

class OfflineSync {
  private dbName = 'ArchitexOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'key' });
        }
      };
    });
  }

  async saveOfflineData(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const request = store.put({
        key,
        data,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineData(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineData(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOfflineData(): Promise<OfflineData> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        const data: OfflineData = {};
        results.forEach(item => {
          data[item.key] = item.data;
        });
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const offlineSync = new OfflineSync();

// Mock queueForSync function for compatibility with existing code
export const queueForSync = async (type: string, action: string, data: any): Promise<boolean> => {
  try {
    const queueKey = `queue_${type}_${action}_${Date.now()}`;
    await offlineSync.saveOfflineData(queueKey, {
      type,
      action,
      data,
      queued: true,
      timestamp: Date.now()
    });
    console.log(`Queued ${type} ${action} for sync:`, queueKey);
    return true;
  } catch (error) {
    console.error('Failed to queue operation for sync:', error);
    return false;
  }
};