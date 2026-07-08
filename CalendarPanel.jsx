import { useState, useEffect } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';
import { codeLabel, sendToKakao, googleCalendarUrl, dayDiff, toast } from '../lib/utils';
import CommentThread from './CommentThread';

export default function CalendarPanel({ events, founders, comments, myName }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [owner, setOwner] = useState('');
  const [notifyOn, setNotifyOn] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');

  async function addEvent() {
    if (!title.trim() || !date) {
      toast('제목과 날짜를 입력해주세요');
      return;
    }
    await supabase.from('events').insert({
      workspace_id: WORKSPACE_ID,
      title: title.trim(),
      date,
      time: time || null,
      owner_key: owner || null,
      notified: false
    });
    setTitle('');
    setDate('');
    setTime('');
  }
  async function removeEvent(id) {
    await supabase.from('events').delete().eq('id', id);
  }
  function shareEvent(ev) {
    const ownerName = ev.owner_key && founders[ev.owner_key] ? founders[ev.owner_key].name : '공통';
    const text = `${codeLabel('event', ev.title)}\n날짜: ${ev.date}${ev.time ? ' ' + ev.time : ''}\n담당: ${ownerName}`;
    sendToKakao(text);
  }

  function enableNotify() {
    if (!('Notification' in window)) {
      toast('이 브라우저는 알림을 지원하지 않아요');
      return;
    }
    Notification.requestPermission().then((p) => {
      if (p === 'granted') {
        toast('알림이 켜졌어요 — 이 탭을 열어두세요');
        setNotifyOn(true);
      } else {
        toast('알림 권한이 거부됐어요');
      }
    });
  }

  // Best-effort local reminders while this tab is open.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const today = now.toISOString().slice(0, 10);
      events.forEach((ev) => {
        if (ev.date === today && ev.time && ev.time.slice(0, 5) === hhmm && !ev.notified) {
          new Notification('📅 ' + ev.title, {
            body: '지금이에요 · ' + (ev.owner_key && founders[ev.owner_key] ? founders[ev.owner_key].name : '공통')
          });
          supabase.from('events').update({ notified: true }).eq('id', ev.id);
        }
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [events, founders]);

  const sorted = [...events].sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')));

  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2>일정 &amp; 리마인더</h2>
          <p>날짜가 가까울수록 색이 진해져요. 이 창을 열어두면 시간이 되었을 때 알림도 울려요.</p>
        </div>
      </div>
      <div className="notify-bar">
        <div>
          <strong>브라우저 알림</strong>
          <p>이 탭을 열어둔 동안에만 울려요 — 꺼져있으면 목록에서 색으로만 확인하세요.</p>
        </div>
        <button className="btn" style={{ background: '#fff', color: 'var(--ink)' }} onClick={enableNotify}>
          {notifyOn ? '알림 켜짐 ✓' : '알림 켜기'}
        </button>
      </div>
      <div className="card">
        <div className="add-row" style={{ flexWrap: 'wrap' }}>
          <input
            placeholder="예: 변호사 미팅"
            style={{ flex: 1, minWidth: 160 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input type="date" style={{ width: 150 }} value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" style={{ width: 110 }} value={time} onChange={(e) => setTime(e.target.value)} />
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">공통</option>
            <option value="a">{founders.a.name}</option>
            <option value="b">{founders.b.name}</option>
          </select>
          <button className="btn" onClick={addEvent}>
            일정 추가
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {sorted.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="glyph">🗓️</div>등록된 일정이 없어요.
            </div>
          </div>
        )}
        {sorted.map((ev) => {
          const diff = dayDiff(ev.date);
          let badgeClass = 'badge-normal';
          let tag = null;
          if (diff < 0) {
            badgeClass = 'badge-over';
            tag = <span className="tag tag-over">지남</span>;
          } else if (diff === 0) {
            badgeClass = 'badge-today';
            tag = <span className="tag tag-today">오늘</span>;
          } else if (diff <= 3) {
            badgeClass = 'badge-today';
            tag = <span className="tag tag-today">D-{diff}</span>;
          }
          const d = new Date(ev.date + 'T00:00:00');
          return (
            <div className="event-row" key={ev.id}>
              <div className={`date-badge ${badgeClass}`}>
                <span className="d">{d.getDate()}</span>
                <span className="m">{d.getMonth() + 1}월</span>
              </div>
              <div className="event-body">
                <div className="event-title">
                  {ev.title} {tag}
                </div>
                <div className="event-sub">
                  {ev.time ? ev.time.slice(0, 5) + ' · ' : ''}
                  {ev.owner_key && founders[ev.owner_key] ? founders[ev.owner_key].name : '공통'}
                </div>
                <CommentThread parentType="event" parentId={ev.id} comments={comments} myName={myName} />
              </div>
              <div className="item-actions">
                <a className="gcal-btn" href={googleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer">
                  📆 Google
                </a>
                <button className="kakao-btn" onClick={() => shareEvent(ev)}>
                  💬 카톡
                </button>
                <button className="icon-btn" onClick={() => removeEvent(ev.id)}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
