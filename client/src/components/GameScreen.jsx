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
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const me           = players.find(p => p.id === playerId);
  const openedThisRound = me?.cardsOpenedThisRound ?? 0;
  const alivePlayers = players.filter(p => p.status === 'alive');
  const deadPlayers  = players.filter(p => p.status !== 'alive');

  const urgentTimer  = timer !== null && timer <= 20;
  const forceNeeded  = forceVote?.needed || 0;
  const forceCount   = forceVote?.count  || 0;
  const iForceVoted  = forceVote?.requesters?.includes(playerId);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
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

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const formatTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ─── СПЛЭШ КАТАСТРОФЫ ──────────────────────────────
  if (showCat && catastrophe) {
    return (
      <div style={s.catSplash} onClick={() => setShowCat(false)}>
        <div style={s.catContent} className="slide-up">
          <span style={s.catIcon}>{catastrophe.icon}</span>
          <div style={s.catLabel}>КАТАСТРОФА</div>
          <h2 style={s.catName}>{catastrophe.name}</h2>
          <p style={s.catTagline}>«{catastrophe.tagline}»</p>
          <p style={s.catDesc}>{catastrophe.description}</p>
          <div style={s.catConditions}>
            {(catastrophe.conditions || []).map((c, i) => (
              <div key={i} style={s.catCond}>
                <span style={s.catCondBullet}>▶</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div style={s.catHint}>Нажми чтобы продолжить</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* ─── ШАПКА ─── */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <span style={s.roundLabel}>РАУНД</span>
          <span style={s.roundNum}>{round}</span>
        </div>

        <div style={s.timerBlock}>
          <div className={`timer-ring ${urgentTimer ? 'urgent' : ''}`}>
            {formatTime(timer)}
          </div>
          <div style={s.timerPhase}>
            {timerPhase === 'discussion' ? 'ОБСУЖДЕНИЕ' : timerPhase === 'voting' ? 'ГОЛОСОВАНИЕ' : ''}
          </div>
        </div>

        <div style={s.topRight}>
          <span style={s.survivorLabel}>ВЫЖИВЁТ</span>
          <span style={s.survivorNum}>{survivorsTarget}</span>
        </div>
      </div>

      {/* ─── КАТАСТРОФА BADGE ─── */}
      {catastrophe && (
        <button style={s.catBadge} onClick={() => setShowCat(true)}>
          <span>{catastrophe.icon}</span>
          <span style={s.catBadgeText}>{catastrophe.name}</span>
        </button>
      )}

      {/* ─── ОСНОВНАЯ ПАНЕЛЬ ─── */}
      <div style={s.main}>
        {/* ЛЕВАЯ: Мои карты + игроки */}
        <div style={s.leftCol}>
          {/* Мои карты */}
          {myCards && (
            <div style={s.panel}>
              <div style={s.panelHead}>
                <span style={s.panelTitle}>МОИ КАРТЫ</span>
                <span style={s.openedTag}>
                  {openedThisRound}/2 открыто в раунде
                </span>
              </div>
              <div style={s.cardsGrid}>
                {CARD_TYPES.map(type => {
                  const isOpen = !!(me?.openedCards?.[type]);
                  const canOpen = isAlive && !isOpen && openedThisRound < 2;
                  return (
                    <div key={type} style={{ height: 180 }}>
                      <Card
                        type={type}
                        value={me?.openedCards?.[type] || myCards[type]}
                        isOpen={isOpen}
                        canOpen={canOpen}
                        onOpen={onOpenCard}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Принудительное голосование */}
          {isAlive && (
            <div style={s.forceVoteBlock}>
              <button
                className={iForceVoted ? 'btn-ghost' : 'btn-danger'}
                style={s.forceBtn}
                onClick={onForceVoting}
                disabled={iForceVoted}
              >
                {iForceVoted ? `✓ ТЫ ПРОГОЛОСОВАЛ ЗА ГОЛОСОВАНИЕ` : '⚡ НАЧАТЬ ГОЛОСОВАНИЕ РАНЬШЕ'}
              </button>
              {forceNeeded > 0 && (
                <span style={s.forceHint}>{forceCount} / {forceNeeded} нужно</span>
              )}
            </div>
          )}
        </div>

        {/* ПРАВАЯ: Список игроков + чат */}
        <div style={s.rightCol}>
          {/* Живые игроки */}
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
                    <div style={s.pLeft}>
                      <span style={{
                        ...s.pName,
                        color: isMe ? 'var(--amber)' : 'var(--text-bright)',
                      }}>
                        {p.name}
                        {isMe && <span style={s.meTag}> (вы)</span>}
                      </span>
                      {Object.entries(p.openedCards || {}).length > 0 && (
                        <div style={s.pCards}>
                          {Object.entries(p.openedCards).map(([type, val]) => (
                            <span key={type} style={s.pCardPill}>
                              {CARD_LABELS[type]}: <b>{val?.name}</b>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={s.pRight}>
                      <span style={s.pCardCount}>
                        {p.cardsOpenedThisRound ?? 0}/2
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Выбывшие */}
          {deadPlayers.length > 0 && (
            <div style={s.panel}>
              <div style={s.panelHead}>
                <span style={{ ...s.panelTitle, color: 'var(--red)' }}>
                  ВЫБЫЛИ — {deadPlayers.length}
                </span>
              </div>
              {deadPlayers.map(p => (
                <div key={p.id} style={s.deadRow}>
                  <span style={s.deadIcon}>✕</span>
                  <span style={s.deadName}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Чат */}
          <div style={s.chatPanel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>ЧАТ</span>
              {!isAlive && <span style={s.spectatorTag}>ТОЛЬКО ЧТЕНИЕ</span>}
            </div>
            <div ref={chatRef} style={s.chatMessages}>
              {messages.length === 0 && (
                <span style={s.chatEmpty}>Пока тихо… начните обсуждение</span>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{
                  ...s.chatMsg,
                  background: msg.playerId === playerId ? 'rgba(240,165,0,0.07)' : 'transparent',
                }}>
                  <span style={s.chatName}>{msg.playerName}</span>
                  <span style={s.chatText}>{msg.text}</span>
                </div>
              ))}
            </div>
            {isAlive && (
              <div style={s.chatInputRow}>
                <input
                  ref={inputRef}
                  style={s.chatInput}
                  placeholder="Сообщение…"
                  value={chatInput}
                  maxLength={280}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                />
                <button
                  className="btn-primary"
                  style={s.chatSend}
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ВСТРОЕННЫЕ МЕДИА-ЗАПРОСЫ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ */}
      <style>{`
        @media (max-width: 680px) {
          div[style*="flex: 1"][style*="overflow: auto"] {
            flex-direction: column !important;
          }
          div[style*="borderRight: 1px solid var(--border)"] {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
            width: 100% !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── СТИЛИ ─────────────────────────────────────────────
const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },

  // CAT SPLASH
  catSplash: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  catContent: {
    maxWidth: 480, width: '90%',
    background: 'var(--surface)',
    border: '1px solid var(--amber)',
    padding: '40px 40px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    textAlign: 'center',
  },
  catIcon: { fontSize: 56, lineHeight: 1 },
  catLabel: {
    fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '0.3em',
    color: 'var(--text-dim)',
  },
  catName: {
    fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 700,
    color: 'var(--amber)', letterSpacing: '0.08em',
    textShadow: '0 0 30px rgba(240,165,0,0.5)',
  },
  catTagline: { fontFamily: 'var(--font-mono)', fontSize: 14, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.5 },
  catDesc:    { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 },
  catConditions: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 },
  catCond: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '8px 12px', textAlign: 'left',
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
  },
  catCondBullet: { color: 'var(--amber)', flexShrink: 0 },
  catHint: { marginTop: 8, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' },

  // TOP BAR
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  topLeft:       { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  topRight:      { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  roundLabel:    { fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' },
  roundNum:      { fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--text-bright)', lineHeight: 1 },
  survivorLabel: { fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' },
  survivorNum:   { fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: 'var(--green)', lineHeight: 1 },
  timerBlock:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  timerPhase:    { fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' },

  // CAT BADGE
  catBadge: {
    margin: '8px 20px 0',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--amber-glow)', border: '1px solid var(--amber-dim)',
    padding: '5px 14px', cursor: 'pointer', alignSelf: 'flex-start',
  },
  catBadgeText: { fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: '0.08em', color: 'var(--amber)' },

  // MAIN
  main: {
    display: 'flex',
    flex: 1,
    gap: 0,
    overflow: 'auto',
  },
  leftCol: {
    flex: '1 1 280px',
    minWidth: 240,
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 0,
    overflow: 'auto',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8,
  },
  rightCol: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },

  // PANEL
  panel: {
    borderBottom: '1px solid var(--border)',
    padding: '14px 16px',
  },
  panelHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    fontFamily: 'var(--font-head)', fontSize: 11,
    letterSpacing: '0.22em', color: 'var(--text-dim)', textTransform: 'uppercase',
  },
  openedTag: {
    fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)',
  },

  // FORCE VOTE
  forceVoteBlock: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  forceBtn: { width: '100%', padding: '10px', fontSize: 12, letterSpacing: '0.08em', borderRadius: 0 },
  forceHint: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' },

  // PLAYER LIST
  playersList: { display: 'flex', flexDirection: 'column', gap: 4 },
  pRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '8px 10px', border: '1px solid', gap: 8,
    transition: 'border-color 0.2s',
  },
  pLeft:  { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  pRight: { flexShrink: 0 },
  pName:  { fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, letterSpacing: '0.04em' },
  meTag:  { color: 'var(--text-dim)', fontSize: 11, fontWeight: 400 },
  pCards: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  pCardPill: {
    fontFamily: 'var(--font-mono)', fontSize: 10,
    background: 'var(--surface3)', border: '1px solid var(--border)',
    padding: '2px 6px', color: 'var(--text)',
  },
  pCardCount: {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    color: 'var(--text-dim)',
  },

  // DEAD
  deadRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 10px',
    opacity: 0.5,
  },
  deadIcon: { color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 },
  deadName: { fontFamily: 'var(--font-head)', fontSize: 13, color: 'var(--text-dim)', textDecoration: 'line-through' },

  // CHAT
  chatPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    padding: '14px 16px',
    minHeight: 200,
  },
  chatMessages: {
    flex: 1, overflow: 'auto',
    display: 'flex', flexDirection: 'column', gap: 2,
    marginBottom: 8,
    paddingRight: 4,
  },
  chatEmpty: {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    color: 'var(--text-dim)', fontStyle: 'italic',
    padding: '12px 0',
  },
  chatMsg: {
    display: 'flex', gap: 8, alignItems: 'baseline',
    padding: '4px 6px',
  },
  chatName: {
    fontFamily: 'var(--font-head)', fontSize: 12,
    fontWeight: 700, color: 'var(--amber)',
    flexShrink: 0, letterSpacing: '0.04em',
  },
  chatText: {
    fontFamily: 'var(--font-mono)', fontSize: 13,
    color: 'var(--text)', lineHeight: 1.4, wordBreak: 'break-word',
  },
  chatInputRow: { display: 'flex', gap: 6, flexShrink: 0 },
  chatInput: { flex: 1, fontSize: 13, padding: '8px 12px', borderRadius: 0 },
  chatSend: { padding: '8px 16px', fontSize: 14, borderRadius: 0, flexShrink: 0 },
  spectatorTag: {
    fontFamily: 'var(--font-head)', fontSize: 10,
    letterSpacing: '0.15em', color: 'var(--red)',
    border: '1px solid var(--red-dim)', padding: '2px 8px',
  },
};