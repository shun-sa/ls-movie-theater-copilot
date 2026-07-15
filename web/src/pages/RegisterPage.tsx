import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

/** FR-001: 会員登録ページ */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError('');

    try {
      await authApi.register(form);
      await refetch();
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { fields?: Record<string, string>; message?: string };
      if (apiErr.fields) {
        setErrors(apiErr.fields);
      } else {
        setGlobalError(apiErr.message ?? 'エラーが発生しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <h1>会員登録</h1>
        {globalError && <p style={styles.errorMsg}>{globalError}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <Field
            label="氏名"
            type="text"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            error={errors['name']}
            required
          />
          <Field
            label="メールアドレス"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            error={errors['email']}
            required
          />
          <Field
            label="パスワード（8〜64文字英数字）"
            type="password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            error={errors['password']}
            required
          />
          <Field
            label="パスワード（確認）"
            type="password"
            value={form.passwordConfirm}
            onChange={(v) => setForm((f) => ({ ...f, passwordConfirm: v }))}
            error={errors['passwordConfirm']}
            required
          />
          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? '登録中...' : '会員登録'}
          </button>
        </form>
        <p>
          すでに会員の方は <Link to="/login">ログイン</Link>
        </p>
      </div>
    </Layout>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
      />
      {/* C-UI-002: 入力エラー時、該当項目近傍にエラーメッセージを表示 */}
      {error && <p style={styles.fieldError}>{error}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 480, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 8 },
  form: { display: 'flex', flexDirection: 'column' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' },
  inputError: { borderColor: 'red' },
  fieldError: { color: 'red', fontSize: 13, margin: '4px 0 0' },
  errorMsg: { color: 'red', padding: '8px 12px', background: '#fff0f0', borderRadius: 4 },
  submitBtn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 8,
  },
};
