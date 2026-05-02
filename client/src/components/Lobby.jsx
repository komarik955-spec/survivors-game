import React, { useState, useRef, useEffect } from 'react';

// Встроенный компонент правил (чтобы не зависеть от внешнего файла)
function HowToPlay({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#111318', padding: '30px', borderRadius: '16px',
        maxWidth: '500px', color: '#fff', border: '1px solid #f5a623',
        fontFamily: 'monospace'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#f5a623', marginBottom: '20px' }}>Правила игры</h2>
        <p>1. У каждого игрока 6 карт: Профессия, Здоровье, Биология, Факт, Хобби, Багаж.</p>
        <p>2. В каждом раунде можно открыть до 2 карт – показать их всем.</p>
        <p>3. Обсуждение, затем голосование. Игрок с наибольшим числом голосов выбывает.</p>
        <p>4. Игра заканчивается, когда в бункере остаётся заданное число игроков.</p>
        <button onClick={onClose} style={{
          marginTop: '20px', padding: '8px 20px', background: '#f5a623',
          border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>Закрыть</button>
      </div>
    </div>
  );
}

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
    if (onSendChat) onSendChat(txt);
    setChatInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const copyRoom = () => {
    if (roomId) navigator.clipboard.writeText(roomId);
  };

  const handleToggleReady = () => {
    if (onToggleReady) onToggleReady();
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Левая колонка – игроки */}
        <div style={styles.leftColumn}>
          <img src="/images/logo.png" alt="Выжившие" style={styles.logoImage} />
          <div style={styles.playersGrid}>
            {playerSlots.map((player, idx) => {
              const isYou = player?.id === playerId;
              const isHostPlayer = player?.isHost;
              const isReady = player?.ready || false;

              return (
                <div key={idx} style={styles.playerSlot}>
                  <div style={styles.playerLeft}>
                    <div style={styles.plusIcon}>{player ? '' : '+'}</div>
                    <div style={styles.playerInfo}>
                      <span style={styles.playerIndex}>Игрок {idx + 1}</span>
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
                  {player && (
                    <div style={styles.statusBlock}>
                      {isYou ? (
                        <button
                          onClick={handleToggleReady}
                          style={{
                            ...styles.status,
                            ...(isReady ? styles.ready : styles.notReady),
                            cursor: 'pointer',
                          }}
                        >
                          {isReady ? 'Готов' : 'Не готов'}
                        </button>
                      ) : (
                        <span style={{ ...styles.status, ...(isReady ? styles.ready : styles.notReady) }}>
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

        {/* Правая колонка – код, режим, чат */}
        <div style={styles.rightColumn}>
          <div style={styles.roomCard}>
            <div style={styles.roomLabel}>Код комнаты</div>
            <div style={styles.roomCodeRow}>
              <span style={styles.roomCode}>{roomId}</span>
              <button onClick={copyRoom} style={styles.copyBtn}>📋</button>
            </div>
          </div>

          <div style={styles.modeCard}>
            <div style={styles.modeLabel}>Режим игры</div>
            <button style={{ ...styles.modeBtn, ...styles.modeActive }}>Классика</button>
            <button
              style={styles.startBtn}
              disabled={!isHost}
              onClick={() => onStart(mode)}
            >
              Начать игру
            </button>
            <button style={styles.deleteBtn} onClick={onLeave}>Удалить</button>
          </div>

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
              <button onClick={sendChatMessage} style={styles.chatSendBtn}>➤</button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowRules(true)} style={styles.rulesBtn}>❓</button>
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
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: '4',
    minWidth: '300px',
  },
  rightColumn: {
    flex: '1',
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  playerSlot: {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,0,0,0.6))',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '70px',
  },
  playerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  playerName: {
    fontSize: '18px',
    color: '#fff',
  },
  emptySlot: {
    color: 'rgba(255,255,255,0.4)',
  },
  hostBadge: {
    color: '#f5a623',
  },
  statusBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  status: {
    fontSize: '12px',
    padding: '4px 12px',
    borderRadius: '20px',
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
    fontSize: '11px',
    background: '#1f7a4c',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  roomCard: {
    background: '#111318',
    borderRadius: '12px',
    padding: '16px',
  },
  roomLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },
  roomCodeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCode: {
    fontSize: '24px',
    color: '#f5a623',
    fontFamily: 'monospace',
  },
  copyBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  modeCard: {
    background: '#111318',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  modeLabel: {
    fontSize: '14px',
    color: '#aaa',
  },
  modeBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
  },
  modeActive: {
    background: '#f5a623',
    color: '#000',
    borderColor: '#f5a623',
  },
  startBtn: {
    background: '#22c55e',
    color: '#000',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  deleteBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
  },
  chatCard: {
    background: '#111318',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    height: '320px',
  },
  chatHeader: {
    padding: '12px',
    borderBottom: '1px solid #222',
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
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
    wordBreak: 'break-word',
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
    padding: '12px',
    border: 'none',
    outline: 'none',
  },
  chatSendBtn: {
    background: '#f5a623',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
  },
  logoImage: {
    width: '300px',
    maxWidth: '100%',
    marginBottom: '20px',
    display: 'block',
  },
  rulesBtn: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#f5a623',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
};