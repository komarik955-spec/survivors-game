import React, { useState } from 'react';

export default function Lobby({ players, playerId, isHost, roomId, onStart, messages, onSendChat, onLeave }) {
  const [survivorsCount, setSurvivorsCount] = useState(2);
  const [timerDuration,  setTimerDuration]  = useState(120);

  const alive    = players.filter(p => p.status === 'alive');
  const canStart = isHost && alive.length >= 2;
  const maxSurv  = Math.max(1, alive.length - 1);

  const handleStart = () => {
    onStart(
      Math.min(survivorsCount, maxSurv),
      timerDuration,
    );
  };

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      alert('Код комнаты скопирован!');
    }
  };

  return (
    <div style={s.root}>
      <div style={s.grid} aria-hidden />

      <div style={s.container} className="fade-in">
        {/* Заголовок */}
        <div style={s.header}>
          <div style={s.stripe} aria-hidden />
          <div style={s.titleRow}>
            <div>
              <span style={s.label}>КОМНАТА ОЖИДАНИЯ</span>
              <h1 style={s.title}>ВЫЖИВШИЕ</h1>
            </div>
            <div style={s.statusBadge}>
              <span style={s.dot} />
              <span>ЛОББИ</span>
            </div>
          </div>
          <div style={s.stripe} aria-hidden />
        </div>

        <div style={s.body}>

          {/* ─── КОД КОМНАТЫ ─── */}
          {roomId && (
            <div style={s.roomCodeCard}>
              <div style={s.roomCodeLabel}>Код комнаты</div>
              <div style={s.roomCodeValue}>{roomId}</div>
              <div style={s.buttonGroup}>
                <button onClick={copyRoomCode} style={s.copyBtn}>
                  📋 Скопировать
                </button>
                <button onClick={onLeave} style={s.leaveBtn}>
                  🚪 Выйти
                </button>
              </div>
            </div>
          )}

          {/* Список игроков */}
          <div style={s.section}>
            <div style={s.sectionHead}>
              <span style={s.sectionTitle}>ИГРОКИ</span>
              <span style={s.count}>{alive.length} / 12</span>
            </div>
            <div style={s.playerGrid}>
              {players.map((p, i) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    style={{
                      ...s.playerRow,
                      borderColor: isMe ? 'var(--amber)' : 'var(--border)',
                      background:  isMe ? 'var(--amber-glow)' : 'var(--surface2)',
                    }}
                    className="fade-in"
                  >
                    <span style={s.playerNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{
                      ...s.playerName,
                      color: isMe ? 'var(--amber)' : 'var(--text-bright)',
                    }}>
                      {p.name}
                    </span>
                    <div style={s.playerBadges}>
                      {p.isHost && <span style={s.badgeHost}>ХОСТ</span>}
                      {isMe     && <span style={s.badgeMe}>ВЫ</span>}
                    </div>
                  </div>
                );
              })}

              {/* Пустые слоты */}
              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={s.emptySlot}>
                  <span style={s.emptyText}>— ожидание игрока —</span>
                </div>
              ))}
            </div>
          </div>

          {/* Настройки (только хост) */}
          {isHost && (
            <div style={s.section}>
              <span style={s.sectionTitle}>НАСТРОЙКИ</span>
              <div style={s.settings}>
                <label style={s.settingRow}>
                  <div>
                    <div style={s.settingLabel}>Выживших в конце</div>
                    <div style={s.settingHint}>Сколько игроков остаётся — игра заканчивается</div>
                  </div>
                  <div style={s.selectWrap}>
                    <select
                      style={s.select}
                      value={survivorsCount}
                      onChange={e => setSurvivorsCount(Number(e.target.value))}
                    >
                      {Array.from({ length: maxSurv }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label style={s.settingRow}>
                  <div>
                    <div style={s.settingLabel}>Время обсуждения</div>
                    <div style={s.settingHint}>Секунды на обсуждение каждого раунда</div>
                  </div>
                  <div style={s.selectWrap}>
                    <select
                      style={s.select}
                      value={timerDuration}
                      onChange={e => setTimerDuration(Number(e.target.value))}
                    >
                      <option value={60}>60 сек</option>
                      <option value={90}>90 сек</option>
                      <option value={120}>2 мин</option>
                      <option value={180}>3 мин</option>
                      <option value={300}>5 мин</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Кнопка старта */}
          <div style={s.startArea}>
            {isHost ? (
              <>
                <button
                  className="btn-primary"
                  style={s.startBtn}
                  onClick={handleStart}
                  disabled={!canStart}
                >
                  НАЧАТЬ ИГРУ
                </button>
                {!canStart && (
                  <span style={s.hintText}>Нужно минимум 2 игрока</span>
                )}
              </>
            ) : (
              <div style={s.waitingHost}>
                <span style={s.waitingDots}>●●●</span>
                <span style={s.waitingText}>Ожидаем хоста…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        .waiting-dots { animation: blink 1.4s ease infinite; }
      `}</style>
    </div>
  );
}

// ─── СТИЛИ ─────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'fixed', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(240,165,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240,165,0,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
container: {
  width: '100%',
  maxWidth: 600,
  backgroundImage: `url('/images/bg-lobby.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundColor: 'rgba(0,0,0,0.7)',
  backgroundBlendMode: 'overlay',
  // остальные свойства (border, background: var(--surface) – уберите или оставьте как fallback)
  background: 'var(--surface)', // если оставить, он перекроет картинку, поэтому лучше убрать
  border: '1px solid var(--border)',
  position: 'relative',
  zIndex: 1,
  marginTop: 0,
},
  header: { background: 'var(--bg)' },
  stripe: {
    height: 5,
    background: 'repeating-linear-gradient(90deg, #f0a500 0, #f0a500 16px, #000 16px, #000 32px)',
  },
  titleRow: {
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    display: 'block',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.25em',
    marginBottom: 4,
  },
  title: {
    color: 'var(--amber)',
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textShadow: '0 0 30px rgba(240,165,0,0.4)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface2)',
    border: '1px solid var(--green-dim)',
    padding: '6px 14px',
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    letterSpacing: '0.15em',
    color: 'var(--green)',
  },
  dot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    display: 'inline-block',
    animation: 'blink 1.4s ease infinite',
  },
  body: { padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 },
  roomCodeCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    background: 'var(--surface2)',
    border: '1px solid var(--amber)',
    padding: '14px 18px',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  roomCodeLabel: {
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
  },
  roomCodeValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'var(--amber)',
    letterSpacing: '0.1em',
    flex: 1,
    textAlign: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
  },
  copyBtn: {
    background: 'var(--surface3)',
    border: '1px solid var(--border)',
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: '0.1s',
    borderRadius: '4px',
  },
  leaveBtn: {
    background: 'transparent',
    border: '1px solid var(--red)',
    color: 'var(--red)',
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: '0.1s',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-head)',
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
  },
  count: {
    color: 'var(--amber)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  },
  playerGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    border: '1px solid',
    transition: 'border-color 0.2s',
  },
  playerNum: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    flexShrink: 0,
    width: 22,
  },
  playerName: {
    fontFamily: 'var(--font-head)',
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '0.05em',
    flex: 1,
  },
  playerBadges: { display: 'flex', gap: 6 },
  badgeHost: {
    background: 'rgba(240,165,0,0.15)',
    border: '1px solid var(--amber-dim)',
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 10,
    letterSpacing: '0.1em',
    padding: '2px 8px',
  },
  badgeMe: {
    background: 'rgba(0,204,102,0.1)',
    border: '1px solid var(--green-dim)',
    color: 'var(--green)',
    fontFamily: 'var(--font-head)',
    fontSize: 10,
    letterSpacing: '0.1em',
    padding: '2px 8px',
  },
  emptySlot: {
    padding: '10px 14px',
    border: '1px dashed var(--border)',
    display: 'flex',
    alignItems: 'center',
  },
  emptyText: { color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 },
  settings: { display: 'flex', flexDirection: 'column', gap: 12 },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    cursor: 'default',
    gap: 16,
  },
  settingLabel: {
    fontFamily: 'var(--font-head)',
    fontSize: 14,
    color: 'var(--text-bright)',
    letterSpacing: '0.05em',
    marginBottom: 2,
  },
  settingHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-dim)',
  },
  selectWrap: { flexShrink: 0 },
  select: {
    background: 'var(--surface3)',
    border: '1px solid var(--border-hi)',
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 14,
    fontWeight: 700,
    padding: '6px 12px',
    cursor: 'pointer',
    outline: 'none',
    letterSpacing: '0.05em',
  },
  startArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  startBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 16,
    letterSpacing: '0.15em',
    borderRadius: 0,
  },
  hintText: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  },
  waitingHost: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '16px 0',
  },
  waitingDots: {
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 22,
    letterSpacing: '8px',
    animation: 'blink 1.4s ease infinite',
  },
  waitingText: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  },
};