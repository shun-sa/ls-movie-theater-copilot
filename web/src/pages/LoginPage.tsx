import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

/** FR-002: ログインページ */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      // ERR-002: 汎用メッセージのみ表示
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'ログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <h1>ログイン</h1>
        {error && <p style={styles.errorMsg}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              メールアドレス <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              パスワード <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p>
          会員登録がお済みでない方は <Link to="/register">会員登録</Link>
        </p>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 400, margin: '60px auto', background: '#fff', padding: 32, borderRadius: 8 },
  form: { display: 'flex', flexDirection: 'column' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' },
  errorMsg: { color: 'red', padding: '8px 12px', background: '#fff0f0', borderRadius: 4 },
  submitBtn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 4,
    cursor: 'pointer',
  },
};
