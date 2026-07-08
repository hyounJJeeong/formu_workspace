import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });
    setLoading(false);
    if (err) setError('로그인 링크 전송에 실패했어요. 다시 시도해주세요.');
    else setSent(true);
  }

  return (
    <div className="auth-shell">
      <div className="eyebrow mono" style={{ marginBottom: 10 }}>SHARED WORKSPACE</div>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 28, marginBottom: 18 }}>
        FÓRM<span style={{ fontStyle: 'italic' }}>U</span> work space
      </h1>
      <div className="auth-card">
        {sent ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 600 }}>이메일을 확인해주세요</p>
            <p className="auth-note">{email} 주소로 로그인 링크를 보냈어요. 링크를 누르면 바로 워크스페이스로 들어와요.</p>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? '전송 중...' : '로그인 링크 받기'}
            </button>
            {error && <p className="auth-note" style={{ color: 'var(--danger)' }}>{error}</p>}
            <p className="auth-note">비밀번호 없이, 이메일로 받은 링크로 로그인해요.</p>
          </form>
        )}
      </div>
    </div>
  );
}
