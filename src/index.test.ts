import SimpleIDB, { IDBKey, IndexOptions, StoreOptions } from './index';

interface MockIndexInfo {
  keyPath: string;
  unique?: boolean;
  multiEntry?: boolean;
}

interface MockStoreOptions {
  keyPath?: string;
  autoIncrement?: boolean;
}

interface MockRequest {
  result: unknown;
  error: Error | null;
  onsuccess: ((event: { target: MockRequest }) => void) | null;
  onerror: ((event: { target: MockRequest }) => void) | null;
}

interface MockObjectStore {
  add: jest.Mock;
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  clear: jest.Mock;
  getAll: jest.Mock;
  count: jest.Mock;
}

interface MockUpgradeTransaction {
  objectStore: jest.Mock;
}

describe('SimpleIDB', () => {
  let idb: SimpleIDB;
  let mockStores: Map<string, Map<IDBKey, unknown>>;
  let mockObjectStoreNames: Set<string>;
  let storeOptions: Map<string, MockStoreOptions>;
  let mockIndexes: Map<string, Map<string, MockIndexInfo>>;
  let mockUpgradeTransaction: MockUpgradeTransaction;

  beforeEach(() => {
    idb = new SimpleIDB();
    mockStores = new Map();
    mockObjectStoreNames = new Set();
    storeOptions = new Map();
    mockIndexes = new Map();

    // Create mock upgrade transaction
    mockUpgradeTransaction = {
      objectStore: jest.fn((storeName: string) => {
        const store = mockStores.get(storeName) || new Map();
        if (!mockIndexes.has(storeName)) {
          mockIndexes.set(storeName, new Map());
        }
        const indexes = mockIndexes.get(storeName)!;
        return {
          indexNames: {
            contains: (indexName: string) => indexes.has(indexName)
          },
          createIndex: jest.fn((indexName: string, keyPath: string, options?: IndexOptions) => {
            if (!indexes.has(indexName)) {
              indexes.set(indexName, { keyPath, ...options });
            }
            return { name: indexName };
          })
        };
      })
    };

    (global as any).indexedDB = {
      open: (name: string, version?: number) => {
        const db: any = {
          name,
          version: version || 1,
          objectStoreNames: {
            contains: (storeName: string) => mockObjectStoreNames.has(storeName),
            length: mockObjectStoreNames.size,
            item: (index: number) => Array.from(mockObjectStoreNames)[index],
            [Symbol.iterator]: function* () {
              for (const name of mockObjectStoreNames) yield name;
            }
          },
          createObjectStore: jest.fn((storeName: string, options?: StoreOptions) => {
            if (!mockObjectStoreNames.has(storeName)) {
              mockObjectStoreNames.add(storeName);
              mockStores.set(storeName, new Map());
              storeOptions.set(storeName, (options || {}) as MockStoreOptions);
            }
            return { name: storeName };
          }),
          transaction: jest.fn((storeNames: string[], mode: 'readonly' | 'readwrite') => {
            return {
              objectStore: jest.fn((storeName: string) => {
                const store = mockStores.get(storeName) || new Map();
                const opts = storeOptions.get(storeName) || {};
                return {
                  add: jest.fn((data: unknown) => {
                    const key: IDBKey = opts.keyPath && typeof data === 'object' && data !== null
                      ? (data as Record<string, IDBKey>)[opts.keyPath]
                      : (typeof data === 'object' && data !== null && 'id' in data
                          ? (data as { id: IDBKey }).id
                          : Math.random());
                    store.set(key, data);
                    const req: MockRequest = { result: key, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  get: jest.fn((key: IDBKey) => {
                    const req: MockRequest = { result: store.get(key), error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  put: jest.fn((data: unknown) => {
                    const key: IDBKey = opts.keyPath && typeof data === 'object' && data !== null
                      ? (data as Record<string, IDBKey>)[opts.keyPath]
                      : (typeof data === 'object' && data !== null && 'id' in data
                          ? (data as { id: IDBKey }).id
                          : Math.random());
                    store.set(key, data);
                    const req: MockRequest = { result: key, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  delete: jest.fn((key: IDBKey) => {
                    store.delete(key);
                    const req: MockRequest = { result: undefined, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  clear: jest.fn(() => {
                    store.clear();
                    const req: MockRequest = { result: undefined, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  getAll: jest.fn(() => {
                    const req: MockRequest = { result: Array.from(store.values()), error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  count: jest.fn(() => {
                    const req: MockRequest = { result: store.size, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  })
                };
              })
            };
          }),
          close: jest.fn()
        };
        
        interface MockOpenRequest {
          result: typeof db;
          transaction: MockUpgradeTransaction | null;
          error: Error | null;
          onsuccess: ((event: { target: MockOpenRequest }) => void) | null;
          onerror: ((event: { target: MockOpenRequest }) => void) | null;
          onupgradeneeded: ((event: { target: MockOpenRequest }) => void) | null;
        }

        const request: MockOpenRequest = {
          result: db,
          transaction: mockUpgradeTransaction,
          error: null,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null
        };
        
        // Call onupgradeneeded after handler is set (version > 1 or first time)
        const isFirstTime = !mockObjectStoreNames.size;
        if ((version && version > 1) || isFirstTime) {
          Promise.resolve().then(() => {
            if (request.onupgradeneeded) {
              request.onupgradeneeded({ target: request });
            }
          });
        }
        
        // Call onsuccess asynchronously
        Promise.resolve().then(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: request });
          }
        });
        
        return request;
      }
    };
  });

  afterEach(() => {
    idb.close();
    mockStores.clear();
    mockObjectStoreNames.clear();
    storeOptions.clear();
    mockIndexes.clear();
  });

  describe('open', () => {
    it('should open a database successfully', async () => {
      await expect(idb.open('test-db', 1)).resolves.not.toThrow();
    });

    it('should handle upgrade callback', async () => {
      const upgradeCallback = jest.fn();
      await idb.open('test-db', 2, upgradeCallback);
      expect(upgradeCallback).toHaveBeenCalled();
    });

    it('should reject if IndexedDB is not available', async () => {
      delete (global as any).indexedDB;
      await expect(idb.open('test-db', 1)).rejects.toThrow('IndexedDB is not supported');
      (global as any).indexedDB = { open: jest.fn() };
    });
  });

  describe('createStore', () => {
    it('should create a store with default options', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users');
      });
      expect(mockObjectStoreNames.has('users')).toBe(true);
    });

    it('should create a store with keyPath', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      expect(mockObjectStoreNames.has('users')).toBe(true);
    });

    it('should create a store with autoIncrement', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { autoIncrement: true });
      });
      expect(mockObjectStoreNames.has('users')).toBe(true);
    });

    it('should throw if database is not open', () => {
      expect(() => idb.createStore('users')).toThrow('Database not open');
    });
  });

  describe('add', () => {
    it('should add a record successfully', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await expect(idb.add('users', { id: 1, name: 'John' })).resolves.not.toThrow();
    });

    it('should throw if database is not open', async () => {
      await expect(idb.add('users', { id: 1 })).rejects.toThrow('Database not open');
    });
  });

  describe('get', () => {
    it('should get a record successfully', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      const result = await idb.get<{ id: number; name: string }>('users', 1);
      expect(result).toBeDefined();
      expect(result?.name).toBe('John');
    });

    it('should throw if database is not open', async () => {
      await expect(idb.get('users', 1)).rejects.toThrow('Database not open');
    });
  });

  describe('put', () => {
    it('should insert or update a record', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      await expect(idb.put('users', { id: 1, name: 'Jane' })).resolves.not.toThrow();
      const result = await idb.get<{ id: number; name: string }>('users', 1);
      expect(result?.name).toBe('Jane');
    });

    it('should throw if database is not open', async () => {
      await expect(idb.put('users', { id: 1 })).rejects.toThrow('Database not open');
    });
  });

  describe('delete', () => {
    it('should delete a record by key', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      await expect(idb.delete('users', 1)).resolves.not.toThrow();
      const result = await idb.get('users', 1);
      expect(result).toBeUndefined();
    });

    it('should throw if database is not open', async () => {
      await expect(idb.delete('users', 1)).rejects.toThrow('Database not open');
    });
  });

  describe('clear', () => {
    it('should clear all records in a store', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      await idb.add('users', { id: 2, name: 'Jane' });
      await expect(idb.clear('users')).resolves.not.toThrow();
      const a = await idb.get('users', 1);
      const b = await idb.get('users', 2);
      expect(a).toBeUndefined();
      expect(b).toBeUndefined();
    });

    it('should throw if database is not open', async () => {
      await expect(idb.clear('users')).rejects.toThrow('Database not open');
    });
  });

  describe('close', () => {
    it('should close the database', async () => {
      await idb.open('test-db', 1);
      expect(() => idb.close()).not.toThrow();
    });

    it('should handle close when database is not open', () => {
      expect(() => idb.close()).not.toThrow();
    });
  });

  describe('getAll', () => {
    it('should get all records from a store', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      await idb.add('users', { id: 2, name: 'Jane' });
      const allUsers = await idb.getAll('users');
      expect(allUsers).toHaveLength(2);
      expect(allUsers).toContainEqual({ id: 1, name: 'John' });
      expect(allUsers).toContainEqual({ id: 2, name: 'Jane' });
    });

    it('should return empty array for empty store', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      const allUsers = await idb.getAll('users');
      expect(allUsers).toEqual([]);
    });

    it('should throw if database is not open', async () => {
      await expect(idb.getAll('users')).rejects.toThrow('Database not open');
    });
  });

  describe('count', () => {
    it('should return the count of records in a store', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      await idb.add('users', { id: 1, name: 'John' });
      await idb.add('users', { id: 2, name: 'Jane' });
      const count = await idb.count('users');
      expect(count).toBe(2);
    });

    it('should return 0 for empty store', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      const count = await idb.count('users');
      expect(count).toBe(0);
    });

    it('should throw if database is not open', async () => {
      await expect(idb.count('users')).rejects.toThrow('Database not open');
    });
  });

  describe('createIndex', () => {
    it('should create an index during upgrade', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
        idb.createIndex('users', 'email', 'email');
      });
      expect(mockIndexes.get('users')?.has('email')).toBe(true);
    });

    it('should create an index with unique option', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
        idb.createIndex('users', 'email', 'email', { unique: true });
      });
      const index = mockIndexes.get('users')?.get('email');
      expect(index?.unique).toBe(true);
    });

    it('should create an index with multiEntry option', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
        idb.createIndex('users', 'tags', 'tags', { multiEntry: true });
      });
      const index = mockIndexes.get('users')?.get('tags');
      expect(index?.multiEntry).toBe(true);
    });

    it('should not create duplicate index', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
        idb.createIndex('users', 'email', 'email');
        idb.createIndex('users', 'email', 'email'); // Should be no-op
      });
      expect(mockIndexes.get('users')?.has('email')).toBe(true);
    });

    it('should throw if database is not open', () => {
      expect(() => idb.createIndex('users', 'email', 'email')).toThrow('Database not open');
    });

    it('should throw if store does not exist', async () => {
      await idb.open('test-db', 1, () => {
        expect(() => idb.createIndex('nonexistent', 'email', 'email')).toThrow('Object store "nonexistent" does not exist');
      });
    });

    it('should throw if called outside upgrade callback', async () => {
      await idb.open('test-db', 1, () => {
        idb.createStore('users', { keyPath: 'id' });
      });
      expect(() => idb.createIndex('users', 'email', 'email')).toThrow('createIndex must be called within the upgradeCallback');
    });
  });
});

