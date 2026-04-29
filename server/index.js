const path = require('path');
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');

const {
  createGame,
  handleJoin,
  handleStartGame,
  handleOpenCard,
  handleVote,
  handleForceVoting,
  processVotingResult,
  generateNewRoundEvent,
  getAlivePlayers,
} = require('./gameLogic');

// ============================================================
//  INIT
// ============================================================

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
// Раздача собранного клиента
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/health', (_, res) => res.json({ ok: true }));
// Все остальные маршруты — отдаём index.html для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
let gameState    = createGame();
let timerInterval = null;
let autoResetTimeout = null; // для таймера автоматического сброса

// ============================================================
//  ПУБЛИЧНЫЙ СНАПШОТ (без приватных карт)
// ============================================================

function publicPlayers(state) {
  return Array.from(state.players.entries()).map(([id, p]) => ({
    id,
    name:                  p.name,
    isHost:                p.isHost,
    status:                p.status,
    openedCards:           p.openedCards,
    cardsOpenedThisRound:  p.cardsOpenedThisRound,
  }));
}

// ============================================================
//  ТАЙМЕРЫ
// ============================================================

function clearTimers() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (autoResetTimeout) { clearTimeout(autoResetTimeout); autoResetTimeout = null; }
}

function startCountdown(seconds, phase, onDone) {
  clearTimers(); // очищаем только таймер обратного отсчёта, но не autoResetTimeout? Лучше разделить.
  // Но в старом clearTimers чистил всё. Перепишем, чтобы не мешать автосбросу.
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  let remaining = seconds;
  io.emit('timerUpdate', { remaining, phase });

  timerInterval = setInterval(() => {
    remaining -= 1;
    io.emit('timerUpdate', { remaining, phase });
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      onDone();
    }
  }, 1000);
}

// ============================================================
//  СБРОС ИГРЫ В ЛОББИ (без привязки к хосту)
// ============================================================

function resetGameToLobby() {
  // Не сбрасываем, если игра не в состоянии 'ended' или если уже идёт сброс
  if (gameState.phase !== 'ended') return;
  console.log('🔄 Автоматический сброс игры в лобби...');

  const savedPlayers = new Map();
  let first = true;
  gameState.players.forEach((p, id) => {
    savedPlayers.set(id, {
      id: p.id,
      name: p.name,
      isHost: first,
      status: 'alive',
      cards: null,
      openedCards: {},
      cardsOpenedThisRound: 0,
    });
    first = false;
  });

  gameState = createGame();
  gameState.players = savedPlayers;
  gameState.phase = 'lobby';
  gameState.roundEvent = null; // событие сбрасывается

  io.emit('gameReset', { players: publicPlayers(gameState) });
  console.log('✅ Игра сброшена в лобби (автоматически)');
}

// ============================================================
//  ФАЗЫ ИГРЫ
// ============================================================

function startDiscussion() {
  console.log('🎲 startDiscussion: начало раунда', gameState.round);
  gameState.phase = 'discussion';
  gameState.votes = new Map();
  gameState.forceVoteRequests = new Set();
  gameState.players.forEach(p => { p.cardsOpenedThisRound = 0; });

  // Генерируем событие только если его ещё нет (первый раунд)
  if (!gameState.roundEvent) {
    gameState = generateNewRoundEvent(gameState);
    console.log('🎲 Сгенерировано единственное событие:', gameState.roundEvent?.title);
  } else {
    console.log('🎲 Событие уже существует, повторно не генерируем');
  }

  io.emit('newRound', {
    round: gameState.round,
    players: publicPlayers(gameState),
    roundEvent: gameState.roundEvent,
  });

  startCountdown(gameState.timerDuration, 'discussion', startVoting);
}

function startVoting() {
  console.log('🗳️ startVoting: roundEvent', gameState.roundEvent?.title);
  gameState.phase = 'voting';
  gameState.votes = new Map();

  const alive = getAlivePlayers(gameState);

  io.emit('votingStarted', {
    players:    publicPlayers(gameState),
    total:      alive.length,
    roundEvent: gameState.roundEvent,
  });

  startCountdown(90, 'voting', finishVoting);
}

function finishVoting() {
  // Очищаем только таймер обратного отсчёта, но не автосброс (если он был)
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;

  const result    = processVotingResult(gameState);
  const eliminated = gameState.players.get(result.eliminatedId);
  if (eliminated) eliminated.status = 'eliminated';

  gameState.phase = 'result';
  gameState.round += 1;

  const alive    = getAlivePlayers(gameState);
  const gameOver = alive.length <= gameState.survivorsTarget;

  io.emit('votingResult', {
    eliminatedId:    result.eliminatedId,
    eliminatedName:  eliminated?.name,
    eliminatedCards: eliminated?.cards,
    voteCounts:      result.voteCounts,
    tie:             result.tie,
    noVotes:         result.noVotes,
    players:         publicPlayers(gameState),
    gameOver,
    roundEvent:      gameState.roundEvent,
    survivors: gameOver
      ? alive.map(p => ({ id: p.id, name: p.name }))
      : null,
  });

  if (!gameOver) {
    setTimeout(startDiscussion, 6000);
  } else {
    gameState.phase = 'ended';
    console.log('🏁 Игра окончена. Через 10 секунд сбросим в лобби...');
    // Отменяем предыдущий таймер автосброса (если был)
    if (autoResetTimeout) clearTimeout(autoResetTimeout);
    autoResetTimeout = setTimeout(() => {
      autoResetTimeout = null;
      resetGameToLobby();
    }, 10000);
  }
}

