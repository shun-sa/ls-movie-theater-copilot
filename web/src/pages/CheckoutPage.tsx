import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, OrderInput } from '../api/client';
import Layout from '../components/Layout';

/** FR-008: 商品注文確定ページ */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<OrderInput>({
    shippingName: '',
    postalCode: '',
    prefecture: '',
    addressLine: '',
    phoneNumber: '',
    paymentMethod: 'credit_card',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError('');

    try {
      const res = await orderApi.create(form);
      // NFR-USAB-003: 注文完了画面と注文番号表示
      navigate(`/orders/${res.data.id}?new=1`);
    } catch (err: unknown) {
      const e = err as { fields?: Record<string, string>; message?: string };
      if (e.fields) setErrors(e.fields);
      else setGlobalError(e.message ?? 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof OrderInput,
    label: string,
    type = 'text',
    placeholder = ''
  ) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>
        {label} <span style={{ color: 'red' }}>*</span>
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ ...styles.input, ...(errors[key] ? styles.inputErr : {}) }}
      />
      {/* C-UI-002: 該当項目近傍にエラーメッセージ */}
      {errors[key] && <p style={styles.fieldErr}>{errors[key]}</p>}
    </div>
  );

  return (
    <Layout>
      <h1>注文手続き</h1>
      {globalError && <p style={styles.errMsg}>{globalError}</p>}

      <div style={styles.container}>
        <form onSubmit={handleSubmit}>
          <h2>配送先情報</h2>
          {field('shippingName', 'お名前', 'text', '山田 太郎')}
          {field('postalCode', '郵便番号', 'text', '123-4567')}
          {field('prefecture', '都道府県', 'text', '東京都')}
          {field('addressLine', '市区町村・番地', 'text', '渋谷区渋谷1-1-1')}
          {field('phoneNumber', '電話番号', 'tel', '09012345678')}

          <h2>お支払い方法</h2>
          <div style={{ marginBottom: 24 }}>
            {[
              { value: 'credit_card', label: 'クレジットカード（模擬）' },
              { value: 'convenience', label: 'コンビニ払い（模擬）' },
              { value: 'bank_transfer', label: '銀行振込（模擬）' },
            ].map((opt) => (
              <label key={opt.value} style={{ display: 'block', marginBottom: 8 }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={form.paymentMethod === opt.value}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                />{' '}
                {opt.label}
              </label>
            ))}
          </div>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? '注文処理中...' : '注文を確定する'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#fff', padding: 32, borderRadius: 8, maxWidth: 600 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' },
  inputErr: { borderColor: 'red' },
  fieldErr: { color: 'red', fontSize: 13, margin: '4px 0 0' },
  errMsg: { color: 'red', background: '#fff0f0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 },
  submitBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
