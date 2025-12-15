export interface StoreOptions {
  keyPath?: string;
  autoIncrement?: boolean;
}

export type UpgradeCallback = (db: IDBDatabase) => void;

class SimpleIDB {
  private db: IDBDatabase | null = null;

  async open(dbName: string, version: number, upgradeCallback?: UpgradeCallback): Promise<void> {
    if (!('indexedDB' in self)) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        upgradeCallback?.(this.db);
      };
    });
  }

  createStore(storeName: string, options?: StoreOptions): void {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    if (this.db.objectStoreNames.contains(storeName)) {
      return;
    }
    this.db.createObjectStore(storeName, {
      keyPath: options?.keyPath,
      autoIncrement: options?.autoIncrement ?? false
    });
  }

  async add(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onerror = () => reject(new Error(`Failed to add record: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve();
    });
  }

  async get(storeName: string, key: any): Promise<any> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(new Error(`Failed to get record: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(new Error(`Failed to put record: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(new Error(`Failed to delete record: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve();
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

export default SimpleIDB;

