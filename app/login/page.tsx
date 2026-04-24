'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('sf_auth') === 'true') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password === 'speciale2026') {
      localStorage.setItem('sf_auth', 'true');
      router.push('/dashboard');
    } else {
      setError('Incorrect password');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#141414',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#C8A951',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            SPECIALE FITNESS
          </div>
          <div style={{ fontSize: '13px', color: '#888', letterSpacing: '0.1em' }}>
            LEAD GEN DASHBOARD
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '15px',
              color: '#f0f0f0',
              outline: 'none',
              marginBottom: '12px',
              display: 'block',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#C8A951';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333';
            }}
          />

          {error && (
            <div
              style={{
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '12px',
                textAlign: 'left',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              backgroundColor: password && !loading ? '#C8A951' : '#3a3318',
              color: password && !loading ? '#0a0a0a' : '#666',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: password && !loading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
              letterSpacing: '0.03em',
            }}
          >
            {loading ? 'Entering...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
