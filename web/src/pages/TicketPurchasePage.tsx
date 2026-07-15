import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ticketApi, TicketInput } from '../api/client';
import Layout from '../components/Layout';

/** FR-009: チケット購入ページ */
export default function TicketPurchasePage() {
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get('screeningId') ?? '';
  const navigate = useNavigate();

  const [form, setForm] = useState<TicketInput>({
    screeningId,
    ticketType: '一般',
    quantity: 1,
    paymentMethod: 'credit_card',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!screeningId) navigate('/movies');
  }, [screeningId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError('');

    try {
      const res = await ticketApi.purchase(form);
      navigate(`/tickets/${res.data.id}?new=1`);
    } catch (err: unknown) {
      const e = err as { fields?: Record<string, string>; message?: string };
      if (e.fields) setErrors(e.fields);
      else setGlobalError(e.message ?? 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <h1>チケット購入</h1>
      {globalError && <p style={styles.errMsg}>{globalError}</p>}

      <div style={styles.container}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              券種 <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              value={form.ticketType}
              onChange={(e) => setForm((f) => ({ ...f, ticketType: e.target.value as TicketInput['ticketType'] }))}
              style={styles.select}
            >
              <option value="一般">一般（¥1,800）</option>
              <option value="学生">学生（¥1,200）</option>
              <option value="シニア">シニア（¥1,100）</option>
            </select>
            {errors.ticketType && <p style={styles.fieldErr}>{errors.ticketType}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              枚数（1〜10枚） <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              style={styles.input}
            />
            {errors.quantity && <p style={styles.fieldErr}>{errors.quantity}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>お支払い方法 <span style={{ color: 'red' }}>*</span></label>
            {[
              { value: 'credit_card', label: 'クレジットカード（模擬）' },
              { value: 'convenience', label: 'コンビニ払い（模擬）' },
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

          {/* NFR-USAB-004: チケット確定前に内容を確認可能 */}
          <div style={styles.summary}>
            <strong>購入内容確認</strong>
            <p>券種: {form.ticketType}</p>
            <p>枚数: {form.quantity}枚</p>
            <p>合計: ¥{({ '一般': 1800, '学生': 1200, 'シニア': 1100 }[form.ticketType] * form.quantity).toLocaleString()}（税込）</p>
          </div>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? '処理中...' : 'チケットを購入する'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#fff', padding: 32, borderRadius: 8, maxWidth: 480 },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  input: { width: 80, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 },
  fieldErr: { color: 'red', fontSize: 13, margin: '4px 0 0' },
  errMsg: { color: 'red', background: '#fff0f0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 },
  summary: { background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 },
  submitBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
