import React, { useState } from 'react';

const TAGLINES = [
  'Кто достоин остаться?',
  'Бункер не резиновый.',
  'Голосуй. Исключай. Выживай.',
  'Твои секреты решают всё.',
];

export default function Login({ onJoin }) {
  const [name, setName]   = useState('');
  const [tagline]         = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  const [shaking, setShaking] = useState(false);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onJoin(trimmed);
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div style={s.root}>
      {/* Фоновые элементы */}
      <div style={s.grid} aria-hidden />
      <div style={s.corner1} aria-hidden>▓▓▓</div>
      <div style={s.corner2} aria-hidden>▓▓▓</div>

      <div style={s.card} className="slide-up">
        {/* Шапка */}
        <div style={s.header}>
          <div style={s.warningStripe} aria-hidden />
          <div style={s.titleBlock}>
            <span style={s.label}>ПРОТОКОЛ ВЫЖИВАНИЯ</span>
            <h1 style={s.title}>ВЫЖИВШИЕ</h1>
            <span style={s.tagline}>{tagline}</span>
          </div>
          <div style={s.warningStripe} aria-hidden />
        </div>

        {/* Форма */}
        <div style={s.body}>
          <div style={s.field}>
            <label style={s.fieldLabel}>ПОЗЫВНОЙ / ИМЯ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{
                  ...s.input,
                  animation: shaking ? 'shake 0.4s ease' : 'none',
                }}
                placeholder="Введи имя (2–20 символов)"
                value={name}
                maxLength={20}
                onChange={e => setName(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
              <button
                className="btn-primary"
                style={s.btn}
                onClick={submit}
                disabled={name.trim().length < 2}
              >
                ВОЙТИ
              </button>
            </div>
          </div>

          {/* Правила */}
          <div style={s.rules}>
            <span style={s.rulesTitle}>КАК ЭТО РАБОТАЕТ</span>
            <div style={s.rulesList}>
              {[
                ['01', 'Получаешь 6 закрытых карт с характеристиками'],
                ['02', 'Каждый раунд — открываешь до 2 карт, убеждаешь других'],
                ['03', 'Голосование: кто получает больше голосов — выбывает'],
                ['04', 'Цель — оказаться среди выживших'],
              ].map(([num, text]) => (
                <div key={num} style={s.ruleItem}>
                  <span style={s.ruleNum}>{num}</span>
                  <span style={s.ruleText}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// ─── СТИЛИ ────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(240,165,0,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240,165,0,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  corner1: {
    position: 'fixed', top: 16, left: 16,
    color: 'rgba(240,165,0,0.2)', fontFamily: 'var(--font-head)', fontSize: 24, letterSpacing: 8,
  },
  corner2: {
    position: 'fixed', bottom: 16, right: 16,
    color: 'rgba(240,165,0,0.2)', fontFamily: 'var(--font-head)', fontSize: 24, letterSpacing: 8,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    background: 'var(--bg)',
  },
  warningStripe: {
    height: 6,
    background: 'repeating-linear-gradient(90deg, #f0a500 0, #f0a500 18px, #000 18px, #000 36px)',
  },
  titleBlock: {
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-head)',
    fontSize: 52,
    fontWeight: 700,
    color: 'var(--amber)',
    letterSpacing: '0.1em',
    lineHeight: 1,
    textShadow: '0 0 40px rgba(240,165,0,0.5)',
  },
  tagline: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  body: {
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fieldLabel: {
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    letterSpacing: '0.2em',
  },
  input: {
    flex: 1,
    fontSize: 15,
    borderRadius: 0,
  },
  btn: {
    whiteSpace: 'nowrap',
    fontSize: 13,
    padding: '10px 20px',
    borderRadius: 0,
  },
  rules: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    padding: '16px 20px',
  },
  rulesTitle: {
    display: 'block',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-head)',
    fontSize: 11,
    letterSpacing: '0.2em',
    marginBottom: 12,
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ruleItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleNum: {
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    width: 20,
  },
  ruleText: {
    color: 'var(--text)',
    fontSize: 13,
    lineHeight: 1.4,
  },
};
