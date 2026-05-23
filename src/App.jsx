import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Send, Trash2, List, Loader2, RotateCcw, X } from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================
const FR_MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const FR_DAYS_FULL = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const FR_DAYS_SHORT = ["L","M","M","J","V","S","D"];

const HOLIDAYS = {
  "2026-05-01": "Fête du Travail",
  "2026-05-08": "Victoire 1945",
  "2026-05-14": "Ascension",
  "2026-05-25": "Lundi de Pentecôte",
  "2026-07-14": "Fête Nationale",
  "2026-08-15": "Assomption",
  "2026-11-01": "Toussaint",
  "2026-11-11": "Armistice",
  "2026-12-25": "Noël",
};

const STAGES = {
  2: { doctor: "Le Bris",  label: "Le Bris",  color: "#A8895F" },
  3: { doctor: "Montalvo", label: "Montalvo", color: "#73A56B" },
  4: { doctor: "Andro",    label: "Andro",    color: "#CC809D" },
};

const C = {
  bgOtherMonth: 'rgb(240, 240, 240)',
  bgSaturday: 'rgb(246, 246, 246)',
  bgSunday: 'rgb(233, 233, 233)',
  bgHoliday: 'rgb(218, 218, 218)',
  bgUserVac: 'rgb(251, 224, 224)',
  textDay: 'rgb(80, 80, 80)',
  textOtherMonth: 'rgb(191, 191, 191)',
  textTitle: 'rgb(60, 60, 60)',
  textLabel: 'rgb(140, 140, 140)',
  textVacLabel: 'rgb(158, 82, 82)',
  headerBg: 'rgb(128, 128, 128)',
  grid: 'rgb(220, 220, 220)',
  gridLight: 'rgb(238, 238, 238)',
  eventRed: '#FF3B30',
  eventBlue: '#007AFF',
  iosBlue: '#007AFF',
  iosBg: '#F2F2F7',
  iosCard: '#FFFFFF',
  iosSeparator: 'rgba(60, 60, 67, 0.12)',
  iosSecondaryText: 'rgba(60, 60, 67, 0.6)',
};

const DEFAULT_STATE = {
  events: [
    { id: 'e1', date: '2026-05-26', label: 'Topo', color: 'red' },
    { id: 'e2', date: '2026-05-30', label: 'Finale LDC', color: 'blue' },
    { id: 'e3', date: '2026-06-18', label: 'GEAPT', color: 'red' },
  ],
  userVacations: [
    { id: 'v1', start: '2026-07-01', end: '2026-07-06', label: 'Les Ardentes', includeWeekend: true },
    { id: 'v2', start: '2026-11-22', end: '2026-11-22', label: 'Giants', includeWeekend: true },
    { id: 'v3', start: '2026-11-23', end: '2026-11-23', label: 'Commanders', includeWeekend: true },
    { id: 'v4', start: '2026-11-26', end: '2026-11-26', label: 'Bills', includeWeekend: true },
    { id: 'v5', start: '2026-11-27', end: '2026-11-27', label: 'Steelers', includeWeekend: true },
    { id: 'v6', start: '2026-12-12', end: '2026-12-12', label: 'Anyma', includeWeekend: true },
  ],
  stageEndDate: '2026-11-01',
  stageVacations: { 'Le Bris': [], 'Montalvo': [], 'Andro': [] },
};

const STORAGE_KEY = 'planning_state_v1';

