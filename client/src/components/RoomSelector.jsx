import React, { useState } from 'react';
import HowToPlay from './HowToPlay.jsx';

export default function RoomSelector({ onCreateRoom, onJoinRoom, error }) {
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' или 'join'
  const [showRules, setShowRules] = useState(false);

  const handleCreate = () => {
    onCreateRoom();
  };

  const handleJoin = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  if (mode === 'create') {
    return (
      <div style={styles.container}>
        <h2>Создание новой комнаты</h2>
        <button onClick={handleCreate} style={styles.button}>Создать</button>
        <button onClick={() => setMode(null)} style={styles.buttonSecondary}>Назад</button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div style={styles.container}>
        <h2>Войти в комнату</h2>
        <input
          type="text"
          placeholder="Код комнаты (6 символов)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          style={styles.input}
        />
        <button onClick={handleJoin} style={styles.button}>Присоединиться</button>
        <button onClick={() => setMode(null)} style={styles.buttonSecondary}>Назад</button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Выжившие</h1>
      <button onClick={() => setMode('create')} style={styles.button}>Создать новую игру</button>
      <button onClick={() => setMode('join')} style={styles.button}>Присоединиться к игре</button>
      <button onClick={() => setShowRules(true)} style={styles.buttonSecondary}>
        ❓ КАК ИГРАТЬ?
      </button>
      <HowToPlay isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundImage: `url('/images/bg-main.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backgroundBlendMode: 'overlay',
    color: 'var(--text)',
    padding: '20px',
  },
  button: {
    margin: '10px',
    padding: '12px 24px',
    fontSize: '16px',
    background: 'var(--amber)',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-head)',
  },
  buttonSecondary: {
    margin: '10px',
    padding: '12px 24px',
    fontSize: '16px',
    background: 'transparent',
    color: 'var(--amber)',
    border: '1px solid var(--amber)',
    cursor: 'pointer',
    fontFamily: 'var(--font-head)',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    margin: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  },
  error: {
    color: 'var(--red)',
    marginTop: '10px',
  },
};