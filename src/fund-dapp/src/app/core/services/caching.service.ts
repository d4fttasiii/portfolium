import { Injectable } from '@angular/core';
import { CachingStorageType } from '@core/models/caching-storage';

@Injectable({
  providedIn: 'root',
})
export class CachingService {
  private store = new Map<string, any>();

  constructor() {}

  cacheData(
    key: string,
    data: any,
    storage: CachingStorageType,
    ttlMs = 5 * 60 * 1000,
  ) {
    if (storage == CachingStorageType.LocalStorage) {
      this.saveToLocalStorage(key, data, ttlMs);
      return;
    }

    if (storage === CachingStorageType.Memory) {
      this.saveToMemory(key, data, ttlMs);
      return;
    }
  }

  get<TType>(key: string): TType {
    return (this.loadFromMemory(key) ||
      this.loadFromLocalStorage(key)) as TType;
  }

  private loadFromMemory<TType>(key: string): TType {
    if (this.store.has(key)) {
      const item = this.store.get(key);
      const record = JSON.parse(item);
      const now = new Date().getTime();
      // Expired data will return null
      if (!record || (record.hasExpiration && record.expiration <= now)) {
        return null;
      } else {
        return (
          record.type === 'any' ? JSON.parse(record.value) : record.value
        ) as TType;
      }
    }

    return null;
  }

  private loadFromLocalStorage<TType>(key: string): TType {
    const item = localStorage.getItem(key);
    if (item) {
      const record = JSON.parse(item);
      const now = new Date().getTime();
      // Expired data will return null
      if (!record || (record.hasExpiration && record.expiration <= now)) {
        return null;
      } else {
        return (
          record.type === 'any' ? JSON.parse(record.value) : record.value
        ) as TType;
      }
    }

    return null;
  }

  private saveToLocalStorage(key: string, data: any, ttlMs?: number) {
    const record = {
      value: typeof data === 'string' ? data : JSON.stringify(data),
      expiration: ttlMs !== 0 ? new Date().getTime() + ttlMs : null,
      hasExpiration: ttlMs !== 0 ? true : false,
      type: typeof data === 'string' ? 'string' : 'any',
    };

    localStorage.setItem(key, JSON.stringify(record));
  }

  private saveToMemory(key: string, data: any, ttlMs?: number) {
    const record = {
      value: typeof data === 'string' ? data : JSON.stringify(data),
      expiration: ttlMs !== 0 ? new Date().getTime() + ttlMs : null,
      hasExpiration: ttlMs !== 0 ? true : false,
      type: typeof data === 'string' ? 'string' : 'any',
    };

    this.store.set(key, record);
  }

  private resetCache() {
    localStorage.clear();
    this.store = new Map<string, any>();
  }
}
