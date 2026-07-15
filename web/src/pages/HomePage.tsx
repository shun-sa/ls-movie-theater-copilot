import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

/** ホームページ (NFR-USAB-001: トップ画面から主要機能へ遷移可能) */
export default function HomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>映画館ECサイト</h1>
        <p style={styles.heroSub}>映画作品の閲覧から商品購入・チケット購入まで一貫して</p>
      </div>

      <div style={styles.cards}>
        <Link to="/movies" style={styles.card}>
          <h2>🎬 映画作品を探す</h2>
          <p>上映中・公開予定の映画を検索できます</p>
        </Link>

        <Link to="/products" style={styles.card}>
          <h2>🛍️ 商品一覧</h2>
          <p>映画関連グッズ・商品を購入できます</p>
        </Link>

        {user ? (
          <>
            <Link to="/cart" style={styles.card}>
              <h2>🛒 カート</h2>
              <p>カートの中身を確認できます</p>
            </Link>
            <Link to="/history" style={styles.card}>
              <h2>📋 購入履歴</h2>
              <p>過去の注文・チケット購入を確認できます</p>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.card}>
              <h2>🔑 ログイン</h2>
              <p>会員ログインして商品・チケット購入へ</p>
            </Link>
            <Link to="/register" style={{ ...styles.card, ...styles.cardPrimary }}>
              <h2>✨ 会員登録</h2>
              <p>無料で会員登録してすべての機能を利用</p>
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { textAlign: 'center', padding: '48px 16px', background: '#1a1a2e', borderRadius: 12, color: '#fff', marginBottom: 32 },
  heroTitle: { margin: '0 0 12px', fontSize: 36, color: '#e94560' },
  heroSub: { color: '#ccc', fontSize: 18, margin: 0 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card: {
    background: '#fff',
    padding: 28,
    borderRadius: 12,
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 2px 8px rgba(0,0,0,.1)',
    transition: 'transform .1s',
  },
  cardPrimary: { background: '#e94560', color: '#fff' },
};
