export interface OfflineSyncQueueItem {
  id: string;
  action: 'UPDATE_LESSON_PROGRESS' | 'SUBMIT_PRACTICE_ATTEMPT' | 'SAVE_STUDY_TASK';
  payload: Record<string, any>;
  timestamp: number;
}

export interface OfflineRepositoryContract<T> {
  getCachedData(key: string): Promise<T | null>;
  saveCachedData(key: string, data: T): Promise<void>;
  enqueueOfflineSync(item: OfflineSyncQueueItem): Promise<void>;
  getPendingSyncQueue(): Promise<OfflineSyncQueueItem[]>;
}

export class OfflineStorageManager {
  private cacheMap = new Map<string, any>();
  private syncQueue: OfflineSyncQueueItem[] = [];

  public async getCached<T>(key: string): Promise<T | null> {
    return (this.cacheMap.get(key) as T) || null;
  }

  public async saveCached<T>(key: string, data: T): Promise<void> {
    this.cacheMap.set(key, data);
  }

  public async enqueueSync(action: OfflineSyncQueueItem['action'], payload: Record<string, any>): Promise<void> {
    this.syncQueue.push({
      id: `sync-${Date.now()}-${Math.random()}`,
      action,
      payload,
      timestamp: Date.now(),
    });
  }

  public async getPendingQueue(): Promise<OfflineSyncQueueItem[]> {
    return [...this.syncQueue];
  }

  public async clearSyncItem(id: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter((item) => item.id !== id);
  }
}

export const offlineStorageManager = new OfflineStorageManager();
