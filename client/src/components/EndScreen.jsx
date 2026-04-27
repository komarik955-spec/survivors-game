// EndScreen.jsx (финальная версия, без костылей)
import React, { useEffect, useState } from 'react';

export default function EndScreen({ endData, eliminationData, players, catastrophe, isHost, onReset }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const survivors = endData?.survivors || [];
  const dead = players.filter(p => p.status !== 'alive');

  const CARD_LABELS = {
    profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
    fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
  };

  return (
    <div style={s.root}>
      <div style={s.bgGrid} aria-hidden />
      <div style={{ ...s.container, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div style={s.header}>
          <div style={s.stripe} />
          <div style={s.topRow}>
            <span style={s.gameOverLabel}>ИГРА ОКОНЧЕНА</span>
            {catastrophe && (
              <span style={s.catBadge}>{catastrophe.icon} {catastrophe.name}</span>
            )}
          </div>
        </div>

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

        {eliminationData && (
          <div style={s.section}>
            <span style={s.sectionTitle}>ПОСЛЕДНИЙ ИСКЛЮЧЁН</span>
            <div style={s.lastElim}>
              <span style={s.lastElimName}>{eliminationData.eliminatedName}</span>
              <span style={s.lastElimNote}>
                {eliminationData.tie ? 'Выбран случайно из ничьей' : ''}
              </span>
            </div>
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

        <div style={s.footer}>
          {isHost ? (
            <button className="btn-primary" style={s.resetBtn} onClick={() => onReset()}>
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

// стили (s) оставьте как у вас, они правильные