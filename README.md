# simple-idb

[![npm version](https://img.shields.io/npm/v/%40tkhdev%2Fsimple-idb.svg)](https://www.npmjs.com/package/@tkhdev/simple-idb)
[![npm downloads](https://img.shields.io/npm/dm/%40tkhdev%2Fsimple-idb.svg)](https://www.npmjs.com/package/@tkhdev/simple-idb)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40tkhdev%2Fsimple-idb?label=bundle%20size)](https://bundlephobia.com/package/@tkhdev/simple-idb)
[![license](https://img.shields.io/npm/l/%40tkhdev%2Fsimple-idb.svg)](https://github.com/tkhdev/simple-idb/blob/main/LICENSE)

A lightweight, promise-based wrapper for IndexedDB. Minimal, bulletproof, and easy to use.

## Installation

```bash
npm install @tkhdev/simple-idb
```

## Usage

```javascript
import SimpleIDB from '@tkhdev/simple-idb';

const db = new SimpleIDB();

// Open database and create stores during upgrade
await db.open('my-database', 2, () => {
  db.createStore('users', { keyPath: 'id' });
  db.createStore('posts', { autoIncrement: true });
  // Create indexes (v1.2.0)
  db.createIndex('users', 'email', 'email', { unique: true });
});

// Add a record
await db.add('users', { id: '1', name: 'John Doe', email: 'john@example.com' });

// Get a record
const user = await db.get('users', '1');
console.log(user);

// Get all records (v1.2.0)
const allUsers = await db.getAll('users');

// Count records (v1.2.0)
const count = await db.count('users');

// Close database
db.close();
```

## API Reference

### `open(dbName: string, version: number, upgradeCallback?: Function): Promise<void>`

Opens or creates a database. The `upgradeCallback` is called when the database version changes, allowing you to create or modify object stores.

```javascript
const db = new SimpleIDB();

await db.open('my-db', 1, () => {
  db.createStore('items');
});
```

### `createStore(storeName: string, options?: StoreOptions): void`

Creates an object store. Must be called within the `upgradeCallback` during `open()`.

**Options:**
- `keyPath?: string` - The key path for the store
- `autoIncrement?: boolean` - Whether to auto-increment keys (default: `false`)

```javascript
db.createStore('users', { keyPath: 'id' });       // with keyPath
db.createStore('posts', { autoIncrement: true }); // with autoIncrement
db.createStore('items');                          // without options
```

### `add(storeName: string, data: any): Promise<void>`

Adds a record to the specified store. Returns a promise that resolves when the record is added.

```javascript
await db.add('users', { id: 1, name: 'John' });
```

### `put(storeName: string, data: any): Promise<void>`

Inserts or updates a record in the specified store (upsert semantics).

```javascript
await db.put('users', { id: 1, name: 'John Doe' });
```

### `delete(storeName: string, key: any): Promise<void>`

Deletes a record by key from the specified store.

```javascript
await db.delete('users', 1);
```

### `clear(storeName: string): Promise<void>`

Clears all records in the specified store.

```javascript
await db.clear('users');
```

### `get(storeName: string, key: any): Promise<any>`

Retrieves a record by key from the specified store. Returns `undefined` if the key doesn't exist.

```javascript
const user = await db.get('users', 1);
```

### `getAll(storeName: string): Promise<any[]>` *(v1.2.0)*

Retrieves all records from the specified store. Returns an empty array if the store is empty.

```javascript
const allUsers = await db.getAll('users');
// Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }, ...]
```

### `count(storeName: string): Promise<number>` *(v1.2.0)*

Returns the number of records in the specified store.

```javascript
const count = await db.count('users');
// Returns: 5
```

### `createIndex(storeName: string, indexName: string, keyPath: string, options?: IndexOptions): void` *(v1.2.0)*

Creates an index on an object store. Must be called within the `upgradeCallback` during `open()`. Indexes can only be created during database upgrades.

**Options:**
- `unique?: boolean` - Whether the index should enforce uniqueness (default: `false`)
- `multiEntry?: boolean` - Whether the index should support multiple entries per key (default: `false`)

```javascript
await db.open('my-db', 2, () => {
  db.createStore('users', { keyPath: 'id' });
  // Create a unique index on email
  db.createIndex('users', 'email', 'email', { unique: true });
  // Create a regular index on age
  db.createIndex('users', 'age', 'age');
});
```

**Note:** Indexes can only be created during database upgrades. If you need to add an index to an existing database, increment the version number when calling `open()`.

## Demo & documentation

This repo includes a small React demo + documentation page built with Vite. It runs entirely in the browser and uses the same library code you install from npm.

- Live demo: https://simple-idb.vercel.app
- GitHub: https://github.com/tkhdev/simple-idb
- npm: https://www.npmjs.com/package/@tkhdev/simple-idb

### Run the demo locally

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:xxxx` URL in your browser. The page:

- Opens a demo database (`simple-idb-demo`)
- Creates a `users` store with `keyPath: "id"` and indexes on `email` and `age`
- Demonstrates all CRUD operations and v1.2.0 querying features (`getAll`, `count`)
- Shows live examples of all API methods

### `close(): void`

Closes the database connection.

```javascript
db.close();
```

## Browser support

simple-idb targets modern evergreen browsers with IndexedDB support:

- Chrome 79+
- Firefox 68+
- Safari 13+ (macOS and iOS)
- Edge 79+ (Chromium-based)

IndexedDB is not available in Node.js without additional polyfills; this library is intended for browser environments.

## Requirements

- ES2019+ runtime
- Modern browser with IndexedDB enabled

## Contributing

Contributions are welcome!

- Fork the repo: https://github.com/tkhdev/simple-idb
- Create a feature branch: `git checkout -b feature/my-change`
- Install dependencies and run tests:
  - `npm install`
  - `npm test`
- If you touch the demo, ensure `npm run build:demo` succeeds.
- Open a pull request with a clear description of the change and any relevant discussion.

By contributing, you agree that your contributions will be licensed under the MIT license.

## License

MIT




