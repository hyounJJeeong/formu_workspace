import { useEffect, useState, useCallback } from 'react';
import { supabase, WORKSPACE_ID } from '../lib/supabase';

const DEFAULT_FOUNDERS = {
  a: { name: '효운', color: '#8A6A4C' },
  b: { name: '가희', color: '#D98E93' }
};

export function useWorkspaceData(session) {
  const [founders, setFounders] = useState(DEFAULT_FOUNDERS);
  const [tasks, setTasks] = useState([]);
  const [okrs, setOkrs] = useState([]); // each okr has .krs attached
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState([]); // all comments, filtered per-panel
  const [myFounderKey, setMyFounderKey] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!WORKSPACE_ID) return;
    setLoading(true);

    const [membersRes, tasksRes, okrsRes, krsRes, eventsRes, notesRes, commentsRes] = await Promise.all([
      supabase.from('workspace_members').select('*').eq('workspace_id', WORKSPACE_ID),
      supabase.from('tasks').select('*').eq('workspace_id', WORKSPACE_ID).order('created_at', { ascending: false }),
      supabase.from('okrs').select('*').eq('workspace_id', WORKSPACE_ID).order('created_at', { ascending: false }),
      supabase.from('key_results').select('*'),
      supabase.from('events').select('*').eq('workspace_id', WORKSPACE_ID),
      supabase.from('notes').select('*').eq('workspace_id', WORKSPACE_ID).order('created_at', { ascending: false }),
      supabase.from('comments').select('*').eq('workspace_id', WORKSPACE_ID).order('created_at', { ascending: true })
    ]);

    const nextFounders = { ...DEFAULT_FOUNDERS };
    (membersRes.data || []).forEach((m) => {
      nextFounders[m.founder_key] = { name: m.name, color: m.color };
      if (session && m.user_id === session.user.id) setMyFounderKey(m.founder_key);
    });
    setFounders(nextFounders);

    const krsByOkr = {};
    (krsRes.data || []).forEach((kr) => {
      (krsByOkr[kr.okr_id] ||= []).push(kr);
    });
    setOkrs((okrsRes.data || []).map((o) => ({ ...o, krs: krsByOkr[o.id] || [] })));

    setTasks(tasksRes.data || []);
    setEvents(eventsRes.data || []);
    setNotes(notesRes.data || []);
    setComments(commentsRes.data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime: any change to any of these tables triggers a refetch.
  // (Simple + reliable over hand-rolling granular patches for a 2-person workspace.)
  useEffect(() => {
    if (!WORKSPACE_ID) return;
    const channel = supabase
      .channel('workspace-' + WORKSPACE_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'okrs', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${WORKSPACE_ID}` }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  return {
    loading,
    founders,
    myFounderKey,
    tasks,
    okrs,
    events,
    notes,
    comments,
    refresh: loadAll
  };
}
