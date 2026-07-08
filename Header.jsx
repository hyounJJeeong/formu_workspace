import { useState } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';
import { getKakaoTarget, setKakaoTarget, toast } from '../lib/utils';

export default function Header({ founders, myFounderKey, onRenamed }) {
  const [editing, setEditing] = useState(null);

  async function claimSeat(key) {
    if (myFounderKey) return; // already claimed a seat
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;
    const defaults = { a: { name: '효운', color: '#8A6A4C' }, b: { name: '가희', color: '#D98E93' } };
    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: WORKSPACE_ID,
      user_id: userId,
      founder_key: key,
      name: founders[key]?.name || defaults[key].name,
      color: defaults[key].color
    });
    if (error) toast('이미 다른 사람이 이 자리를 사용 중일 수 있어요');
    else {
      toast(`${defaults[key].name} 자리로 참여했어요`);
      onRenamed();
    }
  }

  async function renameFounder(key, name) {
    if (myFounderKey !== key) return;
    await supabase.from('workspace_members').update({ name }).eq('workspace_id', WORKSPACE_ID).eq('founder_key', key);
    onRenamed();
  }

  function configureKakao() {
    const cur = getKakaoTarget();
    const phone = prompt(
      '상대방 카카오톡에 연결된 전화번호를 입력하세요 (예: 01012345678)\n\n※ 이 번호는 지금 이 브라우저에만 저장돼요. 두 분 모두 각자 화면에서 "상대방" 번호를 넣어주세요.',
      cur || ''
    );
    if (phone === null) return;
    const cleaned = phone.replace(/[^0-9]/g, '');
    setKakaoTarget(cleaned);
    toast(cleaned ? '카톡 연동 번호가 저장됐어요' : '카톡 연동이 해제됐어요');
  }

  return (
    <div className="top">
      <div className="brand">
        <div className="eyebrow">SHARED WORKSPACE</div>
        <h1>
          FÓRM<span className="amp">U</span> work space
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div className="founders">
          {['a', 'b'].map((key) => {
            const f = founders[key];
            const isMe = myFounderKey === key;
            const claimed = f && f.name;
            return (
              <div className="f-chip" key={key}>
                <span className="dot" style={{ background: f.color }}>
                  {(f.name || '?').slice(0, 1).toUpperCase()}
                </span>
                {editing === key ? (
                  <input
                    autoFocus
                    defaultValue={f.name}
                    disabled={!isMe}
                    onBlur={(e) => {
                      setEditing(null);
                      if (e.target.value.trim()) renameFounder(key, e.target.value.trim());
                    }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 12.5, fontWeight: 600, cursor: isMe ? 'text' : myFounderKey ? 'default' : 'pointer' }}
                    onClick={() => (isMe ? setEditing(key) : !myFounderKey && claimSeat(key))}
                    title={isMe ? '이름 수정' : !myFounderKey ? '이 자리로 참여' : ''}
                  >
                    {f.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button
          className="icon-btn"
          style={{ border: '1px solid var(--line)', borderRadius: 20, padding: '6px 12px', fontSize: 12.5, background: 'var(--panel)' }}
          onClick={configureKakao}
          title="카톡 연동 설정"
        >
          ⚙ 카톡 연동
        </button>
        <button
          className="icon-btn"
          style={{ border: '1px solid var(--line)', borderRadius: 20, padding: '6px 12px', fontSize: 12.5, background: 'var(--panel)' }}
          onClick={() => supabase.auth.signOut()}
          title="로그아웃"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
