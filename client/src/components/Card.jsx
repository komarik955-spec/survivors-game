import React from 'react';

const CARD_META = {
  profession: { label: 'ПРОФЕССИЯ', icon: '⚙', color: '#00aacc' },
  health:     { label: 'ЗДОРОВЬЕ',  icon: '✚', color: '#00cc66' },
  biology:    { label: 'БИОЛОГИЯ',  icon: '⬡', color: '#9966dd' },
  fact:       { label: 'ФАКТ',      icon: '◈', color: '#f0a500' },
  hobby:      { label: 'ХОББИ',     icon: '♦', color: '#ff7700' },
  baggage:    { label: 'БАГАЖ',     icon: '▣', color: '#dd6699' },
};

export default function Card({ type, value, isOpen, canOpen, onOpen, small }) {
  const meta  = CARD_META[type] || { label: type, icon: '?', color: '#888' };
  const size  = small ? { width: 100, height: 140 } : { width: 130, height: 180 };

  return (
    <div
      className={`card-flip ${isOpen ? 'is-open' : ''}`}
      style={{ ...size, cursor: (!isOpen && canOpen) ? 'pointer' : 'default' }}
      onClick={() => { if (!isOpen && canOpen) onOpen(type); }}
      title={!isOpen && canOpen ? 'Нажми, чтобы открыть' : undefined}
    >
      <div className="card-flip-inner">
        {/* ─── РУБАШКА ─── */}
        <div className="card-face" style={face(meta.color, small)}>
          <div style={backPattern(meta.color)} aria-hidden />
          <div style={backCenter}>
            <span style={backIcon(meta.color, small)}>{meta.icon}</span>
            <span style={backLabel(small)}>{meta.label}</span>
          </div>
          {canOpen && !isOpen && (
            <div style={hint}>TAP</div>
          )}
        </div>

        {/* ─── ЛИЦО ─── */}
        <div className="card-face back" style={faceOpen(meta.color, small)}>
          <div style={topBar(meta.color)}>
            <span style={topIcon}>{meta.icon}</span>
            <span style={topLab(small)}>{meta.label}</span>
          </div>
          <div style={cardBody(small)}>
            <div style={valueTxt(small)}>{value?.name || '—'}</div>
            {value?.note && (
              <div style={noteTxt(small)}>{value.note}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── СТИЛИ ──────────────────────────────────────────

function face(color, small) {
  return {
    background: 'var(--surface)',
    border: `1px solid ${color}44`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  };
}

function backPattern(color) {
  return {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      repeating-linear-gradient(45deg, ${color}08 0, ${color}08 4px, transparent 4px, transparent 20px),
      repeating-linear-gradient(-45deg, ${color}06 0, ${color}06 4px, transparent 4px, transparent 20px)
    `,
  };
}

const backCenter = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
};

function backIcon(color, small) {
  return {
    fontSize: small ? 22 : 30,
    color,
    opacity: 0.7,
    fontFamily: 'var(--font-mono)',
  };
}

function backLabel(small) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 8 : 10,
    color: 'var(--text-dim)',
    letterSpacing: '0.15em',
    textAlign: 'center',
  };
}

const hint = {
  position: 'absolute',
  bottom: 8,
  right: 8,
  fontFamily: 'var(--font-head)',
  fontSize: 8,
  letterSpacing: '0.1em',
  color: 'var(--amber)',
  opacity: 0.7,
};

function faceOpen(color, small) {
  return {
    background: 'var(--surface2)',
    border: `1px solid ${color}88`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
}

function topBar(color) {
  return {
    background: color + '22',
    borderBottom: `1px solid ${color}44`,
    padding: '5px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  };
}

const topIcon = {
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
};

function topLab(small) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 8 : 9,
    letterSpacing: '0.12em',
    color: 'var(--text-dim)',
  };
}

function cardBody(small) {
  return {
    padding: small ? '6px 8px' : '8px 10px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    justifyContent: 'center',
  };
}

function valueTxt(small) {
  return {
    fontFamily: 'var(--font-head)',
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    color: 'var(--text-bright)',
    lineHeight: 1.3,
    letterSpacing: '0.03em',
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