// ============================================================
// HELPERS
// ============================================================
const pad = n => String(n).padStart(2, '0');
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const mondayIdx = d => (d.getDay() + 6) % 7;
const uid = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function getMonthWeeks(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const first = new Date(year, month - 1, 1);
  const last  = new Date(year, month - 1, lastDay);
  const startOffset = mondayIdx(first);
  const endOffset   = 6 - mondayIdx(last);
  const totalDays = lastDay + startOffset + endOffset;
  const nWeeks = totalDays / 7;
  const weeks = [];
  const cur = new Date(year, month - 1, 1 - startOffset);
  for (let w = 0; w < nWeeks; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const fmtFr = s => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
};

const fmtFrLong = s => {
  const d = new Date(s);
  return `${FR_DAYS_FULL[mondayIdx(d)]} ${d.getDate()} ${FR_MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
};

function getDayInfo(date, currentMonth, state) {
  const dateStr = fmtDate(date);
  const inMonth = date.getMonth() + 1 === currentMonth;
  const wd = mondayIdx(date);
  const isSat = wd === 5, isSun = wd === 6, isWeekday = wd < 5;
  const isHoliday = !!HOLIDAYS[dateStr];

  const vac = state.userVacations.find(v => dateStr >= v.start && dateStr <= v.end);
  const vacActive = !!vac && (isWeekday || vac.includeWeekend);

  let bg = 'white';
  if (!inMonth) bg = C.bgOtherMonth;
  else if (isHoliday) bg = C.bgHoliday;
  else if (vacActive) bg = C.bgUserVac;
  else if (isSun) bg = C.bgSunday;
  else if (isSat) bg = C.bgSaturday;

  const badges = [];
  if (inMonth && !isHoliday && !vacActive && dateStr <= state.stageEndDate) {
    const stage = STAGES[wd];
    if (stage) {
      const onDocVac = (state.stageVacations[stage.doctor] || [])
        .some(p => dateStr >= p.start && dateStr <= p.end);
      if (!onDocVac) badges.push({ kind: 'stage', label: stage.label, color: stage.color });
    }
  }
  if (inMonth) {
    for (const e of state.events.filter(e => e.date === dateStr)) {
      badges.push({
        kind: 'event',
        label: e.label,
        color: e.color === 'blue' ? C.eventBlue : C.eventRed,
        eventColor: e.color,
      });
    }
  }

  return { dateStr, inMonth, isWeekday, isSat, isSun, isHoliday, vac, vacActive, bg, badges };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ============================================================
// CELLULES
// ============================================================
function DesktopDayCell({ date, currentMonth, state }) {
  const info = getDayInfo(date, currentMonth, state);
  return (
    <div style={{
      background: info.bg,
      borderRight: `1px solid ${C.grid}`,
      borderBottom: `1px solid ${C.grid}`,
      minHeight: 96,
      padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        fontSize: info.inMonth ? 20 : 14,
        color: info.inMonth ? C.textDay : C.textOtherMonth,
        lineHeight: 1, marginBottom: 2,
      }}>{date.getDate()}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {info.badges.map((b, i) => (
          <span key={i} style={{
            border: `1px solid ${b.color}`, color: b.color, borderRadius: 999,
            padding: '1px 7px', fontSize: 9, fontWeight: 700,
            alignSelf: 'flex-start', maxWidth: '100%',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: 0.2,
          }}>{b.label}</span>
        ))}
      </div>
      {info.inMonth && info.isHoliday && (
        <div style={{ fontSize: 8, fontStyle: 'italic', color: C.textLabel, marginTop: 'auto' }}>
          {HOLIDAYS[info.dateStr]}
        </div>
      )}
      {info.inMonth && info.vacActive && (
        <div style={{ fontSize: 8, fontStyle: 'italic', color: C.textVacLabel, marginTop: 'auto' }}>
          {info.vac.label}
        </div>
      )}
    </div>
  );
}

function MobileDayCell({ date, currentMonth, state, isSelected, onTap }) {
  const info = getDayInfo(date, currentMonth, state);
  const dotColors = info.badges.slice(0, 4).map(b => b.color);

  return (
    <button
      onClick={onTap}
      style={{
        background: info.bg,
        border: 'none',
        borderRight: `1px solid ${C.gridLight}`,
        borderBottom: `1px solid ${C.gridLight}`,
        aspectRatio: '1',
        padding: 0,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: 6,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{
        fontSize: info.inMonth ? 15 : 12,
        fontWeight: 400,
        width: 26, height: 26,
        display: 'grid', placeItems: 'center',
        borderRadius: '50%',
        background: isSelected ? C.iosBlue : 'transparent',
        color: isSelected ? 'white' : (info.inMonth ? C.textDay : C.textOtherMonth),
        transition: 'background 0.15s',
      }}>{date.getDate()}</span>

      {dotColors.length > 0 && (
        <div style={{
          display: 'flex', gap: 2.5, marginTop: 3, justifyContent: 'center',
          flexWrap: 'wrap', maxWidth: '90%',
        }}>
          {dotColors.map((color, i) => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: color,
              display: 'block',
            }} />
          ))}
        </div>
      )}
    </button>
  );
}

// ============================================================
// GRILLE
// ============================================================
function MonthGrid({ year, month, state, isMobile, selected, setSelected }) {
  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const DaysHeader = isMobile ? FR_DAYS_SHORT : FR_DAYS_FULL;

  return (
    <div style={{
      background: 'white',
      border: isMobile ? 'none' : `1px solid ${C.grid}`,
      borderRadius: isMobile ? 14 : 0,
      overflow: 'hidden',
      boxShadow: isMobile ? '0 1px 0 rgba(0,0,0,0.04)' : 'none',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        background: isMobile ? 'transparent' : C.headerBg,
        borderBottom: isMobile ? `1px solid ${C.iosSeparator}` : 'none',
      }}>
        {DaysHeader.map((d, i) => (
          <div key={i} style={{
            color: isMobile ? C.iosSecondaryText : 'white',
            fontSize: isMobile ? 11 : 12,
            fontWeight: isMobile ? 600 : 400,
            padding: '8px 0',
            textAlign: 'center',
            letterSpacing: isMobile ? 0.5 : 0.3,
            textTransform: isMobile ? 'uppercase' : 'none',
          }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {weeks.flat().map((d, i) => isMobile ? (
          <MobileDayCell
            key={i} date={d} currentMonth={month} state={state}
            isSelected={selected && fmtDate(d) === selected}
            onTap={() => setSelected(fmtDate(d))}
          />
        ) : (
          <DesktopDayCell key={i} date={d} currentMonth={month} state={state} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DÉTAIL D'UN JOUR (mobile)
// ============================================================
function DayDetail({ dateStr, state, currentMonth }) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const info = getDayInfo(date, currentMonth, state);
  const hasContent = info.badges.length > 0 || info.isHoliday || info.vacActive;

  return (
    <div style={{
      background: C.iosCard,
      borderRadius: 14,
      padding: 16,
      boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        color: C.iosSecondaryText, textTransform: 'uppercase', marginBottom: 8,
      }}>
        {fmtFrLong(dateStr)}
      </div>

      {!hasContent && (
        <div style={{ color: C.iosSecondaryText, fontSize: 14, padding: '8px 0' }}>
          Rien de prévu.
        </div>
      )}

      {info.isHoliday && (
        <DetailRow color={C.textLabel} label={HOLIDAYS[info.dateStr]} sub="Jour férié" />
      )}
      {info.vacActive && (
        <DetailRow
          color={C.textVacLabel}
          label={info.vac.label}
          sub={`Vacances · ${fmtFr(info.vac.start)}${info.vac.start !== info.vac.end ? ` → ${fmtFr(info.vac.end)}` : ''}`}
        />
      )}
      {info.badges.map((b, i) => (
        <DetailRow
          key={i}
          color={b.color}
          label={b.label}
          sub={b.kind === 'stage' ? 'Stage' : (b.eventColor === 'blue' ? 'Moment important' : 'Fac')}
        />
      ))}
    </div>
  );
}

function DetailRow({ color, label, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${C.iosSeparator}`,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: '#111', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.iosSecondaryText, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

// ============================================================
// LISTE COMPLÈTE
// ============================================================
function ListSheet({ state, setState, onClose, isMobile }) {
  const del = (kind, id) => {
    setState(s => {
      if (kind === 'event') return { ...s, events: s.events.filter(e => e.id !== id) };
      if (kind === 'vac') return { ...s, userVacations: s.userVacations.filter(v => v.id !== id) };
      return s;
    });
  };

  const content = (
    <div style={{ padding: 20, fontSize: 13, color: '#222' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111', margin: 0 }}>Tout afficher</h3>
        <button onClick={onClose} style={{
          background: '#eee', border: 'none', cursor: 'pointer',
          width: 30, height: 30, borderRadius: 15, display: 'grid', placeItems: 'center', color: '#666',
        }}>
          <X size={16} />
        </button>
      </div>

      <Section title={`Événements (${state.events.length})`}>
        {state.events.length === 0 && <Empty />}
        {state.events.map(e => (
          <ListRow key={e.id}
            dot={e.color === 'blue' ? C.eventBlue : C.eventRed}
            label={e.label} sub={fmtFr(e.date)}
            onDelete={() => del('event', e.id)}
          />
        ))}
      </Section>

      <Section title={`Vacances (${state.userVacations.length})`}>
        {state.userVacations.length === 0 && <Empty />}
        {state.userVacations.map(v => (
          <ListRow key={v.id}
            dot={C.bgUserVac} ring={C.textVacLabel}
            label={v.label}
            sub={`${fmtFr(v.start)}${v.start !== v.end ? ` → ${fmtFr(v.end)}` : ''}`}
            onDelete={() => del('vac', v.id)}
          />
        ))}
      </Section>

      <Section title="Fin des stages">
        <div style={{ padding: '4px 0', color: '#333' }}>
          {fmtFr(state.stageEndDate)}/{state.stageEndDate.slice(0, 4)}
        </div>
      </Section>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.35)',
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background: C.iosCard, width: '100%', maxHeight: '85vh',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}>
          <div style={{ display: 'grid', placeItems: 'center', paddingTop: 8 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd' }} />
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 320, background: C.iosCard, borderLeft: `1px solid ${C.grid}`, overflowY: 'auto' }}>
      {content}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h4 style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6,
        color: C.iosSecondaryText, marginBottom: 8, fontWeight: 600,
      }}>{title}</h4>
      {children}
    </section>
  );
}

