import React, { useEffect, useState } from 'react';
import SimpleIDB from '../src';

type Status = { type: 'idle' | 'success' | 'error'; message: string };

const db = new SimpleIDB();

interface User {
  id: string;
  name: string;
  email?: string;
  age?: number;
}

export const DemoApp: React.FC = () => {
  const [isOpened, setIsOpened] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  
  // Form state
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('Jane Doe');
  const [userEmail, setUserEmail] = useState('jane@example.com');
  const [userAge, setUserAge] = useState('25');
  
  // Data state
  const [loadedUser, setLoadedUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await db.open('simple-idb-demo', 2, () => {
          db.createStore('users', { keyPath: 'id' });
          // Create indexes for v1.2.0 demo
          db.createIndex('users', 'email', 'email', { unique: true });
          db.createIndex('users', 'age', 'age');
        });
        setIsOpened(true);
        setStatus({ type: 'success', message: 'Database opened (simple-idb-demo, v2) with indexes' });
        await refreshData();
      } catch (error: unknown) {
        setStatus({ 
          type: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    })();

    return () => {
      db.close();
    };
  }, []);

  const refreshData = async () => {
    if (!isOpened) return;
    try {
      const count = await db.count('users');
      const all = await db.getAll<User>('users');
      setUserCount(count);
      setAllUsers(all);
    } catch (error: unknown) {
      console.error('Failed to refresh data:', error);
    }
  };

  const addUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      const user: User = {
        id,
        name: userName.trim(),
        email: userEmail.trim() || undefined,
        age: userAge.trim() ? parseInt(userAge.trim(), 10) : undefined,
      };
      await db.add('users', user);
      setStatus({ type: 'success', message: `Added user: ${JSON.stringify(user)}` });
      await refreshData();
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const loadUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      const result = await db.get<User>('users', id);
      setLoadedUser(result ?? null);
      setStatus({
        type: 'success',
        message: result ? `Loaded user with id "${id}"` : `No user found with id "${id}"`,
      });
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const updateUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      const user: User = {
        id,
        name: userName.trim(),
        email: userEmail.trim() || undefined,
        age: userAge.trim() ? parseInt(userAge.trim(), 10) : undefined,
      };
      await db.put('users', user);
      setStatus({ type: 'success', message: `Upserted user: ${JSON.stringify(user)}` });
      await refreshData();
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const deleteUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      await db.delete('users', id);
      setStatus({ type: 'success', message: `Deleted user with id "${id}"` });
      if (loadedUser && loadedUser.id === id) {
        setLoadedUser(null);
      }
      await refreshData();
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const clearUsers = async () => {
    if (!isOpened) return;
    try {
      await db.clear('users');
      setStatus({ type: 'success', message: 'Cleared all users from the store' });
      setLoadedUser(null);
      await refreshData();
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const loadAllUsers = async () => {
    if (!isOpened) return;
    try {
      const all = await db.getAll<User>('users');
      setAllUsers(all);
      setStatus({ type: 'success', message: `Loaded ${all.length} user(s) from the store` });
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const getCount = async () => {
    if (!isOpened) return;
    try {
      const count = await db.count('users');
      setUserCount(count);
      setStatus({ type: 'success', message: `Store contains ${count} user(s)` });
    } catch (error: unknown) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'radial-gradient(circle at top, #0f172a, #020617)',
        color: '#e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {/* Header */}
        <section style={{ gridColumn: '1 / -1' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: 8 }}>simple-idb</h1>
          <p style={{ margin: 0, color: '#9ca3af' }}>
            A minimal, promise-based IndexedDB wrapper.
          </p>
        </section>

        {/* Live Demo Section */}
        <section
          style={{
            background: 'rgba(15,23,42,0.9)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(148,163,184,0.3)',
            gridColumn: 'span 2',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: 16 }}>Live Demo</h2>

          {/* Form */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 14 }}>
              User ID
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </label>

            <label style={{ fontSize: 14 }}>
              User name
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </label>

            <label style={{ fontSize: 14 }}>
              Email (indexed, unique)
              <input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </label>

            <label style={{ fontSize: 14 }}>
              Age (indexed)
              <input
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={addUser}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#22c55e',
                color: '#022c22',
                fontWeight: 600,
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={loadUser}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                background: 'transparent',
                color: '#e5e7eb',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Get by ID
            </button>
            <button
              type="button"
              onClick={updateUser}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                background: 'transparent',
                color: '#e5e7eb',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Put (upsert)
            </button>
            <button
              type="button"
              onClick={deleteUser}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #4b5563',
                background: 'transparent',
                color: '#e5e7eb',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={loadAllUsers}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #6366f1',
                background: 'rgba(99,102,241,0.1)',
                color: '#a5b4fc',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              GetAll (v1.2.0)
            </button>
            <button
              type="button"
              onClick={getCount}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #6366f1',
                background: 'rgba(99,102,241,0.1)',
                color: '#a5b4fc',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Count (v1.2.0)
            </button>
            <button
              type="button"
              onClick={clearUsers}
              disabled={!isOpened}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #ef4444',
                background: 'rgba(239,68,68,0.1)',
                color: '#fca5a5',
                cursor: isOpened ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Clear
            </button>
          </div>

          {/* Status */}
          {status.message && (
            <div
              style={{
                marginBottom: 16,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                background:
                  status.type === 'error'
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(34,197,94,0.1)',
                border:
                  status.type === 'error'
                    ? '1px solid rgba(248,113,113,0.6)'
                    : '1px solid rgba(74,222,128,0.5)',
              }}
            >
              {status.message}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#020617', border: '1px solid #111827' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Total Users</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>
                {userCount !== null ? userCount : '—'}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#020617', border: '1px solid #111827' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Loaded User</div>
              <div style={{ fontSize: 12, color: loadedUser ? '#e5e7eb' : '#6b7280' }}>
                {loadedUser ? loadedUser.name : 'None'}
              </div>
            </div>
          </div>

          {/* Loaded User */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
              Last loaded user (get by ID)
            </div>
            <pre
              style={{
                margin: 0,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(loadedUser, null, 2)}
            </pre>
          </div>

          {/* All Users */}
          <div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
              All users (getAll - v1.2.0)
            </div>
            <pre
              style={{
                margin: 0,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                fontSize: 12,
                overflowX: 'auto',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(allUsers, null, 2)}
            </pre>
          </div>
        </section>

        {/* API Documentation */}
        <section
          style={{
            background: 'rgba(15,23,42,0.9)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(148,163,184,0.3)',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: 16 }}>v1.2.0 API</h2>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>open</h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`await db.open('my-db', 1, () => {
  db.createStore('users', { keyPath: 'id' });
});`}
            </pre>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              Opens database. The <code>upgradeCallback</code> runs when the database is created or upgraded.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>createStore</h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`db.createStore('users', { keyPath: 'id' });
db.createStore('posts', { autoIncrement: true });`}
            </pre>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              Creates an object store. Must be called within the upgrade callback.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>
              createIndex <span style={{ color: '#6366f1' }}>NEW in v1.2.0</span>
            </h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`await db.open('my-db', 2, () => {
  db.createStore('users', { keyPath: 'id' });
  db.createIndex('users', 'email', 'email', { unique: true });
  db.createIndex('users', 'age', 'age');
});`}
            </pre>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              Creates an index on a store. Must be called within the upgrade callback. Options: <code>unique</code>, <code>multiEntry</code>.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>CRUD Operations</h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`await db.add('users', { id: '1', name: 'Jane' });
await db.put('users', { id: '1', name: 'Jane Doe' });
const user = await db.get('users', '1');
await db.delete('users', '1');
await db.clear('users');`}
            </pre>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>
              getAll <span style={{ color: '#6366f1' }}>NEW in v1.2.0</span>
            </h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`const allUsers = await db.getAll('users');
// Returns: [{ id: '1', name: 'Jane' }, ...]`}
            </pre>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              Retrieves all records from a store. Returns an empty array if the store is empty.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>
              count <span style={{ color: '#6366f1' }}>NEW in v1.2.0</span>
            </h3>
            <pre
              style={{
                margin: 0,
                marginBottom: 8,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`const count = await db.count('users');
// Returns: 5`}
            </pre>
            <p style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
              Returns the number of records in a store.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#e5e7eb' }}>close</h3>
            <pre
              style={{
                margin: 0,
                padding: 10,
                borderRadius: 8,
                background: '#020617',
                border: '1px solid #111827',
                overflowX: 'auto',
                fontSize: 11,
              }}
            >
{`db.close();`}
            </pre>
          </div>
        </section>

        {/* Version Info */}
        <section
          style={{
            background: 'rgba(15,23,42,0.9)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(148,163,184,0.3)',
            gridColumn: '1 / -1',
            fontSize: 13,
          }}
        >
          <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: 12 }}>Version History</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <strong style={{ color: '#6366f1' }}>v1.2.0</strong> (Current) - Basic Querying
              <ul style={{ margin: '4px 0 0 20px', color: '#9ca3af', fontSize: 12 }}>
                <li><code>getAll(storeName)</code> - Retrieve all records</li>
                <li><code>count(storeName)</code> - Get record count</li>
                <li><code>createIndex(storeName, indexName, keyPath, options)</code> - Create indexes</li>
              </ul>
            </div>
            <div>
              <strong>v1.1.0</strong> - Enhanced CRUD
              <ul style={{ margin: '4px 0 0 20px', color: '#9ca3af', fontSize: 12 }}>
                <li><code>put(storeName, data)</code> - Upsert records</li>
                <li><code>delete(storeName, key)</code> - Delete by key</li>
                <li><code>clear(storeName)</code> - Clear all records</li>
              </ul>
            </div>
            <div>
              <strong>v1.0.0</strong> - MVP
              <ul style={{ margin: '4px 0 0 20px', color: '#9ca3af', fontSize: 12 }}>
                <li><code>open(dbName, version, upgradeCallback)</code></li>
                <li><code>createStore(storeName, options)</code></li>
                <li><code>add(storeName, data)</code></li>
                <li><code>get(storeName, key)</code></li>
                <li><code>close()</code></li>
              </ul>
            </div>
          </div>
        </section>

        <footer
          style={{
            gridColumn: '1 / -1',
            marginTop: 8,
            fontSize: 12,
            color: '#6b7280',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'flex-start',
          }}
        >
          <span>Links:</span>
          <a href="https://simple-idb.vercel.app" style={{ color: '#93c5fd' }}>
            Demo
          </a>
          <a href="https://github.com/tkhdev/simple-idb" style={{ color: '#93c5fd' }}>
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/@tkhdev/simple-idb" style={{ color: '#93c5fd' }}>
            npm
          </a>
        </footer>
      </div>
    </div>
  );
};