// ============================================================
//  SOCKET.IO СОБЫТИЯ
// ============================================================

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.emit('currentState', {
    phase:   gameState.phase,
    players: publicPlayers(gameState),
  });

  socket.on('joinGame', ({ name }) => {
    const res = handleJoin(gameState, socket.id, name);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    const me = gameState.players.get(socket.id);
    socket.emit('joinedGame', { playerId: socket.id, isHost: me.isHost });
    io.emit('updatePlayers', { players: publicPlayers(gameState) });
  });

  socket.on('startGame', ({ survivorsCount, timerDuration }) => {
    const me = gameState.players.get(socket.id);
    if (!me?.isHost) return;

    const res = handleStartGame(gameState, survivorsCount, timerDuration);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    gameState.players.forEach((p, id) => {
      io.to(id).emit('playerData', { cards: p.cards });
    });

    io.emit('gameStarted', {
      catastrophe:     gameState.catastrophe,
      players:         publicPlayers(gameState),
      round:           gameState.round,
      survivorsTarget: gameState.survivorsTarget,
      roundEvent:      gameState.roundEvent,
    });

    setTimeout(() => startCountdown(gameState.timerDuration, 'discussion', startVoting), 2000);
  });

  socket.on('openCard', ({ cardType }) => {
    const res = handleOpenCard(gameState, socket.id, cardType);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    io.emit('cardOpened', {
      playerId:   socket.id,
      playerName: res.event.playerName,
      cardType:   res.event.cardType,
      cardValue:  res.event.cardValue,
      players:    publicPlayers(gameState),
      byEvent:    false,
    });

    const labels = {
      profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
      fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
    };
    const cardLabel = labels[cardType] || cardType;
    const cardTitle = res.event.cardValue?.name || '?';
    const cardNote = res.event.cardValue?.note ? ` (${res.event.cardValue.note})` : '';
    
    const chatMessage = {
      id: `system-${Date.now()}`,
      playerId: 'system',
      playerName: '📢 СИСТЕМА',
      text: `${res.event.playerName} открыл ${cardLabel}: ${cardTitle}${cardNote}`,
      ts: Date.now(),
      isSystem: true,
    };
    io.emit('chatMessage', chatMessage);
  });

  socket.on('vote', ({ targetId }) => {
    const res = handleVote(gameState, socket.id, targetId);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    const alive = getAlivePlayers(gameState);
    io.emit('updateVotes', {
      hasVoted: Array.from(gameState.votes.keys()),
      count:    gameState.votes.size,
      total:    alive.length,
    });

    if (res.votingComplete) {
      clearInterval(timerInterval);
      timerInterval = null;
      setTimeout(finishVoting, 800);
    }
  });

  socket.on('requestForceVoting', () => {
    const res = handleForceVoting(gameState, socket.id);
    if (res.error) return;
    gameState = res.state;

    const alive  = getAlivePlayers(gameState);
    const needed = Math.ceil(alive.length / 2);

    io.emit('forceVoteUpdate', {
      count:      gameState.forceVoteRequests.size,
      needed,
      requesters: Array.from(gameState.forceVoteRequests),
    });

    if (res.startVoting) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      startVoting();
    }
  });

  socket.on('sendChat', ({ text }) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.status !== 'alive') return;
    if (gameState.phase !== 'discussion') return;

    const msg = (text || '').trim().slice(0, 280);
    if (!msg) return;

    io.emit('chatMessage', {
      id:         `${socket.id}-${Date.now()}`,
      playerId:   socket.id,
      playerName: player.name,
      text:       msg,
      ts:         Date.now(),
    });
  });

  socket.on('resetGame', () => {
    const me = gameState.players.get(socket.id);
    if (!me) return;

    // Если игра ещё не закончилась, но кто-то (хост) просит сбросить – можно, но предусмотрим
    if (gameState.phase !== 'ended' && gameState.phase !== 'lobby') {
      // Не разрешаем сброс во время игры, только после окончания или в лобби
      socket.emit('gameError', 'Сброс возможен только после окончания игры');
      return;
    }

    clearInterval(timerInterval);
    timerInterval = null;
    if (autoResetTimeout) clearTimeout(autoResetTimeout);
    autoResetTimeout = null;

    const savedPlayers = new Map();
    savedPlayers.set(socket.id, {
      id: socket.id,
      name: me.name,
      isHost: true,
      status: 'alive',
      cards: null,
      openedCards: {},
      cardsOpenedThisRound: 0,
    });
    gameState.players.forEach((p, id) => {
      if (id !== socket.id) {
        savedPlayers.set(id, {
          id: p.id,
          name: p.name,
          isHost: false,
          status: 'alive',
          cards: null,
          openedCards: {},
          cardsOpenedThisRound: 0,
        });
      }
    });

    gameState = createGame();
    gameState.players = savedPlayers;
    gameState.phase = 'lobby';
    gameState.round = 1;
    gameState.catastrophe = null;
    gameState.survivorsTarget = 2;
    gameState.timerDuration = 120;
    gameState.votes = new Map();
    gameState.forceVoteRequests = new Set();
    gameState.roundEvent = null;

    io.emit('gameReset', { players: publicPlayers(gameState) });
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const wasHost = player.isHost;
    gameState.players.delete(socket.id);

    if (wasHost && gameState.players.size > 0) {
      const newHost = getAlivePlayers(gameState)[0]
        || Array.from(gameState.players.values())[0];
      if (newHost) newHost.isHost = true;
    }

    io.emit('playerLeft', {
      playerId:   socket.id,
      playerName: player.name,
      players:    publicPlayers(gameState),
    });

    if (gameState.phase === 'voting') {
      const alive = getAlivePlayers(gameState);
      if (alive.length > 0 && gameState.votes.size >= alive.length) {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        setTimeout(finishVoting, 800);
      }
      if (alive.length <= gameState.survivorsTarget) {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        finishVoting();
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен: http://localhost:${PORT}\n`);
});