import React, { useState } from 'react';

export default function VotingScreen({ players, playerId, isAlive, votes, timer, onVote }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const alivePlayers  = players.filter(p => p.status === 'alive');
  const hasVoted      = votes.hasVoted?.includes(playerId);
  const urgentTimer   = timer !== null && timer <= 20;

  const formatTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };

  const confirmVote = () => {
    if (!selected || hasVoted || !isAlive) return;
    onVote(selected);
    setConfirmed(true);
  };

  const CARD_LABELS = {
    profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
    fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
  };

  return (
    <div style={s.root}>
      {/* Шапка */}
      <div style={s.header}>
        <div style={s.stripe} aria-hidden />
        <div style={s.topRow}>
          <div>
            <span style={s.label}>ГОЛОСОВАНИЕ</span>
            <h2 style={s.title}>КТО ПОКИДАЕТ БУНКЕР?</h2>
          </div>
          <div style={s.timerWrap}>
            <div className={`timer-ring ${urgentTimer ? 'urgent' : ''}`}>
              {formatTime(timer)}
            </div>
            <span style={s.voteCount}>
              Проголосовали: {votes.count} / {votes.total}
            </span>
          </div>
        </div>
        <div style={s.stripe} aria-hidden />
      </div>

      {/* Список для голосования */}
      <div style={s.body}>
        {(hasVoted || confirmed || !isAlive) ? (
          <div style={s.waitBlock} className="fade-in">
            <span style={s.waitIcon}>⏳</span>
            <span style={s.waitText}>
              {!isAlive ? 'Вы наблюдаете' : 'Ваш голос учтён. Ждём остальных…'}
            </span>
            <div style={s.progressBar}>
              <div style={{
                ...s.progressFill,
                width: `${votes.total > 0 ? (votes.count / votes.total) * 100 : 0}%`,
              }} />
            </div>
            <span style={s.progressLabel}>{votes.count} из {votes.total}</span>
          </div>
        ) : (
          <>
            <span style={s.hint}>
              Выбери игрока, которого считаешь наименее полезным для выживания
            </span>
            <div style={s.playerGrid}>
              {alivePlayers
                .filter(p => p.id !== playerId)
                .map(p => {
                  const isSel = selected === p.id;
                  return (
                    <button
                      key={p.id}
                      style={{
                        ...s.playerCard,
                        borderColor:  isSel ? 'var(--red)' : 'var(--border)',
                        background:   isSel ? 'rgba(221,51,68,0.1)' : 'var(--surface)',
                        boxShadow:    isSel ? '0 0 0 1px var(--red) inset' : 'none',
                      }}
                      onClick={() => setSelected(p.id)}
                    >
                      <div style={s.playerName}>{p.name}</div>

                      {/* Открытые карты кандидата */}
                      {Object.entries(p.openedCards || {}).length > 0 ? (
                        <div style={s.playerOpenCards}>
                          {Object.entries(p.openedCards).map(([type, val]) => (
                            <div key={type} style={s.miniCard}>
                              <span style={s.miniCardType}>{CARD_LABELS[type]}</span>
                              <span style={s.miniCardVal}>{val?.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={s.noCards}>— карты не раскрыты —</span>
                      )}

                      {isSel && (
                        <div style={s.selMark}>✕ ВЫГНАТЬ</div>
                      )}
                    </button>
                  );
                })}
            </div>

            <button
              className="btn-danger"
              style={s.confirmBtn}
              onClick={confirmVote}
              disabled={!selected}
            >
              ПОДТВЕРДИТЬ ГОЛОС
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── СТИЛИ ─────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  stripe: {
    height: 5,
    background: 'repeating-linear-gradient(90deg, #dd3344 0, #dd3344 16px, #000 16px, #000 32px)',
  },
  topRow: {
    padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  label: {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
    letterSpacing: '0.25em', color: 'var(--text-dim)', marginBottom: 4,
  },
  title: {
    fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700,
    color: 'var(--red)', letterSpacing: '0.06em',
    textShadow: '0 0 20px rgba(221,51,68,0.4)',
  },
  timerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  voteCount: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' },

  body: {
    flex: 1, padding: '24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    overflow: 'auto',
  },
  hint: {
    fontFamily: 'var(--font-mono)', fontSize: 13,
    color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center',
  },
  playerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
    width: '100%',
    maxWidth: 800,
  },
  playerCard: {
    border: '1px solid',
    padding: '16px',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    textAlign: 'left',
    position: 'relative',
  },
  playerName: {
    fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700,
    color: 'var(--text-bright)', letterSpacing: '0.05em',
  },
  playerOpenCards: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%' },
  miniCard: {
    display: 'flex', gap: 8, alignItems: 'baseline',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '4px 8px',
  },
  miniCardType: {
    fontFamily: 'var(--font-head)', fontSize: 9, letterSpacing: '0.12em',
    color: 'var(--text-dim)', flexShrink: 0,
  },
  miniCardVal: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
  },
  noCards: {
    fontFamily: 'var(--font-mono)', fontSize: 11,
    color: 'var(--text-dim)', fontStyle: 'italic',
  },
  selMark: {
    position: 'absolute', top: 8, right: 8,
    fontFamily: 'var(--font-head)', fontSize: 10,
    letterSpacing: '0.12em', color: 'var(--red)',
  },

  confirmBtn: {
    padding: '14px 48px', fontSize: 15,
    letterSpacing: '0.12em', borderRadius: 0,
  },

  // WAITING
  waitBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    marginTop: 40,
  },
  waitIcon: { fontSize: 48 },
  waitText: {
    fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text)',
    textAlign: 'center',
  },
  progressBar: {
    width: 280, height: 4,
    background: 'var(--surface3)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--amber)',
    transition: 'width 0.4s ease',
  },
  progressLabel: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
  },
};
