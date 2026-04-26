import React from 'react';

const CARD_META = {
  profession: { label: 'ПРОФЕССИЯ', icon: '⚙', color: '#00aacc' },
  health:     { label: 'ЗДОРОВЬЕ',  icon: '✚', color: '#00cc66' },
  biology:    { label: 'БИОЛОГИЯ',  icon: '⬡', color: '#9966dd' },
  fact:       { label: 'ФАКТ',      icon: '◈', color: '#f0a500' },
  hobby:      { label: 'ХОББИ',     icon: '♦', color: '#ff7700' },
  baggage:    { label: 'БАГАЖ',     icon: '▣', color: '#dd6699' },
};

/**
 * Props:
 *  type        — ключ карты (profession, health, …)
 *  value       — { name, note }
 *  isRevealed  — карта раскрыта ВСЕМ (событие уже ушло на сервер)
 *  showOwner   — я владелец: показывать содержимое только мне (без анимации)
 *  canReveal   — я могу нажать «показать всем» прямо сейчас
 *  onReveal    — callback(type) → отправить на сервер
 *  small       — уменьшенный размер (карты других игроков)
 */
export default function Card({
  type,
  value,
  isRevealed = false,
  showOwner  = false,
  canReveal  = false,
  onReveal,
  small      = false,
}) {
  const meta = CARD_META[type] || { label: type, icon: '?', color: '#888' };
  const color = meta.color;

  // Что показываем в теле карточки
  const showContent = isRevealed || showOwner;

  return (
    <div style={root(small)}>

      {/* ── ВЕРХНЯЯ ПОЛОСКА с типом ── */}
      <div style={topBar(color, small)}>
        <span style={topIcon(small)}>{meta.icon}</span>
        <span style={topLabel(small)}>{meta.label}</span>
        {isRevealed && <span style={revealedBadge}>ALL</span>}
      </div>

      {/* ── ТЕЛО ── */}
      <div style={body(small)}>
        {showContent ? (
          <>
            <div style={valueTxt(small, color)}>{value?.name || '—'}</div>
            {value?.note && (
              <div style={noteTxt(small)}>{value.note}</div>
            )}
          </>
        ) : (
          /* Чужая закрытая карта */
          <div style={hiddenBlock(color, small)}>
            <span style={hiddenIcon(color, small)}>{meta.icon}</span>
            <span style={hiddenLabel(small)}>ЗАСЕКРЕЧЕНО</span>
          </div>
        )}
      </div>

      {/* ── КНОПКА «ПОКАЗАТЬ ВСЕМ» (только владельцу, не раскрытой) ── */}
      {showOwner && !isRevealed && (
        <button
          style={revealBtn(canReveal)}
          onClick={() => canReveal && onReveal && onReveal(type)}
          disabled={!canReveal}
          title={canReveal ? 'Показать всем игрокам' : 'Лимит 2 карты за раунд'}
        >
          {canReveal ? '👁 ПОКАЗАТЬ ВСЕМ' : '🔒 ЛИМИТ'}
        </button>
      )}

      {/* ── Статус для уже раскрытых владельцем ── */}
      {showOwner && isRevealed && (
        <div style={shownTag}>✓ видят все</div>
      )}
    </div>
  );
}

// ─── СТИЛИ ──────────────────────────────────────────

function root(small) {
  return {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };
}

function topBar(color, small) {
  return {
    background: color + '1a',
    borderBottom: `1px solid ${color}44`,
    padding: small ? '4px 6px' : '5px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  };
}

function topIcon(small) {
  return {
    fontSize: small ? 10 : 12,
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  };
}

function topLabel(small) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 7 : 9,
    letterSpacing: '0.12em',
    color: 'var(--text-dim)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

const revealedBadge = {
  fontFamily: 'var(--font-head)',
  fontSize: 7,
  letterSpacing: '0.1em',
  color: 'var(--green)',
  border: '1px solid var(--green-dim)',
  padding: '1px 4px',
  flexShrink: 0,
};

function body(small) {
  return {
    flex: 1,
    padding: small ? '5px 6px' : '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  };
}

function valueTxt(small, color) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 10 : 13,
    fontWeight: 600,
    color: 'var(--text-bright)',
    lineHeight: 1.3,
    letterSpacing: '0.02em',
  };
}

function noteTxt(small) {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: small ? 8 : 10,
    color: 'var(--text-dim)',
    lineHeight: 1.4,
    fontStyle: 'italic',
  };
}

function hiddenBlock(color, small) {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    padding: '4px',
    background: `repeating-linear-gradient(45deg, ${color}06 0, ${color}06 4px, transparent 4px, transparent 16px)`,
  };
}

function hiddenIcon(color, small) {
  return {
    fontSize: small ? 18 : 22,
    color,
    opacity: 0.4,
    fontFamily: 'var(--font-mono)',
  };
}

function hiddenLabel(small) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 7 : 8,
    letterSpacing: '0.12em',
    color: 'var(--text-dim)',
    textAlign: 'center',
  };
}

function revealBtn(canReveal) {
  return {
    border: 'none',
    borderTop: `1px solid ${canReveal ? 'var(--amber)' : 'var(--border)'}`,
    background: canReveal ? 'rgba(240,165,0,0.1)' : 'var(--surface2)',
    color: canReveal ? 'var(--amber)' : 'var(--text-dim)',
    fontFamily: 'var(--font-head)',
    fontSize: 9,
    letterSpacing: '0.1em',
    padding: '6px 4px',
    cursor: canReveal ? 'pointer' : 'not-allowed',
    width: '100%',
    flexShrink: 0,
    transition: 'background 0.15s',
  };
}

const shownTag = {
  borderTop: '1px solid var(--green-dim)',
  background: 'rgba(0,204,102,0.07)',
  color: 'var(--green)',
  fontFamily: 'var(--font-head)',
  fontSize: 9,
  letterSpacing: '0.1em',
  padding: '5px 4px',
  textAlign: 'center',
  flexShrink: 0,
};
