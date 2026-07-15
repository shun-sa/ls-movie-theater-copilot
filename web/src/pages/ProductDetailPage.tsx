import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, cartApi } from '../api/client';
import type { Product } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

/** FR-005: 商品詳細 / FR-006: カートに追加 */
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<(Product & { isAvailable: boolean }) | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productApi.findById(id).then((res) => {
      setProduct(res.data);
      setLoading(false);
    });
  }, [id]);

  const addToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!product) return;

    try {
      await cartApi.addItem({ productId: product.id, quantity });
      setMessage('カートに追加しました');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e.message ?? 'エラーが発生しました');
    }
  };

  if (loading) return <Layout><p>読み込み中...</p></Layout>;
  if (!product) return <Layout><p>商品が見つかりませんでした。</p></Layout>;

  return (
    <Layout>
      <Link to="/products" style={{ color: '#666', textDecoration: 'none' }}>← 商品一覧に戻る</Link>

      <div style={styles.card}>
        <h1>{product.name}</h1>
        {product.movie && <p style={styles.movieLink}>
          関連映画: <Link to={`/movies/${product.movie.id}`}>{product.movie.title}</Link>
        </p>}

        {/* C-UI-004: 税込・3桁区切り円表記 */}
        <p style={styles.price}>¥{product.priceTaxIncluded.toLocaleString()}<small>（税込）</small></p>

        {/* C-DATA-003 */}
        {product.stock === 0 ? (
          <p style={styles.outOfStock}>在庫なし</p>
        ) : !product.isAvailable ? (
          <p style={styles.unavailable}>販売期間外</p>
        ) : (
          <>
            <p style={styles.stock}>在庫: {product.stock}個</p>
            {message && <p style={styles.msg}>{message}</p>}
            <div style={styles.addRow}>
              <label>
                数量:{' '}
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={styles.qtyInput}
                />
              </label>
              <button onClick={addToCart} style={styles.addBtn}>
                {user ? 'カートに追加' : 'ログインして購入'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#fff', padding: 32, borderRadius: 8, marginTop: 16 },
  movieLink: { color: '#666', fontSize: 14 },
  price: { fontSize: 24, color: '#e94560', fontWeight: 'bold', margin: '16px 0' },
  stock: { color: '#2e7d32' },
  outOfStock: { color: '#999' },
  unavailable: { color: '#f57c00' },
  msg: { color: '#2e7d32', background: '#e8f5e9', padding: '8px 12px', borderRadius: 4 },
  addRow: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 },
  qtyInput: { width: 60, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 },
  addBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, cursor: 'pointer' },
};
