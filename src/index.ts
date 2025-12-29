export interface StoreOptions {
  keyPath?: string;
  autoIncrement?: boolean;
}

export interface IndexOptions {
  unique?: boolean;
  multiEntry?: boolean;
}

export type UpgradeCallback = (db: IDBDatabase) => void;

export type IDBKey = IDBValidKey;

class SimpleIDB {
  private db: IDBDatabase | null = null;
  private upgradeTransaction: IDBTransaction | null = null;

  async open(dbName: string, version: number, upgradeCallback?: UpgradeCallback): Promise<void> {
    if (!('indexedDB' in self)) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => {
        this.db = request.result;
        this.upgradeTransaction = null;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.upgradeTransaction = (event.target as IDBOpenDBRequest).transaction;
        upgradeCallback?.(this.db);
        this.upgradeTransaction = null;
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

  createIndex(storeName: string, indexName: string, keyPath: string, options?: IndexOptions): void {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    if (!this.db.objectStoreNames.contains(storeName)) {
      throw new Error(`Object store "${storeName}" does not exist. Create it first with createStore().`);
    }

    let objectStore: IDBObjectStore;
    
    if (this.upgradeTransaction) {
      objectStore = this.upgradeTransaction.objectStore(storeName);
    } else {
      throw new Error('createIndex must be called within the upgradeCallback during open(). Indexes can only be created during database upgrades.');
    }

    if (objectStore.indexNames.contains(indexName)) {
      return;
    }

    objectStore.createIndex(indexName, keyPath, {
      unique: options?.unique ?? false,
      multiEntry: options?.multiEntry ?? false
    });
  }

  async add<T = unknown>(storeName: string, data: T): Promise<void> {
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

  async get<T = unknown>(storeName: string, key: IDBKey): Promise<T | undefined> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(new Error(`Failed to get record: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve(request.result as T | undefined);
    });
  }

  async put<T = unknown>(storeName: string, data: T): Promise<void> {
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

  async delete(storeName: string, key: IDBKey): Promise<void> {
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

  async getAll<T = unknown>(storeName: string): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(new Error(`Failed to get all records: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  async count(storeName: string): Promise<number> {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onerror = () => reject(new Error(`Failed to count records: ${request.error?.message || 'Unknown error'}`));
      request.onsuccess = () => resolve(request.result);
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

export default SimpleIDB;

