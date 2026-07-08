import { useState } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';
import { codeLabel, sendToKakao } from '../lib/utils';
import CommentThread from './CommentThread';

export default function OkrPanel({ okrs, comments, myName }) {
  const [objective, setObjective] = useState('');

  async function addOkr() {
    if (!objective.trim()) return;
    await supabase.from('okrs').insert({ workspace_id: WORKSPACE_ID, objective: objective.trim() });
    setObjective('');
  }
  async function addKr(okrId) {
    const text = prompt('핵심 결과(KR)를 입력하세요');
    if (!text || !text.trim()) return;
    await supabase.from('key_results').insert({ okr_id: okrId, text: text.trim(), progress: 0 });
  }
  async function updateKr(krId, progress) {
    await supabase.from('key_results').update({ progress }).eq('id', krId);
  }
  async function removeKr(krId) {
    await supabase.from('key_results').delete().eq('id', krId);
  }
  async function removeOkr(id) {
    await supabase.from('okrs').delete().eq('id', id);
  }
  function shareOkr(okr) {
    const avg = okr.krs.length ? Math.round(okr.krs.reduce((a, k) => a + k.progress, 0) / okr.krs.length) : 0;
    let text = `${codeLabel('okr', okr.objective)} — 평균 진행률 ${avg}%`;
    if (okr.krs.length) text += '\n' + okr.krs.map((k) => `· ${k.text} (${k.progress}%)`).join('\n');
    sendToKakao(text);
  }

  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2>이번 분기 목표</h2>
          <p>목표 하나에 핵심 결과(KR)를 여러 개 붙이고, 슬라이더로 진행률을 옮겨보세요.</p>
        </div>
      </div>
      <div className="card">
        <div className="add-row">
          <input
            placeholder="새 목표 (예: 시드 라운드 클로징)"
            style={{ flex: 1 }}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOkr()}
          />
          <button className="btn" onClick={addOkr}>
            목표 추가
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {okrs.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="glyph">🎯</div>아직 등록된 목표가 없어요. 위에서 추가해보세요.
            </div>
          </div>
        )}
        {okrs.map((okr) => {
          const avg = okr.krs.length ? Math.round(okr.krs.reduce((a, k) => a + k.progress, 0) / okr.krs.length) : 0;
          return (
            <div className="card okr-card" key={okr.id}>
              <div className="obj">
                <div>
                  <div className="obj-title">{okr.objective}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>
                    평균 진행률 {avg}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="kakao-btn" onClick={() => shareOkr(okr)}>
                    💬 카톡
                  </button>
                  <button className="btn-ghost btn" style={{ padding: '6px 10px', fontSize: 11.5 }} onClick={() => addKr(okr.id)}>
                    + KR
                  </button>
                  <button className="icon-btn" onClick={() => removeOkr(okr.id)}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {okr.krs.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>KR을 추가해서 목표를 잘게 쪼개보세요.</div>}
                {okr.krs.map((kr) => (
                  <div className="kr-row" key={kr.id}>
                    <span className="kr-text">{kr.text}</span>
                    <input
                      className="kr-slider"
                      type="range"
                      min="0"
                      max="100"
                      defaultValue={kr.progress}
                      onChange={(e) => updateKr(kr.id, parseInt(e.target.value, 10))}
                    />
                    <span className="kr-bar">
                      <i style={{ width: kr.progress + '%' }} />
                    </span>
                    <span className="kr-pct mono">{kr.progress}%</span>
                    <button className="icon-btn" style={{ fontSize: 12 }} onClick={() => removeKr(kr.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <CommentThread parentType="okr" parentId={okr.id} comments={comments} myName={myName} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
