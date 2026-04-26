import React, { useState, useRef, useEffect } from 'react';
import Card from './Card.jsx';

const CARD_TYPES = ['profession', 'health', 'biology', 'fact', 'hobby', 'baggage'];
const CARD_LABELS = {
  profession: 'Профессия',
  health:     'Здоровье',
  biology:    'Биология',
  fact:       'Факт',
  hobby:      'Хобби',
  baggage:    'Багаж',
};

export default function GameScreen({
  players, playerId, isHost, isAlive,
  myCards, catastrophe, round, survivorsTarget,
  timer, timerPhase, forceVote, messages,
  onOpenCard, onForceVoting, onSendChat,
}) {
  const [chatInput, setChatInput] = useState('');
  const [showCat, setShowCat]     = useState(true);
  const chatRef  = useRef(null);
  const inputRef = useRef(null);

  const me              = players.find(p => p.id === playerId);
  const openedThisRound = me?.cardsOpenedThisRound ?? 0;
  const alivePlayers    = players.filter(p => p.status === 'alive');
  const deadPlayers     = players.filter(p => p.status !== 'alive');
  const urgentTimer     = timer !== null && timer <= 20;
  const forceNeeded     = forceVote?.needed || 0;
  const forceCount      = forceVote?.count  || 0;
  const iForceVoted     = forceVote?.requesters?.includes(playerId);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => setShowCat(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const sendChat = () => {
    const txt = chatInput.trim();
    if (!txt || !isAlive) return;
    onSendChat(txt);
    setChatInput('');
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const fmt = (s) => {
    if (s === null || s === undefined) return '--:--';
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };

  // ─── СПЛЭШ КАТАСТРОФЫ ────────────────────────────────
  if (showCat && catastrophe) {
    return (
      <div style={sp.root} onClick={() => setShowCat(false)}>
        <div style={sp.box} className="slide-up">
          <span style={sp.icon}>{catastrophe.icon}</span>
          <div style={sp.label}>КАТАСТРОФА</div>
          <h2 style={sp.name}>{catastrophe.name}</h2>
          <p style={sp.tagline}>«{catastrophe.tagline}»</p>
          <p style={sp.desc}>{catastrophe.description}</p>
          <div style={sp.conds}>
            {(catastrophe.conditions || []).map((c, i) => (
              <div key={i} style={sp.cond}>
                <span style={{ color: 'var(--amber)', flexShrink: 0 }}>▶</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div style={sp.hint}>Нажми чтобы продолжить</div>
        </div>
      </div>
    );
  }

  // ─── ОСНОВНОЙ ЭКРАН ───────────────────────────────────
  return (
    <div style={s.root}>

      {/* ══ ШАПКА ══ */}
      <div style={s.bar}>
        <div style={s.barCell}>
          <span style={s.barSmall}>РАУНД</span>
          <span style={s.barBig}>{round}</span>
        </div>

        <div style={s.barMid}>
          <div className={`timer-ring ${urgentTimer ? 'urgent' : ''}`}>{fmt(timer)}</div>
          <div style={s.barPhase}>
            {timerPhase === 'discussion' ? 'ОБСУЖДЕНИЕ' : timerPhase === 'voting' ? 'ГОЛОСОВАНИЕ' : ''}
          </div>
        </div>

        <div style={{ ...s.barCell, alignItems: 'flex-end' }}>
          <span style={s.barSmall}>ВЫЖИВЁТ</span>
          <span style={{ ...s.barBig, color: 'var(--green)' }}>{survivorsTarget}</span>
        </div>
      </div>

      {/* ══ СУББАР ══ */}
      <div style={s.subBar}>
        {catastrophe && (
          <button style={s.catChip} onClick={() => setShowCat(true)}>
            {catastrophe.icon}
            <span style={s.catChipText}>{catastrophe.name}</span>
          </button>
        )}
        <div style={s.subBarRight}>
          <span style={s.subBarStat}>
            <span style={{ color: 'var(--green)' }}>●</span> {alivePlayers.length} живых
          </span>
          {deadPlayers.length > 0 && (
            <span style={s.subBarStat}>
              <span style={{ color: 'var(--red)' }}>✕</span> {deadPlayers.length} выбыли
            </span>
          )}
        </div>
      </div>

      {/* ══ ТЕЛО ══ */}
      <div style={s.body}>

        {/* ── МОИ КАРТЫ ── */}
        {myCards && (
          <div style={s.panel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>МОИ КАРТЫ</span>
              <span style={s.panelMeta}>
                {openedThisRound}/2 открыто в раунде
                {openedThisRound >= 2 && (
                  <span style={{ color: 'var(--red)', marginLeft: 8 }}>лимит исчерпан</span>
                )}
              </span>
            </div>
            {/* 6 карт в ряд — занимают всю ширину */}
            <div style={s.cardsRow}>
              {CARD_TYPES.map(type => {
                const isRevealed = !!(me?.openedCards?.[type]);
                const canReveal  = isAlive && !isRevealed && openedThisRound < 2;
                return (
                  <div key={type} style={s.cardCell}>
                    <Card
                      type={type}
                      value={myCards[type]}
                      isRevealed={isRevealed}
                      showOwner={true}
                      canReveal={canReveal}
                      onReveal={onOpenCard}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── НИЖНЯЯ СЕТКА: игроки + чат ── */}
        <div style={s.grid2}>

          {/* ИГРОКИ */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>ЖИВЫЕ — {alivePlayers.length}</span>
            </div>

            <div style={s.playersList}>
              {alivePlayers.map(p => {
                const isMe = p.id === playerId;
                return (
                  <div key={p.id} style={{
                    ...s.pRow,
                    borderColor: isMe ? 'var(--amber)' : 'var(--border)',
                    background:  isMe ? 'var(--amber-glow)' : 'transparent',
                  }}>
                    <div style={s.pTop}>
                      <span style={{
                        ...s.pName,
                        color: isMe ? 'var(--amber)' : 'var(--text-bright)',
                      }}>
                        {p.name}
                        {isMe && <span style={s.meTag}> (вы)</span>}
                      </span>
                      <span style={s.pCount}>{p.cardsOpenedThisRound ?? 0}/2</span>
                    </div>
                    {Object.entries(p.openedCards || {}).length > 0 && (
                      <div style={s.pPills}>
                        {Object.entries(p.openedCards).map(([type, val]) => (
                          <span key={type} style={s.pPill}>
                            {CARD_LABELS[type]}: <b>{val?.name}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Выбывшие */}
            {deadPlayers.length > 0 && (
              <div style={s.deadList}>
                <span style={{ ...s.panelTitle, color: 'var(--red)', marginBottom: 4 }}>
                  ВЫБЫЛИ
                </span>
                {deadPlayers.map(p => (
                  <span key={p.id} style={s.deadPill}>✕ {p.name}</span>
                ))}
              </div>
            )}

            {/* Принудительное голосование */}
            {isAlive && (
              <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                <button
                  className={iForceVoted ? 'btn-ghost' : 'btn-danger'}
                  style={s.forceBtn}
                  onClick={onForceVoting}
                  disabled={iForceVoted}
                >
                  {iForceVoted
                    ? `✓ ЗА ГОЛОСОВАНИЕ  ${forceCount} / ${forceNeeded}`
                    : `⚡ НАЧАТЬ ГОЛОСОВАНИЕ  ${forceCount} / ${forceNeeded}`}
                </button>
              </div>
            )}
          </div>

          {/* ЧАТ */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>ЧАТ</span>
              {!isAlive && <span style={s.spectTag}>ТОЛЬКО ЧТЕНИЕ</span>}
            </div>

            <div ref={chatRef} style={s.chatBox}>
              {messages.length === 0 && (
                <span style={s.chatEmpty}>Пока тихо… начните обсуждение</span>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{
                  ...s.chatMsg,
                  background: msg.playerId === playerId
                    ? 'rgba(240,165,0,0.07)' : 'transparent',
                }}>
                  <span style={s.chatName}>{msg.playerName}</span>
                  <span style={s.chatText}>{msg.text}</span>
                </div>
              ))}
            </div>

            {isAlive && (
              <div style={s.chatRow}>
                <input
                  ref={inputRef}
                  style={s.chatInput}
                  placeholder="Сообщение…"
                  value={chatInput}
                  maxLength={280}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={onKey}
                />
                <button
                  className="btn-primary"
                  style={s.chatSend}
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                >▶</button>
              </div>
            )}
          </div>

        </div>{/* /grid2 */}
      </div>{/* /body */}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  СТИЛИ
// ══════════════════════════════════════════════════════

const sp = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.93)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backdropFilter: 'blur(4px)',
  },
  box: {
    maxWidth: 460, width: '90%',
    background: 'var(--surface)', border: '1px solid var(--amber)',
    padding: '36px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    textAlign: 'center',
  },
  icon:    { fontSize: 52, lineHeight: 1 },
  label:   { fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-dim)' },
  name:    { fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em', textShadow: '0 0 30px rgba(240,165,0,0.5)' },
  tagline: { fontFamily: 'var(--font-mono)', fontSize: 13, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.5 },
  desc:    { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 },
  conds:   { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  cond: {
    display: 'flex', gap: 8, textAlign: 'left',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '7px 10px',
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
  },
  hint: { marginTop: 6, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' },
};

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg)', overflow: 'auto',
  },

  // шапка
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px',
    background: 'var(--surface)',
    borderBottom: '2px solid var(--amber)',
    flexShrink: 0,
  },
  barCell:  { display: 'flex', flexDirection: 'column', minWidth: 60 },
  barSmall: { fontFamily: 'var(--font-head)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--text-dim)' },
  barBig:   { fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text-bright)', lineHeight: 1 },
  barMid:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  barPhase: { fontFamily: 'var(--font-head)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-dim)' },

  // суббар
  subBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 20px',
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  catChip: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'var(--amber-glow)', border: '1px solid var(--amber-dim)',
    padding: '4px 12px', cursor: 'pointer',
  },
  catChipText: { fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--amber)' },
  subBarRight: { display: 'flex', gap: 16 },
  subBarStat:  { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 },

  // тело
  body: {
    flex: 1, padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },

  // панель
  panel: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '0.22em', color: 'var(--text-dim)' },
  panelMeta:  { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' },

  // карты — 6 в ряд, высота фиксирована
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 10,
  },
  cardCell: {
    // Поддерживаем пропорцию 130:180 ≈ 0.72
    position: 'relative',
    paddingBottom: '138.5%',   // 180/130 * 100
    height: 0,
  },

  // нижняя сетка
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    alignItems: 'start',
  },

  // список игроков
  playersList: { display: 'flex', flexDirection: 'column', gap: 6 },
  pRow: {
    border: '1px solid', padding: '8px 10px',
    display: 'flex', flexDirection: 'column', gap: 4,
    transition: 'border-color 0.2s',
  },
  pTop:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pName: { fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em' },
  meTag: { color: 'var(--text-dim)', fontSize: 11, fontWeight: 400 },
  pCount:{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' },
  pPills:{ display: 'flex', flexWrap: 'wrap', gap: 4 },
  pPill: {
    fontFamily: 'var(--font-mono)', fontSize: 10,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '2px 6px', color: 'var(--text)',
  },

  // выбывшие
  deadList: { display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 },
  deadPill: {
    background: 'rgba(221,51,68,0.07)', border: '1px solid var(--red-dim)',
    color: 'var(--text-dim)', fontFamily: 'var(--font-head)', fontSize: 12,
    padding: '3px 10px', textDecoration: 'line-through', display: 'inline-flex',
    alignSelf: 'flex-start',
  },

  // форс голосование
  forceBtn: { width: '100%', padding: '9px', fontSize: 11, letterSpacing: '0.06em', borderRadius: 0 },

  // чат
  chatBox: {
    flex: 1, minHeight: 160, maxHeight: 260,
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4,
  },
  chatEmpty: {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    color: 'var(--text-dim)', fontStyle: 'italic', padding: '8px 0',
  },
  chatMsg: {
    display: 'flex', gap: 8, alignItems: 'baseline',
    padding: '3px 5px',
  },
  chatName: {
    fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700,
    color: 'var(--amber)', flexShrink: 0, letterSpacing: '0.04em',
  },
  chatText: {
    fontFamily: 'var(--font-mono)', fontSize: 13,
    color: 'var(--text)', lineHeight: 1.4, wordBreak: 'break-word',
  },
  chatRow:   { display: 'flex', gap: 6 },
  chatInput: { flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 0 },
  chatSend:  { padding: '7px 14px', fontSize: 14, borderRadius: 0, flexShrink: 0 },

  spectTag: {
    fontFamily: 'var(--font-head)', fontSize: 10,
    letterSpacing: '0.15em', color: 'var(--red)',
    border: '1px solid var(--red-dim)', padding: '2px 8px',
  },
};
