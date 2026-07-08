const TABS = [
  { key: 'tasks', label: '📋 할일' },
  { key: 'okr', label: '🎯 목표' },
  { key: 'calendar', label: '🗓️ 일정' },
  { key: 'notes', label: '📎 자료' }
];

export default function Nav({ active, onChange }) {
  return (
    <div className="nav">
      {TABS.map((t) => (
        <button key={t.key} className={active === t.key ? 'active' : ''} onClick={() => onChange(t.key)}>
          {t.label}
          <span className="u" />
        </button>
      ))}
    </div>
  );
}
