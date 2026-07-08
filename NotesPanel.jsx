import { useState, useEffect, useRef } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';
import { codeLabel, sendToKakao, toast } from '../lib/utils';
import CommentThread from './CommentThread';

function PinterestBoard({ pinterestUrl }) {
  const anchorRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('pinitjs')) {
      const s = document.createElement('script');
      s.id = 'pinitjs';
      s.async = true;
      s.defer = true;
      s.src = '//assets.pinterest.com/js/pinit.js';
      document.body.appendChild(s);
    } else if (window.PinUtils?.build) {
      window.PinUtils.build();
    }
  }, [pinterestUrl]);

  const embedUrl = pinterestUrl.split('?')[0];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 14.5 }}>📌 Pinterest 보드</h3>
      <div style={{ maxHeight: 640, overflowY: 'auto' }}>
        <a
          ref={anchorRef}
          data-pin-do="embedBoard"
          data-pin-board-width="240"
          data-pin-scale-height="640"
          data-pin-scale-width="80"
          href={embedUrl}
        />
      </div>
      <a className="btn" style={{ textAlign: 'center', textDecoration: 'none' }} href={pinterestUrl} target="_blank" rel="noopener noreferrer">
        핀터레스트 보드에서 보기 ↗
      </a>
    </div>
  );
}

export default function NotesPanel({ notes, comments, myName }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const pinterestUrl =
    'https://www.pinterest.com/agh5955/brand-image-ref/?invite_code=f827f1913d26458c8eaf5fc2bbe5b8d6&board_collab_inviter=True&inviter_user_id=584623732786710779';

  async function addNote() {
    if (!title.trim() && !memo.trim()) {
      toast('제목이나 메모를 입력해주세요');
      return;
    }
    let file_path = null;
    let file_name = null;
    if (file) {
      setUploading(true);
      const path = `${WORKSPACE_ID}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      setUploading(false);
      if (error) {
        toast('파일 업로드에 실패했어요 (Storage 버킷 설정을 확인해주세요)');
      } else {
        file_path = path;
        file_name = file.name;
      }
    }
    await supabase.from('notes').insert({
      workspace_id: WORKSPACE_ID,
      title: title.trim() || '제목 없음',
      url: url.trim() || null,
      memo: memo.trim() || null,
      file_path,
      file_name
    });
    setTitle('');
    setUrl('');
    setMemo('');
    setFile(null);
  }
  async function removeNote(id) {
    await supabase.from('notes').delete().eq('id', id);
  }
  function shareNote(n) {
    let text = codeLabel('note', n.title);
    if (n.url) text += `\n${n.url}`;
    if (n.memo) text += `\n${n.memo}`;
    sendToKakao(text);
  }
  async function fileUrl(n) {
    if (!n.file_path) return null;
    const { data } = await supabase.storage.from('attachments').createSignedUrl(n.file_path, 60 * 60);
    return data?.signedUrl;
  }

  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2>자료 정리</h2>
          <p>왼쪽엔 링크·메모·파일을, 오른쪽엔 핀터레스트 보드 최신 사진을 모아뒀어요.</p>
        </div>
      </div>
      <div className="notes-split">
        <div className="notes-left">
          <div className="card">
            <div className="add-row" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
              <input placeholder="제목 (예: 텀시트 초안 / 확인할 메일)" style={{ flex: 1, minWidth: 160 }} value={title} onChange={(e) => setTitle(e.target.value)} />
              <input placeholder="링크 (선택)" style={{ flex: 1, minWidth: 140 }} value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="add-row" style={{ flexWrap: 'wrap' }}>
              <textarea placeholder="메모" style={{ flex: 1 }} value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
              <button className="btn" onClick={addNote} disabled={uploading}>
                {uploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.length === 0 && (
              <div className="card">
                <div className="empty-state">
                  <div className="glyph">📎</div>아직 저장한 자료가 없어요.
                </div>
              </div>
            )}
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} onRemove={() => removeNote(n.id)} onShare={() => shareNote(n)} getFileUrl={() => fileUrl(n)} comments={comments} myName={myName} />
            ))}
          </div>
        </div>
        <div className="notes-right">
          <PinterestBoard pinterestUrl={pinterestUrl} />
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, onRemove, onShare, getFileUrl, comments, myName }) {
  const [fileHref, setFileHref] = useState(null);

  useEffect(() => {
    if (note.file_path) getFileUrl().then(setFileHref);
  }, [note.file_path]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="note-card">
      <div className="note-title">
        📄 {note.url ? (
          <a href={note.url} target="_blank" rel="noopener noreferrer">
            {note.title}
          </a>
        ) : (
          note.title
        )}
      </div>
      {note.memo && <div className="note-memo">{note.memo}</div>}
      {note.file_path && (
        <div className="note-file">
          {fileHref ? (
            <a href={fileHref} target="_blank" rel="noopener noreferrer">
              📎 {note.file_name}
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>📎 {note.file_name} (링크 불러오는 중...)</span>
          )}
        </div>
      )}
      <div className="note-foot">
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
          {note.created_at?.slice(0, 10)}
        </span>
        <div className="item-actions">
          <button className="kakao-btn" onClick={onShare}>
            💬 카톡
          </button>
          <button className="icon-btn" onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>
      <CommentThread parentType="note" parentId={note.id} comments={comments} myName={myName} />
    </div>
  );
}
