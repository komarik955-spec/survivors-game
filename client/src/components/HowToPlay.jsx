import React from 'react';

export default function HowToPlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>📜 ПРАВИЛА ИГРЫ</h2>
        <div style={styles.content}>
          <p><strong>1. Цель игры</strong><br />Оказаться среди выживших. Игра заканчивается, когда в бункере остаётся заданное число игроков (настраивается в лобби).</p>
          <p><strong>2. Ваши карты</strong><br />У каждого есть 6 тайных карт: Профессия, Здоровье, Биология, Факт, Хобби, Багаж. Вы можете открыть до 2 карт за раунд – показать их всем.</p>
          <p><strong>3. Раунд</strong><br />- <strong>Обсуждение</strong>: игроки обсуждают, кто слабее всех подходит для выживания.<br />- <strong>Голосование</strong>: тайное голосование. Игрок с наибольшим числом голосов покидает бункер.</p>
          <p><strong>4. Случайное событие</strong><br />В начале игры активируется событие (например, «Вспышка болезни»). Оно задаёт тему для обсуждения, но не меняет механику голосования.</p>
          <p><strong>5. Конец игры</strong><br />Когда игроков остаётся не больше заданного числа, выжившие побеждают.</p>
          <p><strong>6. Чат</strong><br />Чат работает только в живой игре. Договаривайтесь, блефуйте, анализируйте открытые карты.</p>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>ПОНЯТНО</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    maxWidth: '550px',
    width: '90%',
    background: 'var(--surface)',
    border: '1px solid var(--amber)',
    borderRadius: '8px',
    padding: '24px 28px',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.5',
    boxShadow: '0 0 40px rgba(0,0,0,0.6)',
  },
  title: {
    fontFamily: 'var(--font-head)',
    fontSize: '20px',
    letterSpacing: '0.12em',
    color: 'var(--amber)',
    textAlign: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '24px',
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid var(--amber)',
    color: 'var(--amber)',
    fontFamily: 'var(--font-head)',
    fontSize: '14px',
    letterSpacing: '0.1em',
    padding: '8px 20px',
    cursor: 'pointer',
    width: '100%',
    transition: '0.1s',
  },
};