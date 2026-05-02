import React, { useState, useRef, useEffect } from 'react';
import HowToPlay from './HowToPlay.jsx';

export default function Lobby({ 
  players, playerId, isHost, roomId, 
  onStart, onLeave, messages, onSendChat 
}) {
  const [mode, setMode] = useState('classic'); // 'classic' или 'halloween'
  const [chatInput, setChatInput] = useState('');
  const [showRules, setShowRules] = useState(false);
  const chatEndRef = useRef(null);

  const alive = players.filter(p => p.status === 'alive');
  const maxPlayers = 15;
  const playerSlots = [];

  // Заполняем слоты игроками + пустыми местами до 15
  for (let i = 0; i < maxPlayers; i++) {
    if (i < players.length) {
      playerSlots.push(players[i]);
    } else {
      playerSlots.push(null);
    }
  }

  // Автоскролл чата
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const copyRoomUrl = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка на комнату скопирована!');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert('Код комнаты скопирован!');
  };

  const sendChatMessage = () => {
    const txt = chatInput.trim();
    if (!txt) return;
    onSendChat(txt);
    setChatInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendChatMessage();
  };

  const handleStartGame = () => {
    onStart(mode);
  };

  const handleDeleteRoom = () => {
    if (window.confirm('Вы уверены, что хотите удалить комнату? Все игроки будут отключены.')) {
      onLeave();
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Левая колонка: список игроков */}
        <div style={styles.leftColumn}>
          <div style={styles.header}>
            <h1 style={styles.title}>УБЕЖИЩЕ 42</h1>
            <span style={styles.version}>1.6.9b</span>
          </div>

          <div style={styles.playersList}>
            {playerSlots.map((player, idx) => (
              <div key={idx} style={styles.playerSlot}>
                {player ? (
                  <>
                    <span style={styles.playerName}>
                      {player.name}
                      {player.isHost && <span style={styles.hostBadge}> (Владелец)</span>}
                    </span>
                    {player.id === playerId && <span style={styles.youBadge}>Вы</span>}
                  </>
                ) : (
                  <span style={styles.emptySlot}>Пустой слот</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка: всё остальное */}
        <div style={styles.rightColumn}>
          {/* Код комнаты и ссылка */}
          <div style={styles.roomCard}>
            <div style={styles.roomUrl} onClick={copyRoomUrl}>
              {window.location.origin}/?room={roomId}
            </div>
            <div style={styles.roomCodeRow}>
              <span style={styles.roomCodeLabel}>Код комнаты:</span>
              <span style={styles.roomCode}>{roomId}</span>
              <button onClick={copyRoomCode} style={styles.copyBtn}>📋</button>
            </div>
          </div>

          {/* Поддержка проекта */}
          <div style={styles.supportCard}>
            <div style={styles.supportText}>
              Если вы хотите помочь нам справиться с нагрузкой и сделать игру ещё лучше — 
              любая ваша поддержка очень важна для нас!
            </div>
            <button style={styles.supportBtn}>Поддержать</button>
          </div>

          {/* Telegram Bot */}
          <div style={styles.telegramCard}>
            <div style={styles.telegramText}>
              Играй в Bunker Online с друзьями прямо в мессенджере — быстро, удобно и без шэпов!
            </div>
            <button style={styles.telegramBtn}>Перейти</button>
          </div>

          {/* Правила игры */}
          <div style={styles.rulesCard}>
            <div style={styles.rulesText}>
              У нас есть определенный перечень правил игры, по этому перед началом игры рекомендуем их прочитать!
            </div>
            <button onClick={() => setShowRules(true)} style={styles.rulesBtn}>
              Перейти
            </button>
          </div>

          {/* Режимы игры */}
          <div style={styles.modeCard}>
            <div style={styles.modeLabel}>Выберите режим игры</div>
            <div style={styles.modeButtons}>
              <button 
                className={mode === 'halloween' ? 'active' : ''}
                style={{ ...styles.modeBtn, ...(mode === 'halloween' ? styles.modeActive : {}) }}
                onClick={() => setMode('halloween')}
              >
                Halloween
              </button>
              <button 
                className={mode === 'classic' ? 'active' : ''}
                style={{ ...styles.modeBtn, ...(mode === 'classic' ? styles.modeActive : {}) }}
                onClick={() => setMode('classic')}
              >
                Классика
              </button>
            </div>
            <button 
              style={styles.startBtn} 
              onClick={handleStartGame}
              disabled={!isHost}
            >
              Начать игру
            </button>
            <button style={styles.deleteBtn} onClick={handleDeleteRoom}>
              Удалить
            </button>
          </div>

          {/* Голосовой чат (предложение) */}
          <div style={styles.voiceCard}>
            <span>🎙️ Лучше играть с голосовым чатом</span>
            <button style={styles.voiceBtn}>Перейти в дисплей</button>
          </div>

          {/* Чат комнаты */}
          <div style={styles.chatCard}>
            <div style={styles.chatHeader}>Чат комнаты</div>
            <div style={styles.chatMessages}>
              {messages.length === 0 ? (
                <div style={styles.chatEmpty}>Сообщений пока нет...</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={styles.chatMessage}>
                    <strong style={styles.chatName}>{msg.playerName}</strong>
                    <span style={styles.chatText}>{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={styles.chatInputRow}>
              <input
                type="text"
                placeholder="Введите сообщение"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.chatInput}
              />
              <button onClick={sendChatMessage} style={styles.chatSendBtn}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка правил */}
      <HowToPlay isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

// ─── СТИЛИ ─────────────────────────────────────────────
const styles = {
  root: {
    minHeight: '100vh',
    backgroundImage: `url('/images/bg-lobby.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    backgroundBlendMode: 'overlay',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    maxWidth: '1200px',
    width: '100%',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  leftColumn: {
    flex: '1.2',
    minWidth: '280px',
    background: 'rgba(20,20,30,0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid var(--border)',
  },
  rightColumn: {
    flex: '2',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottom: '1px solid var(--amber)',
    marginBottom: '20px',
    paddingBottom: '8px',
  },
  title: {
    fontFamily: 'var(--font-head)',
    fontSize: '28px',
    color: 'var(--amber)',
    margin: 0,
  },
  version: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: 'calc(100vh - 150px)',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  playerSlot: {
    padding: '8px 12px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    color: 'var(--text)',
  },
  playerName: {
    flex: 1,
  },
  hostBadge: {
    color: 'var(--amber)',
    marginLeft: '6px',
    fontSize: '12px',
  },
  youBadge: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    marginLeft: '8px',
  },
  emptySlot: {
    color: 'var(--text-dim)',
    fontStyle: 'italic',
  },
  roomCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  roomUrl: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--amber)',
    cursor: 'pointer',
    wordBreak: 'break-all',
    marginBottom: '8px',
    textDecoration: 'underline',
  },
  roomCodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  roomCodeLabel: {
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  roomCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'var(--amber)',
    letterSpacing: '1px',
  },
  copyBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  supportCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  supportText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    lineHeight: '1.4',
    color: 'var(--text)',
  },
  supportBtn: {
    background: 'var(--amber)',
    color: '#000',
    border: 'none',
    padding: '8px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  telegramCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  telegramText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text)',
  },
  telegramBtn: {
    background: 'var(--surface3)',
    border: '1px solid var(--border-hi)',
    color: 'var(--amber)',
    padding: '8px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  rulesCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rulesText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text)',
  },
  rulesBtn: {
    background: 'var(--surface3)',
    border: '1px solid var(--border-hi)',
    color: 'var(--amber)',
    padding: '8px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  modeCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modeLabel: {
    fontFamily: 'var(--font-head)',
    fontSize: '14px',
    color: 'var(--text-bright)',
  },
  modeButtons: {
    display: 'flex',
    gap: '12px',
  },
  modeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '6px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '20px',
  },
  modeActive: {
    background: 'var(--amber)',
    color: '#000',
    borderColor: 'var(--amber)',
  },
  startBtn: {
    background: 'var(--green)',
    color: '#000',
    border: 'none',
    padding: '10px 20px',
    fontFamily: 'var(--font-head)',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '100%',
  },
  deleteBtn: {
    background: 'var(--red)',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '100%',
  },
  voiceCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  voiceBtn: {
    background: 'transparent',
    border: '1px solid var(--amber)',
    color: 'var(--amber)',
    padding: '6px 12px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  chatCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '300px',
  },
  chatHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    fontFamily: 'var(--font-head)',
    fontSize: '14px',
    color: 'var(--text-bright)',
    background: 'var(--surface2)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
  },
  chatEmpty: {
    color: 'var(--text-dim)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chatMessage: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    wordBreak: 'break-word',
  },
  chatName: {
    color: 'var(--amber)',
    marginRight: '8px',
  },
  chatText: {
    color: 'var(--text)',
  },
  chatInputRow: {
    display: 'flex',
    borderTop: '1px solid var(--border)',
    padding: '8px',
    gap: '8px',
  },
  chatInput: {
    flex: 1,
    background: 'var(--surface3)',
    border: '1px solid var(--border)',
    padding: '8px',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    borderRadius: '4px',
  },
  chatSendBtn: {
    background: 'var(--amber)',
    border: 'none',
    padding: '8px 16px',
    fontFamily: 'var(--font-head)',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '4px',
  },
};