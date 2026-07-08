export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const CODE_LABEL = { task: '할일', okr: '목표', event: '일정', note: '자료' };
export function codeLabel(type, title) {
  return `[${CODE_LABEL[type]}-${title}]`;
}

let toastEl = null;
let toastTimer = null;
export function toast(msg) {
  if (!toastEl) toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

const KAKAO_TARGET_KEY = 'formu-kakao-target-phone';
export function getKakaoTarget() {
  try {
    return localStorage.getItem(KAKAO_TARGET_KEY) || '';
  } catch {
    return '';
  }
}
export function setKakaoTarget(phone) {
  try {
    localStorage.setItem(KAKAO_TARGET_KEY, phone);
  } catch {
    /* ignore */
  }
}

// Same approach as the original prototype: no official Kakao SDK (that needs
// a registered app + domain), so we deep-link into the KakaoTalk chat with
// the counterpart's phone number and copy the message to the clipboard.
export async function sendToKakao(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be blocked, that's fine */
    }
  }
  const phone = getKakaoTarget();
  if (phone) {
    window.location.href = 'kakaotalk://sendto?phone=' + encodeURIComponent(phone);
    toast('채팅방을 여는 중이에요 — 복사된 내용을 붙여넣어 보내세요');
  } else {
    try {
      window.location.href = 'kakaotalk://msg/text/' + encodeURIComponent(text);
    } catch {
      /* ignore */
    }
    toast('상단 ⚙ 카톡 연동에서 상대방 번호를 먼저 설정해보세요 (모바일 전용)');
  }
}

// "Add to Google Calendar" link — works with zero setup, no OAuth needed.
// (Two-way sync would need a Google Cloud OAuth client + a backend token
// exchange; this covers the common case of pushing an event into your own calendar.)
export function googleCalendarUrl(ev) {
  const start = ev.date.replace(/-/g, '') + (ev.time ? 'T' + ev.time.replace(':', '') + '00' : '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${start}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function dayDiff(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

export function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getMonth() + 1 + '.' + d.getDate();
}
