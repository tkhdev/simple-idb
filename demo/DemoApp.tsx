import React, { useEffect, useState } from 'react';
import SimpleIDB from '../src';

type Status = { type: 'idle' | 'success' | 'error'; message: string };

const db = new SimpleIDB();

export const DemoApp: React.FC = () => {
  const [isOpened, setIsOpened] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('Jane Doe');
  const [loadedUser, setLoadedUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await db.open('simple-idb-demo', 1, () => {
          db.createStore('users', { keyPath: 'id' });
        });
        setIsOpened(true);
        setStatus({ type: 'success', message: 'Database opened (simple-idb-demo, v1)' });
      } catch (error: any) {
        setStatus({ type: 'error', message: error?.message ?? String(error) });
      }
    })();

    return () => {
      db.close();
    };
  }, []);

  const addUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      await db.add('users', { id, name: userName });
      setStatus({ type: 'success', message: `Saved user { id: "${id}", name: "${userName}" }` });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message ?? String(error) });
    }
  };

  const loadUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      const result = await db.get('users', id);
      setLoadedUser(result ?? null);
      setStatus({
        type: 'success',
        message: result ? `Loaded user with id "${id}"` : `No user found with id "${id}"`,
      });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message ?? String(error) });
    }
  };

  const updateUser = async () => {
    if (!isOpened) return;
    try {
      const id = userId.trim();
      await db.put('users', { id, name: userName });
      setStatus({ type: 'success', message: `Upserted user { id: "${id}", name: "${userName}" }` });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message ?? String(error) });
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
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message ?? String(error) });
    }
  };

  const clearUsers = async () => {
    if (!isOpened) return;
    try {
      await db.clear('users');
      setStatus({ type: 'success', message: 'Cleared all users from the store' });
      setLoadedUser(null);
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message ?? String(error) });
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
          maxWidth: 960,
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
        }}
      >
        <section style={{ gridColumn: '1 / -1' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: 8 }}>simple-idb</h1>
          <p style={{ margin: 0, color: '#9ca3af' }}>
            A minimal, promise-based IndexedDB wrapper. This page is both a demo and a living
            documentation page for v1.1.0.
          </p>
        </section>

        <section
          style={{
            background: 'rgba(15,23,42,0.9)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(148,163,184,0.3)',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Live demo</h2>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>
            We open a database named <code>simple-idb-demo</code>, create a <code>users</code>{' '}
            store with <code>keyPath: &quot;id&quot;</code>, then add and read records.
          </p>

          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
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
                }}
              >
                Add user
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
                }}
              >
                Load by ID
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
                }}
              >
                Delete by ID
              </button>
              <button
                type="button"
                onClick={clearUsers}
                disabled={!isOpened}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  color: '#e5e7eb',
                  cursor: isOpened ? 'pointer' : 'not-allowed',
                }}
              >
                Clear store
              </button>
            </div>

            {status.message && (
              <div
                style={{
                  marginTop: 8,
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

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
                Last loaded user
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
          </div>
        </section>

        <section
          style={{
            background: 'rgba(15,23,42,0.9)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(148,163,184,0.3)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>v1.1.0 API</h2>

          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>open</h3>
          <pre
            style={{
              margin: 0,
              marginBottom: 8,
              padding: 10,
              borderRadius: 8,
              background: '#020617',
              border: '1px solid #111827',
              overflowX: 'auto',
            }}
          >
{`const db = new SimpleIDB();

await db.open('my-db', 1, () => {
  db.createStore('users', { keyPath: 'id' });
});`}
          </pre>
          <p style={{ marginTop: 8, color: '#9ca3af' }}>
            <code>open</code> must be called before any other operation. The <code>upgradeCallback</code> runs
            when the database is created or upgraded and is the right place to call{' '}
            <code>createStore</code>.
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>createStore</h3>
          <pre
            style={{
              margin: 0,
              marginBottom: 8,
              padding: 10,
              borderRadius: 8,
              background: '#020617',
              border: '1px solid #111827',
              overflowX: 'auto',
            }}
          >
{`db.createStore('users', { keyPath: 'id' });
db.createStore('posts', { autoIncrement: true });`}
          </pre>
          <p style={{ marginTop: 8, color: '#9ca3af' }}>
            Safe to call multiple times; if the store already exists it&apos;s a no-op.
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>add / put / get / delete / clear</h3>
          <pre
            style={{
              margin: 0,
              marginBottom: 8,
              padding: 10,
              borderRadius: 8,
              background: '#020617',
              border: '1px solid #111827',
              overflowX: 'auto',
            }}
          >
{`await db.add('users', { id: '1', name: 'Jane' });
await db.put('users', { id: '1', name: 'Jane Doe' });
const user = await db.get('users', '1');
await db.delete('users', '1');
await db.clear('users');`}
          </pre>

          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>close</h3>
          <pre
            style={{
              margin: 0,
              padding: 10,
              borderRadius: 8,
              background: '#020617',
              border: '1px solid #111827',
              overflowX: 'auto',
            }}
          >
{`db.close();`}
          </pre>
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
            Demo (Vercel)
          </a>
          <a href="https://github.com/tkhdev/simple-idb" style={{ color: '#93c5fd' }}>
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/simple-idb" style={{ color: '#93c5fd' }}>
            npm
          </a>
        </footer>
      </div>
    </div>
  );
};


