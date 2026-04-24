'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('sf_auth');
      if (auth !== 'true') {
        router.replace('/login');
      } else {
        setChecked(true);
      }
    }
  }, [router]);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#888', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
