import { useState } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';
import { codeLabel, sendToKakao, formatShortDate } from '../lib/utils';
import CommentThread from './CommentThread';

const TASK_COLS = [
  ['todo', '진행 전'],
  ['doing', '진행 중'],
  ['done', '완료']
];

function ownerDot(ownerKey, founders, onClick) {
  const f = ownerKey && founders[ownerKey];
  if (!f) {
    return (
      <span className="owner-dot empty" onClick={onClick} title="담당 없음">
        ·
      </span>
    );
  }
  return (
    <span className="owner-dot" style={{ background: f.color }} onClick={onClick} title={f.name}>
      {(f.name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function TasksPanel({ tasks, founders, comments, myName }) {
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');

  async function addTask() {
    if (!title.trim()) return;
    await supabase.from('tasks').insert({
      workspace_id: WORKSPACE_ID,
      title: title.trim(),
      owner_key: owner || null,
      due: due || null,
      status: 'todo'
    });
    setTitle('');
    setDue('');
  }

  async function setStatus(id, status) {
    await supabase.from('tasks').update({ status }).eq('id', id);
  }
  async function removeTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
  }
  async function cycleOwner(t) {
    const next = t.owner_key === null || t.owner_key === '' ? 'a' : t.owner_key === 'a' ? 'b' : null;
    await supabase.from('tasks').update({ owner_key: next }).eq('id', t.id);
  }
  function shareTask(t) {
    const ownerName = t.owner_key && founders[t.owner_key] ? founders[t.owner_key].name : '미정';
    const statusLabel = (TASK_COLS.find((c) => c[0] === t.status) || [, ''])[1];
    let text = `${codeLabel('task', t.title)}\n담당: ${ownerName} · 상태: ${statusLabel}`;
    if (t.due) text += `\n마감: ${t.due}`;
    sendToKakao(text);
  }

  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2>할일 · 진행상황</h2>
          <p>추가하면 자동으로 “진행 전”에 들어가요. 상태는 카드 안 버튼으로 바꿔주세요.</p>
        </div>
      </div>
      <div className="card">
        <div className="add-row" style={{ flexWrap: 'wrap' }}>
          <input
            placeholder="예: 투자자 자료 초안 작성"
            style={{ flex: 1, minWidth: 180 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">담당 미정</option>
            <option value="a">{founders.a.name} 담당</option>
            <option value="b">{founders.b.name} 담당</option>
          </select>
          <input type="date" style={{ width: 150 }} value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="btn" onClick={addTask}>
            추가
          </button>
        </div>
      </div>
      <div className="task-cols">
        {TASK_COLS.map(([key, label]) => {
          const items = tasks.filter((t) => t.status === key);
          return (
            <div className="task-col" key={key}>
              <div className="col-head">
                <span>{label}</span>
                <span>{items.length}</span>
              </div>
              {items.length === 0 && <div className="empty-state" style={{ padding: '16px 6px' }}>아직 없어요</div>}
              {items.map((t) => (
                <div className="task-item" key={t.id}>
                  <div className="row1">
                    <div className="title">{t.title}</div>
                    <div className="item-actions">
                      <button className="kakao-btn" onClick={() => shareTask(t)}>
                        💬 카톡
                      </button>
                      <button className="icon-btn" onClick={() => removeTask(t.id)}>
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="due mono">{t.due ? formatShortDate(t.due) : ''}</span>
                    {ownerDot(t.owner_key, founders, () => cycleOwner(t))}
                  </div>
                  <div className="status-btns">
                    {TASK_COLS.map(([k, l]) => (
                      <button key={k} data-key={k} className={k === t.status ? 'on' : ''} onClick={() => setStatus(t.id, k)}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <CommentThread parentType="task" parentId={t.id} comments={comments} myName={myName} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
