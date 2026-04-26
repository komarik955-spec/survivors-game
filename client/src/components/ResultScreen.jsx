import React from 'react';

const CARD_LABELS = {
  profession: 'Профессия',
  health:     'Здоровье',
  biology:    'Биология',
  fact:       'Факт',
  hobby:      'Хобби',
  baggage:    'Багаж',
};

const CARD_COLORS = {
  profession: '#00aacc',
  health:     '#00cc66',
  biology:    '#9966dd',
  fact:       '#f0a500',
  hobby:      '#ff7700',
  baggage:    '#dd6699',
};

export default function ResultScreen({ eliminationData, players, round }) {
  if (!eliminationData) return null;

  const {
    eliminatedName,
    eliminatedCards,
    voteCounts,
    tie,
    noVotes,
  } = eliminationData;

  const alive = players.filter(p => p.status === 'alive');

  // Сортировка по голосам для отображения
  const voteList = Object.entries(voteCounts || {})
    .map(([id, count]) => ({
      id,
      name: players.find(p => p.id === id)?.name || '—',
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const maxVotes = Math.max(...voteList.map(v => v.count), 1);

  return (
    <div style={s.root} className="fade-in">
      {/* Шапка */}
      <div style={s.header}>
        <div style={s.stripe} />
        <div style={s.top}>
          <span style={s.label}>РАУНД {round - 1} — ИТОГ</span>
          <span style={s.nextHint}>Следующий раунд через 6 сек…</span>
        </div>
      </div>

      {/* Исключённый */}
      <div style={s.eliminated}>
        <div style={s.elimLabel}>ВЫБЫВАЕТ ИЗ БУНКЕРА</div>
        <div style={s.elimName}>{eliminatedName}</div>
        {tie     && <div style={s.tieNote}>Ничья → случайный выбор</div>}
        {noVotes && <div style={s.tieNote}>Никто не голосовал → случайный выбор</div>}
      </div>

      {/* Карты выбывшего */}
      {eliminatedCards && (
        <div style={s.section}>
          <span style={s.sectionTitle}>ВСЕ КАРТЫ {eliminatedName?.toUpperCase()}</span>
          <div style={s.cardGrid}>
            {Object.entries(eliminatedCards).map(([type, val]) => (
              <div key={type} style={{
                ...s.revealCard,
                borderColor: (CARD_COLORS[type] || '#888') + '66',
              }}>
                <div style={{
                  ...s.revealCardTop,
                  background: (CARD_COLORS[type] || '#888') + '22',
                  borderBottom: `1px solid ${(CARD_COLORS[type] || '#888')}33`,
                }}>
                  {CARD_LABELS[type] || type}
                </div>
                <div style={s.revealCardBody}>
                  <div style={s.revealCardName}>{val?.name}</div>
                  {val?.note && <div style={s.revealCardNote}>{val.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Итоги голосования */}
      <div style={s.section}>
        <span style={s.sectionTitle}>РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ</span>
        <div style={s.voteList}>
          {voteList.map(v => (
            <div key={v.id} style={s.voteRow}>
              <span style={s.voteName}>{v.name}</span>
              <div style={s.voteBarWrap}>
                <div style={{
                  ...s.voteBar,
                  width: `${(v.count / maxVotes) * 100}%`,
                  background: v.id === eliminationData.eliminatedId
                    ? 'var(--red)' : 'var(--amber)',
                }} />
              </div>
              <span style={s.voteNum}>{v.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Выжившие */}
      <div style={s.section}>
        <span style={s.sectionTitle}>ЖИВЫ — {alive.length}</span>
        <div style={s.aliveRow}>
          {alive.map(p => (
            <span key={p.id} style={s.alivePill}>{p.name}</span>
          ))}
        </div>
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
    overflow: 'auto',
  },
  header: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  stripe: {
    height: 5,
    background: 'repeating-linear-gradient(90deg, #dd3344 0, #dd3344 16px, #000 16px, #000 32px)',
  },
  top: {
    padding: '14px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'var(--font-head)', fontSize: 13,
    letterSpacing: '0.15em', color: 'var(--text-dim)',
  },
  nextHint: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic',
  },

  eliminated: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '36px 24px 24px',
    borderBottom: '1px solid var(--border)',
    gap: 8,
  },
  elimLabel: {
    fontFamily: 'var(--font-head)', fontSize: 11,
    letterSpacing: '0.25em', color: 'var(--red)',
  },
  elimName: {
    fontFamily: 'var(--font-head)', fontSize: 52, fontWeight: 700,
    color: 'var(--text-bright)', letterSpacing: '0.06em',
    textShadow: '0 0 30px rgba(221,51,68,0.5)',
    textAlign: 'center', lineHeight: 1.1,
  },
  tieNote: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
    fontStyle: 'italic',
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

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
  },
  revealCard: {
    border: '1px solid',
    background: 'var(--surface)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  revealCardTop: {
    padding: '5px 10px',
    fontFamily: 'var(--font-head)', fontSize: 9,
    letterSpacing: '0.15em', color: 'var(--text-dim)',
  },
  revealCardBody: {
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  revealCardName: {
    fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600,
    color: 'var(--text-bright)', letterSpacing: '0.04em',
  },
  revealCardNote: {
    fontFamily: 'var(--font-mono)', fontSize: 11,
    color: 'var(--text-dim)', fontStyle: 'italic',
  },

  voteList: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 },
  voteRow: { display: 'flex', alignItems: 'center', gap: 12 },
  voteName: {
    fontFamily: 'var(--font-head)', fontSize: 14,
    color: 'var(--text)', width: 140, flexShrink: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  voteBarWrap: {
    flex: 1, height: 8,
    background: 'var(--surface3)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  voteBar: {
    height: '100%',
    transition: 'width 0.6s ease',
    minWidth: 4,
  },
  voteNum: {
    fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)',
    width: 20, textAlign: 'right',
  },

  aliveRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  alivePill: {
    background: 'rgba(0,204,102,0.08)',
    border: '1px solid var(--green-dim)',
    color: 'var(--green)',
    fontFamily: 'var(--font-head)', fontSize: 13,
    padding: '5px 14px', letterSpacing: '0.04em',
  },
};
