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

  // ─── СПЛЭШ ───────────────────────────────────────────
  if (showCat && catastrophe) {
    return (
      <>
        <style>{CSS}</style>
        <div className="gs-splash" onClick={() => setShowCat(false)}>
          <div className="gs-splash-box slide-up">
            <span className="gs-splash-icon">{catastrophe.icon}</span>
            <div className="gs-splash-label">КАТАСТРОФА</div>
            <h2 className="gs-splash-name">{catastrophe.name}</h2>
            <p className="gs-splash-tagline">«{catastrophe.tagline}»</p>
            <p className="gs-splash-desc">{catastrophe.description}</p>
            <div className="gs-splash-conds">
              {(catastrophe.conditions || []).map((c, i) => (
                <div key={i} className="gs-splash-cond">
                  <span style={{ color: 'var(--amber)', flexShrink: 0 }}>▶</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <div className="gs-splash-hint">Нажми чтобы продолжить</div>
          </div>
        </div>
      </>
    );
  }

  // ─── ОСНОВНОЙ ЭКРАН ──────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="gs-root">

        {/* ШАПКА */}
        <div className="gs-bar">
          <div className="gs-bar-cell">
            <span className="gs-bar-small">РАУНД</span>
            <span className="gs-bar-big">{round}</span>
          </div>
          <div className="gs-bar-mid">
            <div className={`timer-ring${urgentTimer ? ' urgent' : ''}`}>{fmt(timer)}</div>
            <div className="gs-bar-phase">
              {timerPhase === 'discussion' ? 'ОБСУЖДЕНИЕ'
               : timerPhase === 'voting'   ? 'ГОЛОСОВАНИЕ' : ''}
            </div>
          </div>
          <div className="gs-bar-cell gs-bar-cell--right">
            <span className="gs-bar-small">ВЫЖИВЁТ</span>
            <span className="gs-bar-big gs-bar-big--green">{survivorsTarget}</span>
          </div>
        </div>

        {/* СУББАР */}
        <div className="gs-subbar">
          {catastrophe && (
            <button className="gs-cat-chip" onClick={() => setShowCat(true)}>
              {catastrophe.icon}
              <span className="gs-cat-chip-text">{catastrophe.name}</span>
            </button>
          )}
          <div className="gs-subbar-stats">
            <span className="gs-stat gs-stat--green">● {alivePlayers.length} живых</span>
            {deadPlayers.length > 0 && (
              <span className="gs-stat gs-stat--red">✕ {deadPlayers.length} выбыли</span>
            )}
          </div>
        </div>

        {/* ТЕЛО */}
        <div className="gs-body">

          {/* МОИ КАРТЫ */}
          {myCards && (
            <div className="gs-panel">
              <div className="gs-panel-head">
                <span className="gs-panel-title">МОИ КАРТЫ</span>
                <span className="gs-panel-meta">
                  {openedThisRound}/2 открыто
                  {openedThisRound >= 2 && <span className="gs-limit"> · лимит</span>}
                </span>
              </div>
              <div className="gs-cards-grid">
                {CARD_TYPES.map(type => {
                  const isRevealed = !!(me?.openedCards?.[type]);
                  const canReveal  = isAlive && !isRevealed && openedThisRound < 2;
                  return (
                    <div key={type} className="gs-card-cell">
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

          {/* НИЖНЯЯ СЕТКА */}
          <div className="gs-bottom">

            {/* ИГРОКИ */}
            <div className="gs-panel">
              <div className="gs-panel-head">
                <span className="gs-panel-title">ЖИВЫЕ — {alivePlayers.length}</span>
              </div>

              <div className="gs-players">
                {alivePlayers.map(p => {
                  const isMe = p.id === playerId;
                  return (
                    <div key={p.id}
                      className={`gs-player-row${isMe ? ' gs-player-row--me' : ''}`}
                    >
                      <div className="gs-player-top">
                        <span className={`gs-player-name${isMe ? ' gs-player-name--me' : ''}`}>
                          {p.name}
                          {isMe && <span className="gs-me-tag"> (вы)</span>}
                        </span>
                        <span className="gs-player-count">{p.cardsOpenedThisRound ?? 0}/2</span>
                      </div>
                      {Object.entries(p.openedCards || {}).length > 0 && (
                        <div className="gs-player-pills">
                          {Object.entries(p.openedCards).map(([type, val]) => (
                            <div key={type} className="gs-pill-full">
                              <div className="gs-pill-title">{CARD_LABELS[type]}: <b>{val?.name}</b></div>
                              {val?.note && <div className="gs-pill-note">{val.note}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {deadPlayers.length > 0 && (
                <div className="gs-dead-list">
                  {deadPlayers.map(p => (
                    <span key={p.id} className="gs-dead-pill">✕ {p.name}</span>
                  ))}
                </div>
              )}

              {isAlive && (
                <div className="gs-force-wrap">
                  <button
                    className={`gs-force-btn${iForceVoted ? ' gs-force-btn--voted' : ''}`}
                    onClick={onForceVoting}
                    disabled={iForceVoted}
                  >
                    {iForceVoted
                      ? `✓ ЗА ГОЛОСОВАНИЕ  ${forceCount}/${forceNeeded}`
                      : `⚡ НАЧАТЬ ГОЛОСОВАНИЕ  ${forceCount}/${forceNeeded}`}
                  </button>
                </div>
              )}
            </div>

            {/* ЧАТ */}
            <div className="gs-panel gs-chat-panel">
              <div className="gs-panel-head">
                <span className="gs-panel-title">ЧАТ</span>
                {!isAlive && <span className="gs-spectator-tag">ТОЛЬКО ЧТЕНИЕ</span>}
              </div>

              <div ref={chatRef} className="gs-chat-messages">
                {messages.length === 0 && (
                  <span className="gs-chat-empty">Пока тихо… начните обсуждение</span>
                )}
                {messages.map(msg => (
                  <div key={msg.id}
                    className={`gs-chat-msg${msg.playerId === playerId ? ' gs-chat-msg--mine' : ''}`}
                  >
                    <span className="gs-chat-name">{msg.playerName}</span>
                    <span className="gs-chat-text">{msg.text}</span>
                  </div>
                ))}
              </div>

              {isAlive && (
                <div className="gs-chat-row">
                  <input
                    ref={inputRef}
                    className="gs-chat-input"
                    placeholder="Сообщение…"
                    value={chatInput}
                    maxLength={280}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={onKey}
                  />
                  <button
                    className="gs-chat-send btn-primary"
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                  >▶</button>
                </div>
              )}
            </div>

          </div>{/* /gs-bottom */}
        </div>{/* /gs-body */}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════
//  CSS (все стили внутри одной строки)
// ══════════════════════════════════════════════════════
const CSS = `
/* ─── ROOT ─── */
.gs-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow-x: hidden;
}

/* ─── ШАПКА ─── */
.gs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 2px solid var(--amber);
  flex-shrink: 0;
}
.gs-bar-cell {
  display: flex;
  flex-direction: column;
  min-width: 50px;
}
.gs-bar-cell--right { align-items: flex-end; }
.gs-bar-small {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
}
.gs-bar-big {
  font-family: var(--font-head);
  font-size: 26px;
  font-weight: 700;
  color: var(--text-bright);
  line-height: 1;
}
.gs-bar-big--green { color: var(--green); }
.gs-bar-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.gs-bar-phase {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--text-dim);
}

/* ─── СУББАР ─── */
.gs-subbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.gs-cat-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--amber-glow);
  border: 1px solid var(--amber-dim);
  padding: 4px 12px;
  cursor: pointer;
}
.gs-cat-chip-text {
  font-family: var(--font-head);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--amber);
}
.gs-subbar-stats { display: flex; gap: 14px; }
.gs-stat {
  font-family: var(--font-mono);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.gs-stat--green { color: var(--text-dim); }
.gs-stat--green span { color: var(--green); }
.gs-stat--red   { color: var(--text-dim); }
.gs-stat--red   span { color: var(--red); }

/* ─── ТЕЛО ─── */
.gs-body {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
}

/* ─── ПАНЕЛЬ ─── */
.gs-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gs-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gs-panel-title {
  font-family: var(--font-head);
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--text-dim);
}
.gs-panel-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--amber);
}
.gs-limit { color: var(--red); }

/* ─── КАРТЫ ─── */
/* Desktop: 6 в ряд */
.gs-cards-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.gs-card-cell {
  height: 200px;
}

/* Tablet: 3 в ряд */
@media (max-width: 900px) {
  .gs-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .gs-card-cell {
    height: 180px;
  }
}

/* Mobile: 3 в ряд, компактнее */
@media (max-width: 600px) {
  .gs-cards-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }
  .gs-card-cell {
    height: 160px;
  }
}

/* Очень узкие телефоны (≤400px) – ещё компактнее */
@media (max-width: 400px) {
  .gs-bar {
    padding: 5px 8px;
  }
  .gs-bar-big {
    font-size: 18px;
  }
  .gs-bar-small {
    font-size: 7px;
  }
  .gs-subbar {
    padding: 4px 8px;
  }
  .gs-cat-chip-text {
    font-size: 9px;
  }
  .gs-stat {
    font-size: 9px;
  }
  .gs-panel {
    padding: 8px 8px;
  }
  .gs-panel-title {
    font-size: 9px;
  }
  .gs-cards-grid {
    gap: 4px;
  }
  .gs-card-cell {
    height: 130px;
  }
  .gs-player-name {
    font-size: 12px;
  }
  .gs-player-count {
    font-size: 9px;
  }
  .gs-chat-name {
    font-size: 10px;
  }
  .gs-chat-text {
    font-size: 11px;
  }
  .gs-chat-input, .gs-chat-send {
    font-size: 11px;
    padding: 5px 6px;
  }
  .gs-force-btn {
    font-size: 9px;
    padding: 6px;
  }
  .gs-dead-pill {
    font-size: 9px;
    padding: 2px 6px;
  }
  .gs-splash-box {
    padding: 20px 16px;
  }
  .gs-splash-name {
    font-size: 24px;
  }
}

/* ─── НИЖНЯЯ СЕТКА ─── */
/* Desktop: два столбца */
.gs-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

/* Mobile: один столбец */
@media (max-width: 700px) {
  .gs-bottom {
    grid-template-columns: 1fr;
  }
}

/* ─── ИГРОКИ ─── */
.gs-players {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gs-player-row {
  border: 1px solid var(--border);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gs-player-row--me {
  border-color: var(--amber);
  background: var(--amber-glow);
}
.gs-player-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gs-player-name {
  font-family: var(--font-head);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-bright);
}
.gs-player-name--me { color: var(--amber); }
.gs-me-tag {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 400;
}
.gs-player-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
}
.gs-player-pills {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Стиль для полной карточки открытой карты */
.gs-pill-full {
  background: var(--surface2);
  border: 1px solid var(--border);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gs-pill-title {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text);
  font-weight: normal;
}
.gs-pill-note {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-dim);
  font-style: italic;
  border-top: 1px dotted var(--border);
  padding-top: 4px;
  margin-top: 2px;
}

/* ─── ВЫБЫВШИЕ ─── */
.gs-dead-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-top: 2px;
}
.gs-dead-pill {
  background: rgba(221,51,68,0.07);
  border: 1px solid var(--red-dim);
  color: var(--text-dim);
  font-family: var(--font-head);
  font-size: 12px;
  padding: 3px 10px;
  text-decoration: line-through;
}

/* ─── ФОРС ─── */
.gs-force-wrap { padding-top: 4px; }
.gs-force-btn {
  width: 100%;
  padding: 9px;
  font-size: 11px;
  letter-spacing: 0.06em;
  border-radius: 0;
  cursor: pointer;
  font-family: var(--font-head);
  background: var(--red);
  color: #fff;
  border: none;
  text-transform: uppercase;
  transition: background 0.15s;
}
.gs-force-btn:hover:not(:disabled) { background: #ff4455; }
.gs-force-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.gs-force-btn--voted {
  background: transparent;
  color: var(--amber);
  border: 1px solid var(--amber-dim);
}

/* ─── ЧАТ ─── */
.gs-chat-panel { min-height: 240px; }
.gs-chat-messages {
  flex: 1;
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 4px;
}

@media (max-width: 700px) {
  .gs-chat-messages {
    max-height: 180px;
  }
}

.gs-chat-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  font-style: italic;
  padding: 8px 0;
}
.gs-chat-msg {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 3px 5px;
}
.gs-chat-msg--mine { background: rgba(240,165,0,0.07); }
.gs-chat-name {
  font-family: var(--font-head);
  font-size: 12px;
  font-weight: 700;
  color: var(--amber);
  flex-shrink: 0;
  letter-spacing: 0.04em;
}
.gs-chat-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
  line-height: 1.4;
  word-break: break-word;
}
.gs-chat-row {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.gs-chat-input {
  flex: 1;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 0;
}
.gs-chat-send {
  padding: 8px 14px;
  font-size: 14px;
  border-radius: 0;
  flex-shrink: 0;
}
.gs-spectator-tag {
  font-family: var(--font-head);
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--red);
  border: 1px solid var(--red-dim);
  padding: 2px 8px;
}

/* ─── СПЛЭШ ─── */
.gs-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.93);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  padding: 16px;
  box-sizing: border-box;
}
.gs-splash-box {
  max-width: 460px;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--amber);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  box-sizing: border-box;
}
.gs-splash-icon  { font-size: 48px; line-height: 1; }
.gs-splash-label {
  font-family: var(--font-head);
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--text-dim);
}
.gs-splash-name {
  font-family: var(--font-head);
  font-size: 30px;
  font-weight: 700;
  color: var(--amber);
  letter-spacing: 0.06em;
  text-shadow: 0 0 30px rgba(240,165,0,0.5);
}
.gs-splash-tagline {
  font-family: var(--font-mono);
  font-size: 13px;
  font-style: italic;
  color: var(--text);
  line-height: 1.5;
}
.gs-splash-desc {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.6;
}
.gs-splash-conds {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gs-splash-cond {
  display: flex;
  gap: 8px;
  text-align: left;
  background: var(--surface2);
  border: 1px solid var(--border);
  padding: 7px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
}
.gs-splash-hint {
  margin-top: 6px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}
`;