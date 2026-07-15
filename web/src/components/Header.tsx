import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * C-UI-001: 各画面にヘッダー、検索導線、ログイン状態表示、カート導線を表示する
 */
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logo}>
        🎬 映画館ECサイト
      </Link>

      <nav style={styles.nav}>
        <Link to="/movies" style={styles.link}>映画検索</Link>
        <Link to="/products" style={styles.link}>商品一覧</Link>
      </nav>

      <div style={styles.auth}>
        {user ? (
          <>
            <Link to="/cart" style={styles.link}>🛒 カート</Link>
            <Link to="/history" style={styles.link}>購入履歴</Link>
            <span style={styles.userName}>{user.name}</span>
            <button onClick={handleLogout} style={styles.btn}>ログアウト</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>ログイン</Link>
            <Link to="/register" style={{ ...styles.link, ...styles.btnPrimary }}>会員登録</Link>
          </>
        )}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#1a1a2e',
    color: '#fff',
    gap: 24,
  },
  logo: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: 20,
    marginRight: 'auto',
  },
  nav: { display: 'flex', gap: 16 },
  auth: { display: 'flex', alignItems: 'center', gap: 12 },
  link: { color: '#ccc', textDecoration: 'none' },
  userName: { color: '#e94560', fontWeight: 'bold' },
  btn: {
    background: 'transparent',
    border: '1px solid #ccc',
    color: '#ccc',
    padding: '4px 12px',
    cursor: 'pointer',
    borderRadius: 4,
  },
  btnPrimary: {
    background: '#e94560',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: 4,
  },
};
