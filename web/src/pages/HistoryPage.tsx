import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderApi, ticketApi, Order, TicketPurchase } from '../api/client';
import Layout from '../components/Layout';

/** FR-010: 購入履歴確認ページ（商品注文 + チケット購入） */
export default function HistoryPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'tickets' ? 'tickets' : 'orders';

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<TicketPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderApi.list().then((r) => setOrders(r.data.items)),
      ticketApi.list().then((r) => setTickets(r.data.items)),
    ]).finally(() => setLoading(false));
  }, []);

  const ORDER_STATUS_LABELS: Record<string, string> = {
    pending_payment: '決済待ち',
    confirmed: '注文確定',
    shipped: '発送済み',
    delivered: '配達完了',
    cancelled: 'キャンセル',
  };

  if (loading) return <Layout><p>読み込み中...</p></Layout>;

  return (
    <Layout>
      <h1>購入履歴</h1>

      {/* タブ切り替え */}
      <div style={styles.tabs}>
        <Link
          to="/history?tab=orders"
          style={{ ...styles.tab, ...(tab === 'orders' ? styles.tabActive : {}) }}
        >
          商品注文履歴（{orders.length}件）
        </Link>
        <Link
          to="/history?tab=tickets"
          style={{ ...styles.tab, ...(tab === 'tickets' ? styles.tabActive : {}) }}
        >
          チケット購入履歴（{tickets.length}件）
        </Link>
      </div>

      {tab === 'orders' && (
        <section>
          {orders.length === 0 ? (
            <p>注文履歴がありません。</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span>注文番号: <strong>{order.orderNumber}</strong></span>
                  {/* C-UI-005: 日時は YYYY/MM/DD HH:mm 形式 */}
                  <span style={{ color: '#666' }}>
                    {new Date(order.orderedAt).toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span style={styles.statusBadge}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <ul style={styles.itemList}>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.productSnapshotName} × {item.quantity} —{' '}
                      {/* C-UI-004: 税込・3桁区切り円表記 */}
                      ¥{item.subtotal.toLocaleString()}
                    </li>
                  ))}
                </ul>
                <p style={styles.total}>合計: ¥{order.totalAmount.toLocaleString()}（税込）</p>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'tickets' && (
        <section>
          {tickets.length === 0 ? (
            <p>チケット購入履歴がありません。</p>
          ) : (
            tickets.map((purchase) => (
              <div key={purchase.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span>購入番号: <strong>{purchase.purchaseNumber}</strong></span>
                  <span style={{ color: '#666' }}>
                    {new Date(purchase.purchasedAt).toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <ul style={styles.itemList}>
                  {purchase.items.map((item) => (
                    <li key={item.id}>
                      🎬 {item.screening.movie.title} —{' '}
                      {new Date(item.screening.startsAt).toLocaleString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })} /{' '}
                      {item.ticketType} × {item.quantity}枚 —{' '}
                      ¥{(item.unitPrice * item.quantity).toLocaleString()}
                    </li>
                  ))}
                </ul>
                <p style={styles.total}>合計: ¥{purchase.totalAmount.toLocaleString()}（税込）</p>
              </div>
            ))
          )}
        </section>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: { display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #eee' },
  tab: {
    padding: '10px 24px',
    textDecoration: 'none',
    color: '#666',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: { color: '#e94560', borderBottom: '2px solid #e94560', fontWeight: 'bold' },
  card: { background: '#fff', padding: 20, borderRadius: 8, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  cardHeader: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 },
  statusBadge: { background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 4, fontSize: 13 },
  itemList: { margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.8 },
  total: { color: '#e94560', fontWeight: 'bold', textAlign: 'right', margin: 0 },
};
