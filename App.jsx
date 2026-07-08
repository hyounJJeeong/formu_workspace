import { useEffect, useState } from 'react';
import { supabase, WORKSPACE_ID } from './lib/supabase';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import Auth from './components/Auth';
import Header from './components/Header';
import Nav from './components/Nav';
import TasksPanel from './components/TasksPanel';
import OkrPanel from './components/OkrPanel';
import CalendarPanel from './components/CalendarPanel';
import NotesPanel from './components/NotesPanel';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [tab, setTab] = useState('tasks');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { loading, founders, myFounderKey, tasks, okrs, events, notes, comments, refresh } = useWorkspaceData(session);

  if (session === undefined) return null; // brief initial auth check
  if (!session) return <Auth />;

  if (!WORKSPACE_ID) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p style={{ fontWeight: 600 }}>설정이 필요해요</p>
          <p className="auth-note">
            VITE_WORKSPACE_ID가 설정되지 않았어요. supabase/schema.sql을 실행한 뒤 생성된 workspace id를 .env에 넣어주세요.
          </p>
        </div>
      </div>
    );
  }

  const myName = myFounderKey ? founders[myFounderKey]?.name : '';

  return (
    <div className="shell">
      <Header founders={founders} myFounderKey={myFounderKey} onRenamed={refresh} />
      <div className="thread" />
      <Nav active={tab} onChange={setTab} />

      {loading ? (
        <div className="panel">
          <div className="card">
            <div className="empty-state">불러오는 중...</div>
          </div>
        </div>
      ) : (
        <>
          {tab === 'tasks' && <TasksPanel tasks={tasks} founders={founders} comments={comments} myName={myName} />}
          {tab === 'okr' && <OkrPanel okrs={okrs} comments={comments} myName={myName} />}
          {tab === 'calendar' && <CalendarPanel events={events} founders={founders} comments={comments} myName={myName} />}
          {tab === 'notes' && <NotesPanel notes={notes} comments={comments} myName={myName} />}
        </>
      )}

      {!myFounderKey && (
        <p className="install-hint">
          아직 &ldquo;효운&rdquo; 또는 &ldquo;가희&rdquo; 자리를 선택하지 않았어요 — 위 상단 이름 칩을 눌러 자리를 선택해주세요.
        </p>
      )}
    </div>
  );
}
