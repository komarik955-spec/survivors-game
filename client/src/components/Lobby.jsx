import React, { useState, useRef, useEffect } from 'react';
import HowToPlay from './HowToPlay.jsx';

export default function Lobby({ 
  players, playerId, isHost, roomId, 
  onStart, onLeave, messages, onSendChat 
}) {
  const [mode, setMode] = useState('classic');
  const [chatInput, setChatInput] = useState('');
  const [showRules, setShowRules] = useState(false);
  const chatEndRef = useRef(null);

  const maxPlayers = 16;
  const playerSlots = [];

  for (let i = 0; i < maxPlayers; i++) {
    playerSlots.push(players[i] || null);
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChatMessage = () => {
    const txt = chatInput.trim();
    if (!txt) return;

    console.log("SEND:", txt); // для проверки
    onSendChat?.(txt);
    setChatInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>

        {/* ЛЕВАЯ ЧАСТЬ */}
        <div style={styles.leftColumn}>
          <div style={styles.header}>
            <h1 style={styles.title}>ВЫЖИВШИЕ</h1>
          </div>

          <div style={styles.playersGrid}>
            {playerSlots.map((player, idx) => (
              <div key={idx} style={styles.playerSlot}>
                
                <div style={styles.playerInfo}>
                  <span style={styles.playerIndex}>
                    Игрок {idx + 1}
                  </span>

                  {player ? (
                    <span style={styles.playerName}>
                      {player.name}
                      {player.isHost && <span style={styles.hostBadge}> 👑</span>}
                    </span>
                  ) : (
                    <span style={styles.emptySlot}>Пустой слот</span>
                  )}
                </div>

                {player?.id === playerId && (
                  <span style={styles.youBadge}>Вы</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div style={styles.rightColumn}>

          {/* 🔑 КОД КОМНАТЫ */}
          <div style={styles.roomCard}>
            <div style={styles.roomLabel}>Код комнаты</div>

            <div style={styles.roomCodeRow}>
              <span style={styles.roomCode}>{roomId}</span>

              <button onClick={copyRoom} style={styles.copyBtn}>
                📋
              </button>
            </div>
          </div>

          {/* РЕЖИМ */}
          <div style={styles.modeCard}>
            <div style={styles.modeLabel}>Режим игры</div>

            <div style={styles.modeButtons}>
              <button 
                style={{
                  ...styles.modeBtn,
                  ...(mode === 'halloween' ? styles.modeActive : {})
                }}
                onClick={() => setMode('halloween')}
              >
                Halloween
              </button>

              <button 
                style={{
                  ...styles.modeBtn,
                  ...(mode === 'classic' ? styles.modeActive : {})
                }}
                onClick={() => setMode('classic')}
              >
                Классика
              </button>
            </div>

            <button 
              style={styles.startBtn} 
              disabled={!isHost}
              onClick={() => onStart(mode)}
            >
              Начать игру
            </button>

            <button 
              style={styles.deleteBtn}
              onClick={onLeave}
            >
              Удалить
            </button>
          </div>

          {/* ЧАТ */}
          <div style={styles.chatCard}>
            <div style={styles.chatHeader}>Чат</div>

            <div style={styles.chatMessages}>
              {messages.length === 0 ? (
                <div style={styles.chatEmpty}>Сообщений пока нет...</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={styles.chatMessage}>
                    <strong style={styles.chatName}>{msg.playerName}</strong>
                    <span>{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={styles.chatInputRow}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown} // ✅ исправлено
                placeholder="Сообщение..."
                style={styles.chatInput}
              />
              <button onClick={sendChatMessage} style={styles.chatSendBtn}>
                ➤
              </button>
            </div>
          </div>

        </div>
      </div>

      <HowToPlay isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #0f1115, #050607)',
    padding: '20px',
  },

  container: {
    display: 'flex',
    gap: '20px',
  },

  leftColumn: {
    flex: 4,
    padding: '30px',
  },

  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  header: {
    marginBottom: '20px',
  },

  title: {
    fontSize: '32px',
    color: '#f5a623',
  },

  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '14px',
  },

  playerSlot: {
    padding: '14px 16px',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.5))',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  playerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  playerIndex: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },

  playerName: {
    fontSize: '16px',
    color: '#fff',
  },

  hostBadge: {
    color: '#f5a623',
  },

  youBadge: {
    fontSize: '12px',
    background: '#1f7a4c',
    padding: '2px 8px',
    borderRadius: '4px',
  },

  emptySlot: {
    color: 'rgba(255,255,255,0.3)',
  },

  // 🔑 КОМНАТА
  roomCard: {
    background: '#111318',
    borderRadius: '10px',
    padding: '14px',
  },

  roomLabel: {
    fontSize: '12px',
    color: '#888',
  },

  roomCodeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roomCode: {
    fontSize: '22px',
    color: '#f5a623',
    fontWeight: 'bold',
  },

  copyBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 10px',
    cursor: 'pointer',
  },

  modeCard: {
    padding: '16px',
    borderRadius: '10px',
    background: '#111318',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  modeLabel: {
    fontSize: '14px',
    color: '#aaa',
  },

  modeButtons: {
    display: 'flex',
    gap: '10px',
  },

  modeBtn: {
    flex: 1,
    padding: '8px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#fff',
  },

  modeActive: {
    background: '#f5a623',
    color: '#000',
  },

  startBtn: {
    background: '#22c55e',
    padding: '10px',
    border: 'none',
    cursor: 'pointer',
  },

  deleteBtn: {
    background: '#ef4444',
    padding: '10px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },

  chatCard: {
    background: '#111318',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    height: '300px',
  },

  chatHeader: {
    padding: '10px',
    borderBottom: '1px solid #222',
  },

  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
  },

  chatMessage: {
    fontSize: '14px',
  },

  chatName: {
    color: '#f5a623',
    marginRight: '6px',
  },

  chatEmpty: {
    textAlign: 'center',
    color: '#666',
  },

  chatInputRow: {
    display: 'flex',
    borderTop: '1px solid #222',
  },

  chatInput: {
    flex: 1,
    background: '#0b0d10',
    border: 'none',
    padding: '10px',
    color: '#fff',
  },

  chatSendBtn: {
    padding: '10px',
    background: '#f5a623',
    border: 'none',
    cursor: 'pointer',
  },
};