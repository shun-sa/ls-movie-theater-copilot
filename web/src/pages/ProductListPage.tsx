import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, Product } from '../api/client';
import Layout from '../components/Layout';

/** FR-005: 商品検索・閲覧ページ */
export default function ProductListPage() {
  const [keyword, setKeyword] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState<(Product & { isAvailable: boolean })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const search = async (p = 1) => {
    setLoading(true);
    try {
      const res = await productApi.search({ keyword, inStockOnly, page: p });
      setProducts(res.data.items as (Product & { isAvailable: boolean })[]);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(1);
  }, []);

  return (
    <Layout>
      <h1>商品一覧</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(1);
        }}
        style={styles.searchForm}
      >
        <input
          type="text"
          placeholder="商品名キーワード"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={styles.searchInput}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          在庫ありのみ
        </label>
        <button type="submit" style={styles.searchBtn}>検索</button>
      </form>

      {/* C-UI-003: 結果件数・ページング */}
      <p style={styles.resultCount}>
        {loading ? '検索中...' : `${total}件中 ${products.length}件表示`}
      </p>

      {!loading && products.length === 0 && <p>該当する商品が見つかりませんでした。</p>}

      <div style={styles.grid}>
        {products.map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} style={styles.card}>
            <h3 style={styles.cardTitle}>{p.name}</h3>
            {p.movie && <p style={styles.cardMeta}>関連映画: {p.movie.title}</p>}
            {/* C-UI-004: 税込・3桁区切り円表記 */}
            <p style={styles.price}>¥{p.priceTaxIncluded.toLocaleString()}<small>（税込）</small></p>
            {/* C-DATA-003: 在庫0は「在庫なし」表示 */}
            {p.stock === 0 ? (
              <span style={styles.outOfStock}>在庫なし</span>
            ) : !p.isAvailable ? (
              <span style={styles.unavailable}>販売期間外</span>
            ) : (
              <span style={styles.available}>在庫あり（{p.stock}個）</span>
            )}
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          {page > 1 && <button onClick={() => search(page - 1)} style={styles.pageBtn}>← 前へ</button>}
          <span>{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => search(page + 1)} style={styles.pageBtn}>次へ →</button>}
        </div>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  searchForm: { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  searchBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' },
  resultCount: { color: '#666', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  card: { background: '#fff', padding: 16, borderRadius: 8, textDecoration: 'none', color: 'inherit', boxShadow: '0 1px 4px rgba(0,0,0,.1)', display: 'block' },
  cardTitle: { margin: '0 0 8px', fontSize: 16, fontWeight: 'bold' },
  cardMeta: { color: '#666', fontSize: 13, margin: '0 0 8px' },
  price: { color: '#e94560', fontWeight: 'bold', margin: '0 0 8px' },
  outOfStock: { color: '#999', fontSize: 13 },
  unavailable: { color: '#f57c00', fontSize: 13 },
  available: { color: '#2e7d32', fontSize: 13 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 },
  pageBtn: { background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' },
};
