import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, Cart } from '../api/client';
import Layout from '../components/Layout';

/** FR-006: カート / FR-007: カート内容変更 */
export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchCart = async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (productId: string, qty: number) => {
    try {
      const res = await cartApi.updateItem(productId, qty);
      setCart((res as { data: Cart }).data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e.message ?? 'エラーが発生しました');
    }
  };

  const remove = async (productId: string) => {
    try {
      const res = await cartApi.removeItem(productId);
      setCart((res as { data: Cart }).data);
    } catch {
      setMessage('削除に失敗しました');
    }
  };

  if (loading) return <Layout><p>読み込み中...</p></Layout>;

  const items = cart?.items ?? [];
  const total = items.reduce((s, i) => s + i.product.priceTaxIncluded * i.quantity, 0);

  return (
    <Layout>
      <h1>カート</h1>
      {message && <p style={styles.errMsg}>{message}</p>}

      {items.length === 0 ? (
        <p>カートに商品がありません。</p>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>商品名</th>
                <th style={styles.th}>単価</th>
                <th style={styles.th}>数量</th>
                <th style={styles.th}>小計</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td style={styles.td}>{item.product.name}</td>
                  {/* C-UI-004: 税込・3桁区切り円表記 */}
                  <td style={styles.td}>¥{item.product.priceTaxIncluded.toLocaleString()}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                      style={{ width: 60, padding: '4px', border: '1px solid #ccc', borderRadius: 4 }}
                    />
                  </td>
                  <td style={styles.td}>¥{(item.product.priceTaxIncluded * item.quantity).toLocaleString()}</td>
                  <td style={styles.td}>
                    <button onClick={() => remove(item.productId)} style={styles.removeBtn}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.totalRow}>
            <strong>合計: ¥{total.toLocaleString()}（税込）</strong>
            <button onClick={() => navigate('/checkout')} style={styles.checkoutBtn}>
              注文手続きへ
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errMsg: { color: 'red', background: '#fff0f0', padding: '8px 12px', borderRadius: 4 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', marginBottom: 16 },
  th: { padding: '10px 12px', borderBottom: '2px solid #eee', textAlign: 'left', background: '#f9f9f9' },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee' },
  totalRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, padding: 16, background: '#fff', borderRadius: 8 },
  removeBtn: { background: '#ff5252', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' },
  checkoutBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
