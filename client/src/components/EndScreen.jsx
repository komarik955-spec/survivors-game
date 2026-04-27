import React, { useEffect, useState } from 'react';

export default function EndScreen({ endData, eliminationData, players, catastrophe, isHost, onReset }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const survivors = endData?.survivors || [];
  const dead      = players.filter(p => p.status !== 'alive');

  const CARD_LABELS = {
    profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
    fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
  };

  return (
    <div style={s.root}>
      {/* Фон */}
      <div style={s.bgGrid} aria-hidden />

      <div style={{ ...s.container, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {/* ШАПКА */}
        <div style={s.header}>
          <div style={s.stripe} />
          <div style={s.topRow}>
            <span style={s.gameOverLabel}>ИГРА ОКОНЧЕНА</span>
            {catastrophe && (
              <span style={s.catBadge}>{catastrophe.icon} {catastrophe.name}</span>
            )}
          </div>
        </div>

        {/* ВЫЖИВШИЕ */}
        <div style={s.survivorsSection}>
          <div style={s.survivorsLabel}>ВЫЖИЛИ В БУНКЕРЕ</div>
          <div style={s.survivorsList}>
            {survivors.map((p, i) => (
              <div key={p.id} style={s.survivorCard} className="slide-up">
                <div style={s.survivorRank}>{String(i + 1).padStart(2, '0')}</div>
                <div style={s.survivorName}>{p.name}</div>
                <div style={s.survivorIcon}>✓</div>
              </div>
            ))}
          </div>
        </div>

        {/* ПОСЛЕДНИЙ ВЫБЫВШИЙ */}
        {eliminationData && (
          <div style={s.section}>
            <span style={s.sectionTitle}>ПОСЛЕДНИЙ ИСКЛЮЧЁН</span>
            <div style={s.lastElim}>
              <span style={s.lastElimName}>{eliminationData.eliminatedName}</span>
              <span style={s.lastElimNote}>
                {eliminationData.tie ? 'Выбран случайно из ничьей' : ''}
              </span>
            </div>

            {/* Все карты последнего */}
            {eliminationData.eliminatedCards && (
              <div style={s.cardRow}>
                {Object.entries(eliminationData.eliminatedCards).map(([type, val]) => (
                  <div key={type} style={s.miniCard}>
                    <div style={s.miniCardLabel}>{CARD_LABELS[type]}</div>
                    <div style={s.miniCardVal}>{val?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* КЛАДБИЩЕ */}
        {dead.length > 0 && (
          <div style={s.section}>
            <span style={s.sectionTitle}>ПОКИНУЛИ БУНКЕР</span>
            <div style={s.deadList}>
              {dead.map(p => (
                <span key={p.id} style={s.deadPill}>✕ {p.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* КНОПКИ */}
        <div style={s.footer}>
          {isHost ? (
            <button 
  className="btn-primary" 
  style={s.resetBtn} 
  onClick={() => onReset()}
>
  НАЧАТЬ НОВУЮ ИГРУ
</button>
          ) : (
            <span style={s.waitHostText}>Ожидаем хоста для новой игры…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── СТИЛИ ──────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '24px 16px',
    overflow: 'auto',
    position: 'relative',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,204,102,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,204,102,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  container: {
    width: '100%', maxWidth: 680,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    position: 'relative', zIndex: 1,
  },
  header: { background: 'var(--bg)', borderBottom: '1px solid var(--border)' },
  stripe: {
    height: 5,
    background: 'repeating-linear-gradient(90deg, #00cc66 0, #00cc66 16px, #000 16px, #000 32px)',
  },
  topRow: {
    padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  gameOverLabel: {
    fontFamily: 'var(--font-head)', fontSize: 13,
    letterSpacing: '0.2em', color: 'var(--green)',
  },
  catBadge: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
  },

  survivorsSection: {
    padding: '32px 24px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  survivorsLabel: {
    fontFamily: 'var(--font-head)', fontSize: 11,
    letterSpacing: '0.28em', color: 'var(--text-dim)',
  },
  survivorsList: {
    display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
    width: '100%',
  },
  survivorCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '20px 28px',
    background: 'rgba(0,204,102,0.07)',
    border: '1px solid var(--green)',
    flex: '0 0 auto',
    minWidth: 140,
  },
  survivorRank: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
  },
  survivorName: {
    fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700,
    color: 'var(--green)', letterSpacing: '0.06em',
    textShadow: '0 0 20px rgba(0,204,102,0.4)',
  },
  survivorIcon: {
    fontFamily: 'var(--font-head)', fontSize: 18,
    color: 'var(--green)',
  },

  section: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  sectionTitle: {
    fontFamily: 'var(--font-head)', fontSize: 10,
    letterSpacing: '0.22em', color: 'var(--text-dim)',
  },
  lastElim: { display: 'flex', alignItems: 'baseline', gap: 12 },
  lastElimName: {
    fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700,
    color: 'var(--text-bright)', letterSpacing: '0.04em',
  },
  lastElimNote: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic',
  },
  cardRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
  },
  miniCard: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '6px 10px',
  },
  miniCardLabel: {
    fontFamily: 'var(--font-head)', fontSize: 8, letterSpacing: '0.15em',
    color: 'var(--text-dim)', marginBottom: 2,
  },
  miniCardVal: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
  },

  deadList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  deadPill: {
    background: 'rgba(221,51,68,0.06)',
    border: '1px solid var(--red-dim)',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-head)', fontSize: 13,
    padding: '4px 12px', letterSpacing: '0.04em',
    textDecoration: 'line-through',
  },

  footer: {
    padding: '24px',
    display: 'flex', justifyContent: 'center',
  },
  resetBtn: {
    padding: '14px 48px', fontSize: 15,
    letterSpacing: '0.15em', borderRadius: 0,
  },
  waitHostText: {
    fontFamily: 'var(--font-mono)', fontSize: 13,
    color: 'var(--text-dim)', fontStyle: 'italic',
  },
};
