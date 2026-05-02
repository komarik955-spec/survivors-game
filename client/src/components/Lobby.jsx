import React, { useState, useRef, useEffect } from 'react';
import HowToPlay from './HowToPlay.jsx';

export default function Lobby({ 
  players, playerId, isHost, roomId, 
  onStart, onLeave, messages, onSendChat, onToggleReady 
}) {
  const [mode] = useState('classic');
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

  const handleToggleReady = () => {
    if (onToggleReady) onToggleReady();
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
            {playerSlots.map((player, idx) => {
              const isYou = player?.id === playerId;
              const isHostPlayer = player?.isHost;
              const isReady = player?.ready;

              return (
                <div 
                  key={idx} 
                  style={{
                    ...styles.playerSlot,
                    animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
                  }}
                >
                  <div style={styles.playerLeft}>
                    <div style={styles.plusIcon}>
                      {player ? '' : '+'}
                    </div>

                    <div style={styles.playerInfo}>
                      <span style={styles.playerIndex}>
                        Игрок {idx + 1}
                      </span>

                      {player ? (
                        <span style={styles.playerName}>
                          {player.name}
                          {isHostPlayer && <span style={styles.hostBadge}> 👑</span>}
                        </span>
                      ) : (
                        <span style={styles.emptySlot}>Пустой слот</span>
                      )}
                    </div>
                  </div>

                  {/* ПРАВАЯ ЧАСТЬ СТАТУС */}
                  {player && (
                    <div style={styles.statusBlock}>
                      {isYou ? (
                        <button 
                          onClick={handleToggleReady}
                          style={{
                            ...styles.status,
                            ...(isReady ? styles.ready : styles.notReady),
                            ...styles.readyBtn,
                          }}
                        >
                          {isReady ? 'Готов' : 'Не готов'}
                        </button>
                      ) : (
                        <span style={{
                          ...styles.status,
                          ...(isReady ? styles.ready : styles.notReady)
                        }}>
                          {isReady ? 'Готов' : 'Не готов'}
                        </span>
                      )}
                      {isYou && <span style={styles.youBadge}>Вы</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div style={styles.rightColumn}>

          {/* КОД КОМНАТЫ */}
          <div style={styles.roomCard}>
            <div style={styles.roomLabel}>Код комнаты</div>
            <div style={styles.roomCodeRow}>
              <span style={styles.roomCode}>{roomId}</span>
              <button onClick={copyRoom} style={styles.copyBtn}>📋</button>
            </div>
          </div>

          {/* РЕЖИМ */}
          <div style={styles.modeCard}>
            <div style={styles.modeLabel}>Режим игры</div>

            <div style={styles.modeButtons}>
              <button style={{ ...styles.modeBtn, ...styles.modeActive }}>
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

            <button style={styles.deleteBtn} onClick={onLeave}>
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
                onKeyDown={handleKeyDown}
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

  title: {
    fontSize: '32px',
    color: '#f5a623',
  },

  playersGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px',
  },

  playerSlot: {
    padding: '18px 20px',
    borderRadius: '14px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,0,0,0.6))',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '70px',
  },

  playerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  plusIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
  },

  playerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  playerIndex: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
  },

  playerName: {
    fontSize: '18px',
    color: '#fff',
  },

  emptySlot: {
    color: 'rgba(255,255,255,0.35)',
  },

  hostBadge: {
    color: '#f5a623',
  },

  statusBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  status: {
    fontSize: '13px',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  ready: {
    background: '#1f7a4c',
    color: '#22c55e',
  },

  notReady: {
    background: '#3a1111',
    color: '#ef4444',
  },

  youBadge: {
    fontSize: '12px',
    background: '#1f7a4c',
    padding: '2px 8px',
    borderRadius: '4px',
  },

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
  },

  roomCode: {
    fontSize: '22px',
    color: '#f5a623',
  },

  copyBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  modeCard: {
    padding: '16px',
    borderRadius: '10px',
    background: '#111318',
  },

  modeLabel: {
    fontSize: '14px',
    marginBottom: '8px',
    color: '#aaa',
  },

  modeButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },

  modeBtn: {
    padding: '8px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  modeActive: {
    background: '#f5a623',
    color: '#000',
    borderColor: '#f5a623',
  },

  startBtn: {
    width: '100%',
    background: '#22c55e',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px',
  },

  deleteBtn: {
    width: '100%',
    background: '#ef4444',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
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
    fontWeight: 'bold',
  },

  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  chatEmpty: {
    color: '#666',
    textAlign: 'center',
  },

  chatMessage: {
    fontSize: '13px',
  },

  chatName: {
    color: '#f5a623',
    marginRight: '8px',
  },

  chatInputRow: {
    display: 'flex',
    borderTop: '1px solid #222',
  },

  chatInput: {
    flex: 1,
    background: '#0b0d10',
    color: '#fff',
    padding: '10px',
    border: 'none',
    outline: 'none',
  },

  chatSendBtn: {
    background: '#f5a623',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
  },
};