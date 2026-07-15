import React, { ReactNode } from 'react';
import Header from './Header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
