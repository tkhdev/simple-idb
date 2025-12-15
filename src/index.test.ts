import SimpleIDB from './index';

describe('SimpleIDB', () => {
  let idb: SimpleIDB;
  let mockStores: Map<string, Map<any, any>>;
  let mockObjectStoreNames: Set<string>;
  let storeOptions: Map<string, any>;

  beforeEach(() => {
    idb = new SimpleIDB();
    mockStores = new Map();
    mockObjectStoreNames = new Set();
    storeOptions = new Map();

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
          createObjectStore: jest.fn((storeName: string, options?: any) => {
            if (!mockObjectStoreNames.has(storeName)) {
              mockObjectStoreNames.add(storeName);
              mockStores.set(storeName, new Map());
              storeOptions.set(storeName, options || {});
            }
            return { name: storeName };
          }),
          transaction: jest.fn((storeNames: string[], mode: 'readonly' | 'readwrite') => {
            return {
              objectStore: jest.fn((storeName: string) => {
                const store = mockStores.get(storeName) || new Map();
                const opts = storeOptions.get(storeName) || {};
                return {
                  add: jest.fn((data: any) => {
                    const key = opts.keyPath ? data[opts.keyPath] : (data.id || Math.random());
                    store.set(key, data);
                    const req: any = { result: key, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  get: jest.fn((key: any) => {
                    const req: any = { result: store.get(key), error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  put: jest.fn((data: any) => {
                    const key = opts.keyPath ? data[opts.keyPath] : (data.id || Math.random());
                    store.set(key, data);
                    const req: any = { result: key, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  delete: jest.fn((key: any) => {
                    store.delete(key);
                    const req: any = { result: undefined, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  }),
                  clear: jest.fn(() => {
                    store.clear();
                    const req: any = { result: undefined, error: null, onsuccess: null, onerror: null };
                    Promise.resolve().then(() => req.onsuccess?.({ target: req }));
                    return req;
                  })
                };
              })
            };
          }),
          close: jest.fn()
        };
        
        const request: any = {
          result: db,
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
      const result = await idb.get('users', 1);
      expect(result).toBeDefined();
      expect(result.name).toBe('John');
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
      const result = await idb.get('users', 1);
      expect(result.name).toBe('Jane');
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
});