function Empty() {
  return <p style={{ color: '#bbb', fontSize: 13, margin: '6px 0' }}>Aucun</p>;
}

function ListRow({ dot, ring, label, sub, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${C.iosSeparator}`,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: dot,
        border: ring ? `1px solid ${ring}` : 'none',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: '#111', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.iosSecondaryText, marginTop: 1 }}>{sub}</div>
      </div>
      <button onClick={onDelete} style={{
        background: '#f5f5f5', border: 'none', cursor: 'pointer',
        width: 30, height: 30, borderRadius: 15, display: 'grid', placeItems: 'center', color: '#999',
      }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ============================================================
// APPEL À NOTRE API BACKEND (pas directement Gemini)
// ============================================================
async function callAI(userInput) {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction: userInput }),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`HTTP ${response.status}: ${txt}`);
  }
  return response.json();
}

function applyActions(state, actions) {
  let s = {
    ...state,
    events: [...state.events],
    userVacations: [...state.userVacations],
    stageVacations: { ...state.stageVacations },
  };
  const norm = str => (str || '').toLowerCase().trim();

  for (const a of actions || []) {
    switch (a.type) {
      case 'add_event':
        s.events.push({ id: uid('e'), date: a.date, label: a.label, color: a.color === 'blue' ? 'blue' : 'red' });
        break;
      case 'remove_event':
        s.events = s.events.filter(e => !(e.date === a.date && (!a.label || norm(e.label) === norm(a.label))));
        break;
      case 'remove_event_by_label':
        s.events = s.events.filter(e => !norm(e.label).includes(norm(a.label)));
        break;
      case 'add_vacation':
        s.userVacations.push({
          id: uid('v'), start: a.start, end: a.end || a.start,
          label: a.label, includeWeekend: a.include_weekend !== false,
        });
        break;
      case 'remove_vacation_by_label':
        s.userVacations = s.userVacations.filter(v => !norm(v.label).includes(norm(a.label)));
        break;
      case 'set_stage_end':
        s.stageEndDate = a.date;
        break;
      case 'add_stage_vacation':
        if (s.stageVacations[a.doctor]) {
          s.stageVacations[a.doctor] = [...s.stageVacations[a.doctor], { start: a.start, end: a.end || a.start }];
        }
        break;
      case 'clear_stage_vacations':
        if (s.stageVacations[a.doctor]) s.stageVacations[a.doctor] = [];
        break;
    }
  }
  return s;
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const isMobile = useIsMobile();
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (e) {}
    return DEFAULT_STATE;
  });
  const [history, setHistory] = useState([]);
  const [month, setMonth] = useState(5);
  const year = 2026;
  const [selected, setSelected] = useState(null);

  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  useEffect(() => {
    if (isMobile && !selected) setSelected(`${year}-${pad(month)}-01`);
  }, [isMobile, month, selected, year]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || processing) return;
    setProcessing(true);
    setFeedback(null);
    try {
      const result = await callAI(text);
      const newState = applyActions(state, result.actions);
      setHistory(h => [{ prevState: state, instruction: text, feedback: result.feedback }, ...h].slice(0, 20));
      setState(newState);
      setFeedback({ type: 'ok', text: result.feedback || 'Mis à jour.' });
      setInput('');
    } catch (e) {
      setFeedback({ type: 'err', text: `Erreur : ${e.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setState(last.prevState);
    setHistory(rest);
    setFeedback({ type: 'ok', text: 'Annulé.' });
  };

  const monthChange = (delta) => {
    let m = month + delta;
    if (m < 5) m = 12;
    if (m > 12) m = 5;
    setMonth(m);
    if (isMobile) setSelected(`${year}-${pad(m)}-01`);
  };

  const counts = useMemo(() => {
    const dStart = new Date(2026, 4, 1);
    const dEnd = new Date(state.stageEndDate);
    const out = { 'Le Bris': 0, 'Montalvo': 0, 'Andro': 0 };
    const cur = new Date(dStart);
    while (cur <= dEnd) {
      const wd = mondayIdx(cur);
      const ds = fmtDate(cur);
      const stage = STAGES[wd];
      if (stage && !HOLIDAYS[ds]) {
        const onVac = state.userVacations.some(v => ds >= v.start && ds <= v.end);
        const onDocVac = (state.stageVacations[stage.doctor] || []).some(p => ds >= p.start && ds <= p.end);
        if (!onVac && !onDocVac) out[stage.doctor]++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [state]);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#111',
      minHeight: '100vh',
      background: isMobile ? C.iosBg : '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: isMobile ? 'env(safe-area-inset-top, 0)' : 0,
    }}>
      {/* HEADER */}
      <header style={{
        padding: isMobile ? '12px 16px 10px' : '16px 24px',
        background: isMobile ? C.iosBg : 'white',
        borderBottom: isMobile ? 'none' : `1px solid ${C.grid}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: isMobile ? 8 : 0,
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 22 : 18,
              fontWeight: isMobile ? 700 : 500,
              color: '#111',
              letterSpacing: isMobile ? -0.4 : 0.3,
            }}>
              {isMobile ? `${FR_MONTHS[month - 1]}` : 'Planning 2026'}
            </h1>
            {!isMobile && (
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>
                Stages · Fac · Vacances · Moments importants
              </p>
            )}
            {isMobile && (
              <p style={{ margin: 0, fontSize: 14, color: C.iosSecondaryText, fontWeight: 400 }}>{year}</p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
            {!isMobile && (
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                style={{
                  padding: '6px 12px', fontSize: 14, border: `1px solid ${C.grid}`,
                  borderRadius: 6, background: 'white', color: '#333', minWidth: 140, fontWeight: 500,
                }}
              >
                {[5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{FR_MONTHS[m - 1]} {year}</option>
                ))}
              </select>
            )}

            <IconButton onClick={undo} disabled={history.length === 0} title="Annuler" iconColor={C.iosBlue} mobile={isMobile}>
              <RotateCcw size={isMobile ? 18 : 15} />
            </IconButton>
            <IconButton onClick={() => setShowSheet(true)} title="Tout afficher" iconColor={C.iosBlue} mobile={isMobile}>
              <List size={isMobile ? 19 : 16} />
            </IconButton>
          </div>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <button onClick={() => monthChange(-1)} style={navBtn}>
              <ChevronLeft size={20} /> {FR_MONTHS[(month - 2 + 12) % 12 || 11]}
            </button>
            <button onClick={() => monthChange(1)} style={navBtn}>
              {FR_MONTHS[month % 12]} <ChevronRight size={20} />
            </button>
          </div>
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          flex: 1, overflow: 'auto',
          padding: isMobile ? '12px 12px 16px' : 24,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => monthChange(-1)} style={btnDesktop}>
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ margin: 0, fontSize: 22, color: C.textTitle, fontWeight: 400 }}>
                {FR_MONTHS[month - 1]} {year}
              </h2>
              <button onClick={() => monthChange(1)} style={btnDesktop}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <MonthGrid
            year={year} month={month} state={state} isMobile={isMobile}
            selected={selected} setSelected={setSelected}
          />

          {isMobile && selected && (
            <DayDetail dateStr={selected} state={state} currentMonth={month} />
          )}

          {month <= 11 && (
            <div style={{
              padding: isMobile ? '12px 16px' : '0',
              background: isMobile ? C.iosCard : 'transparent',
              borderRadius: isMobile ? 14 : 0,
              fontSize: isMobile ? 13 : 11,
              color: isMobile ? '#333' : '#888',
              display: 'flex', flexWrap: 'wrap', gap: isMobile ? 10 : 16, alignItems: 'center',
            }}>
              <span style={{ color: C.iosSecondaryText, fontWeight: isMobile ? 500 : 400 }}>
                Stages jusqu'au {state.stageEndDate.split('-').slice(1).reverse().join('/')}
              </span>
              <span><Dot color="#A8895F" /> {counts['Le Bris']}</span>
              <span><Dot color="#73A56B" /> {counts.Montalvo}</span>
              <span><Dot color="#CC809D" /> {counts.Andro}</span>
              <span style={{ marginLeft: isMobile ? 0 : 'auto', color: C.iosSecondaryText }}>
                Total : {counts['Le Bris'] + counts.Montalvo + counts.Andro}
              </span>
            </div>
          )}
        </div>

        {!isMobile && showSheet && (
          <ListSheet state={state} setState={setState} onClose={() => setShowSheet(false)} isMobile={false} />
        )}
      </main>

      {isMobile && showSheet && (
        <ListSheet state={state} setState={setState} onClose={() => setShowSheet(false)} isMobile={true} />
      )}

      <footer style={{
        background: C.iosCard,
        borderTop: `1px solid ${isMobile ? C.iosSeparator : C.grid}`,
        padding: isMobile ? '10px 12px' : 16,
        paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom, 0px))' : 16,
        position: 'sticky', bottom: 0, zIndex: 5,
      }}>
        {feedback && (
          <div style={{
            marginBottom: 10, padding: '8px 12px', borderRadius: 10, fontSize: 13,
            background: feedback.type === 'ok' ? '#E8F5E9' : '#FFEBEE',
            color: feedback.type === 'ok' ? '#1B5E20' : '#B71C1C',
          }}>
            {feedback.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={processing}
            placeholder={isMobile ? "vacs 12/12 : Anyma" : 'Ex : "fac le 18/06 : GEAPT" · "vacs du 1 au 6 juillet : Les Ardentes"'}
            rows={1}
            style={{
              flex: 1, resize: 'none',
              border: `1px solid ${C.grid}`, borderRadius: 18,
              padding: isMobile ? '10px 16px' : '12px 14px',
              fontSize: 16,
              fontFamily: 'inherit', outline: 'none', color: '#111',
              maxHeight: 120, background: isMobile ? C.iosBg : 'white',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || processing}
            style={{
              height: 40, width: 40, borderRadius: 20,
              background: !input.trim() || processing ? '#D1D1D6' : C.iosBlue,
              color: 'white', border: 'none',
              cursor: !input.trim() || processing ? 'not-allowed' : 'pointer',
              display: 'grid', placeItems: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </footer>
    </div>
  );
}

function IconButton({ children, onClick, disabled, title, iconColor, mobile }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        background: 'transparent', border: 'none', borderRadius: mobile ? 8 : 6,
        width: mobile ? 38 : 32, height: mobile ? 38 : 32,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'grid', placeItems: 'center',
        color: disabled ? '#ccc' : iconColor,
        WebkitTapHighlightColor: 'transparent',
      }}
    >{children}</button>
  );
}

function Dot({ color }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 4, verticalAlign: 'baseline',
    }} />
  );
}

const btnDesktop = {
  background: 'white', border: `1px solid ${C.grid}`, borderRadius: 6,
  width: 32, height: 32, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#555',
};

const navBtn = {
  background: 'transparent', border: 'none', color: C.iosBlue, padding: '6px 4px',
  display: 'flex', alignItems: 'center', gap: 2, fontSize: 15, cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent', fontWeight: 500,
};
