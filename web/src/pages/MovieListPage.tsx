import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieApi, Movie } from '../api/client';
import Layout from '../components/Layout';

/** FR-003: 映画作品検索ページ */
export default function MovieListPage() {
  const [keyword, setKeyword] = useState('');
  const [genre, setGenre] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const search = async (p = 1) => {
    setLoading(true);
    try {
      const res = await movieApi.search({ keyword, genre, page: p });
      setMovies(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(1);
  }, []);

  return (
    <Layout>
      <h1>映画作品検索</h1>

      {/* 検索フォーム */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(1);
        }}
        style={styles.searchForm}
      >
        <input
          type="text"
          placeholder="タイトルキーワード"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={styles.searchInput}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={styles.select}>
          <option value="">ジャンル（すべて）</option>
          <option value="アクション">アクション</option>
          <option value="SF">SF</option>
          <option value="ドラマ">ドラマ</option>
          <option value="コメディ">コメディ</option>
          <option value="ホラー">ホラー</option>
          <option value="アニメ">アニメ</option>
        </select>
        <button type="submit" style={styles.searchBtn}>検索</button>
      </form>

      {/* C-UI-003: 結果件数・ページング表示 */}
      <p style={styles.resultCount}>
        {loading ? '検索中...' : `${total}件中 ${movies.length}件表示`}
      </p>

      {/* 一覧表示 */}
      {!loading && movies.length === 0 && (
        <p>該当する映画が見つかりませんでした。</p>
      )}

      <div style={styles.grid}>
        {movies.map((movie) => (
          <Link key={movie.id} to={`/movies/${movie.id}`} style={styles.card}>
            <div style={styles.cardBadge}>{movie.genre}</div>
            <h3 style={styles.cardTitle}>{movie.title}</h3>
            <p style={styles.cardMeta}>
              公開日: {new Date(movie.releaseDate).toLocaleDateString('ja-JP')} /{' '}
              {movie.runtimeMinutes}分
            </p>
            <p style={styles.cardSynopsis}>{movie.synopsis.slice(0, 80)}...</p>
          </Link>
        ))}
      </div>

      {/* ページング (NFR-PERF-003) */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          {page > 1 && (
            <button onClick={() => search(page - 1)} style={styles.pageBtn}>
              ← 前へ
            </button>
          )}
          <span>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button onClick={() => search(page + 1)} style={styles.pageBtn}>
              次へ →
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  searchForm: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  select: { padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  searchBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' },
  resultCount: { color: '#666', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: {
    background: '#fff',
    padding: 16,
    borderRadius: 8,
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 1px 4px rgba(0,0,0,.1)',
    display: 'block',
  },
  cardBadge: { background: '#eee', display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginBottom: 8 },
  cardTitle: { margin: '0 0 8px', fontSize: 16, fontWeight: 'bold' },
  cardMeta: { color: '#666', fontSize: 13, margin: '0 0 8px' },
  cardSynopsis: { color: '#444', fontSize: 13, margin: 0 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 },
  pageBtn: { background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' },
};
