import { useState } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';

export default function CommentThread({ parentType, parentId, comments, myName }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const mine = comments.filter((c) => c.parent_type === parentType && c.parent_id === parentId);

  async function submit(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await supabase.from('comments').insert({
      workspace_id: WORKSPACE_ID,
      parent_type: parentType,
      parent_id: parentId,
      author_name: myName || '익명',
      body
    });
  }

  if (!open && mine.length === 0) {
    return (
      <button className="icon-btn" style={{ fontSize: 11, color: 'var(--ink-soft)' }} onClick={() => setOpen(true)}>
        💬 댓글 달기
      </button>
    );
  }

  return (
    <div className="comments">
      {mine.length > 0 && (
        <button className="icon-btn" style={{ fontSize: 10.5, color: 'var(--ink-soft)', alignSelf: 'flex-start', padding: 0 }} onClick={() => setOpen((o) => !o)}>
          {open ? '댓글 숨기기' : `댓글 ${mine.length}개 보기`}
        </button>
      )}
      {open &&
        mine.map((c) => (
          <div className="comment" key={c.id}>
            <span className="who">{c.author_name}</span>
            {c.body}
          </div>
        ))}
      {open && (
        <form className="comment-add" onSubmit={submit}>
          <input placeholder="댓글 추가..." value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="btn-ghost btn" style={{ padding: '6px 10px', fontSize: 11.5 }} type="submit">
            등록
          </button>
        </form>
      )}
    </div>
  );
}
