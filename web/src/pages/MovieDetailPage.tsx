import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieApi, cartApi, Movie, Product, Screening } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

/** FR-004: 映画作品詳細閲覧ページ */
export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<(Movie & { products: Product[]; screenings: Screening[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    movieApi.findById(id).then((res) => {
      setMovie(res.data);
      setLoading(false);
    });
  }, [id]);

  const addToCart = async (productId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await cartApi.addItem({ productId, quantity: 1 });
      setCartMsg('カートに追加しました');
      setTimeout(() => setCartMsg(''), 3000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCartMsg(e.message ?? 'エラーが発生しました');
    }
  };

  if (loading) return <Layout><p>読み込み中...</p></Layout>;
  if (!movie) return <Layout><p>映画が見つかりませんでした。</p></Layout>;

  const now = new Date();

  return (
    <Layout>
      <Link to="/movies" style={{ color: '#666', textDecoration: 'none' }}>← 一覧に戻る</Link>

      <div style={styles.hero}>
        <h1 style={styles.title}>{movie.title}</h1>
        <div style={styles.meta}>
          <span style={styles.badge}>{movie.genre}</span>
          <span>公開日: {new Date(movie.releaseDate).toLocaleDateString('ja-JP')}</span>
          <span>上映時間: {movie.runtimeMinutes}分</span>
        </div>
        <p style={styles.synopsis}>{movie.synopsis}</p>
      </div>

      {cartMsg && <div style={styles.cartMsg}>{cartMsg}</div>}

      {/* 関連商品 (FR-004: 商品詳細遷移、会員はカート追加へ進める) */}
      {movie.products.length > 0 && (
        <section>
          <h2>関連商品</h2>
          <div style={styles.productGrid}>
            {movie.products.map((p) => {
              const isAvailable =
                p.stock > 0 &&
                (!p.salesStartAt || new Date(p.salesStartAt) <= now) &&
                (!p.salesEndAt || new Date(p.salesEndAt) >= now);
              return (
                <div key={p.id} style={styles.productCard}>
                  <Link to={`/products/${p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <h4>{p.name}</h4>
                  </Link>
                  {/* C-UI-004: 金額は税込・3桁区切り円表記 */}
                  <p style={styles.price}>¥{p.priceTaxIncluded.toLocaleString()}<small>（税込）</small></p>
                  {/* C-DATA-003: 在庫0は「在庫なし」表示 */}
                  {p.stock === 0 ? (
                    <span style={styles.outOfStock}>在庫なし</span>
                  ) : !isAvailable ? (
                    <span style={styles.unavailable}>販売期間外</span>
                  ) : (
                    <button onClick={() => addToCart(p.id)} style={styles.cartBtn}>
                      {user ? 'カートに追加' : 'ログインして購入'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 上映スケジュール (FR-004: 上映終了回は購入導線を表示しない) */}
      {movie.screenings.length > 0 && (
        <section>
          <h2>上映スケジュール</h2>
          <div style={styles.screeningList}>
            {movie.screenings.map((s) => {
              const startsAt = new Date(s.startsAt);
              const isSaleAvailable =
                s.seatsRemaining > 0 &&
                startsAt > now &&
                (!s.salesEndAt || new Date(s.salesEndAt) >= now);

              return (
                <div key={s.id} style={styles.screeningCard}>
                  {/* C-UI-005: 日時は YYYY/MM/DD HH:mm 形式 */}
                  <p style={{ fontWeight: 'bold' }}>
                    {startsAt.toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p>{s.theaterName} {s.screenName} / 残席 {s.seatsRemaining}</p>
                  {isSaleAvailable && user ? (
                    <Link to={`/tickets/new?screeningId=${s.id}`} style={styles.ticketBtn}>
                      チケット購入
                    </Link>
                  ) : !user && isSaleAvailable ? (
                    <Link to="/login" style={styles.ticketBtn}>
                      ログインして購入
                    </Link>
                  ) : (
                    <span style={styles.unavailable}>購入不可</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 },
  title: { margin: '0 0 12px', fontSize: 28 },
  meta: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  badge: { background: '#eee', padding: '2px 8px', borderRadius: 4, fontSize: 13 },
  synopsis: { lineHeight: 1.8, color: '#333' },
  cartMsg: { background: '#e8f5e9', padding: '10px 16px', borderRadius: 4, marginBottom: 16, color: '#2e7d32' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  productCard: { background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.1)' },
  price: { color: '#e94560', fontWeight: 'bold', margin: '8px 0' },
  outOfStock: { color: '#999', fontSize: 13 },
  unavailable: { color: '#f57c00', fontSize: 13 },
  cartBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' },
  screeningList: { display: 'flex', flexDirection: 'column', gap: 12 },
  screeningCard: { background: '#fff', padding: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  ticketBtn: { background: '#1a1a2e', color: '#fff', padding: '6px 16px', borderRadius: 4, textDecoration: 'none', display: 'inline-block' },
};
