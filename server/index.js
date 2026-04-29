const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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
const {
  getRoom, setRoom, createRoom, cleanupRoomIfEmpty,
  getRoomTimers, setRoomTimer, clearRoomTimer, clearAllRoomTimers
} = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/health', (_, res) => res.json({ ok: true }));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ------------------------------------------------------------
//  Утилиты для работы с комнатами
// ------------------------------------------------------------
function publicPlayers(state) {
  return Array.from(state.players.entries()).map(([id, p]) => ({
    id,
    name: p.name,
    isHost: p.isHost,
    status: p.status,
    openedCards: p.openedCards,
    cardsOpenedThisRound: p.cardsOpenedThisRound,
  }));
}

// Генерация уникального ID для комнаты (на случай коллизий)
function generateUniqueRoomId() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (getRoom(id));
  return id;
}

// ------------------------------------------------------------
//  Фазы игры (привязаны к комнате)
// ------------------------------------------------------------
function startDiscussion(roomId) {
  let state = getRoom(roomId);
  if (!state) return;
  console.log(`🎲 [${roomId}] startDiscussion: начало раунда ${state.round}`);
  state.phase = 'discussion';
  state.votes = new Map();
  state.forceVoteRequests = new Set();
  state.players.forEach(p => { p.cardsOpenedThisRound = 0; });

  if (!state.roundEvent) {
    state = generateNewRoundEvent(state);
    setRoom(roomId, state);
    console.log(`🎲 [${roomId}] Сгенерировано событие:`, state.roundEvent?.title);
  } else {
    console.log(`🎲 [${roomId}] Событие уже есть`);
  }

  io.to(roomId).emit('newRound', {
    round: state.round,
    players: publicPlayers(state),
    roundEvent: state.roundEvent,
  });

  startCountdown(roomId, state.timerDuration, 'discussion', () => startVoting(roomId));
}

function startVoting(roomId) {
  let state = getRoom(roomId);
  if (!state) return;
  console.log(`🗳️ [${roomId}] startVoting`);
  state.phase = 'voting';
  state.votes = new Map();
  const alive = getAlivePlayers(state);
  io.to(roomId).emit('votingStarted', {
    players: publicPlayers(state),
    total: alive.length,
    roundEvent: state.roundEvent,
  });
  startCountdown(roomId, 90, 'voting', () => finishVoting(roomId));
}

function finishVoting(roomId) {
  let state = getRoom(roomId);
  if (!state) return;
  clearRoomTimer(roomId, 'timerInterval');

  const result = processVotingResult(state);
  const eliminated = state.players.get(result.eliminatedId);
  if (eliminated) eliminated.status = 'eliminated';

  state.phase = 'result';
  state.round += 1;
  const alive = getAlivePlayers(state);
  const gameOver = alive.length <= state.survivorsTarget;

  io.to(roomId).emit('votingResult', {
    eliminatedId: result.eliminatedId,
    eliminatedName: eliminated?.name,
    eliminatedCards: eliminated?.cards,
    voteCounts: result.voteCounts,
    tie: result.tie,
    noVotes: result.noVotes,
    players: publicPlayers(state),
    gameOver,
    roundEvent: state.roundEvent,
    survivors: gameOver ? alive.map(p => ({ id: p.id, name: p.name })) : null,
  });

  if (!gameOver) {
    setTimeout(() => startDiscussion(roomId), 6000);
  } else {
    state.phase = 'ended';
    setRoom(roomId, state);
    console.log(`🏁 [${roomId}] Игра окончена. Сброс через 10 секунд...`);
    clearRoomTimer(roomId, 'autoResetTimeout');
    const timeout = setTimeout(() => {
      resetGameToLobby(roomId);
    }, 10000);
    setRoomTimer(roomId, 'autoResetTimeout', timeout);
  }
}

function startCountdown(roomId, seconds, phase, onDone) {
  clearRoomTimer(roomId, 'timerInterval');
  let remaining = seconds;
  io.to(roomId).emit('timerUpdate', { remaining, phase });
  const interval = setInterval(() => {
    remaining -= 1;
    io.to(roomId).emit('timerUpdate', { remaining, phase });
    if (remaining <= 0) {
      clearInterval(interval);
      setRoomTimer(roomId, 'timerInterval', null);
      onDone();
    }
  }, 1000);
  setRoomTimer(roomId, 'timerInterval', interval);
}

function resetGameToLobby(roomId) {
  let state = getRoom(roomId);
  if (!state || state.phase !== 'ended') return;
  console.log(`🔄 [${roomId}] Автоматический сброс игры в лобби...`);
  clearAllRoomTimers(roomId);

  const savedPlayers = new Map();
  let first = true;
  state.players.forEach((p, id) => {
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

  const newState = createGame();
  newState.players = savedPlayers;
  newState.phase = 'lobby';
  setRoom(roomId, newState);
  io.to(roomId).emit('gameReset', { players: publicPlayers(newState) });
  console.log(`✅ [${roomId}] Игра сброшена в лобби`);
}

// ------------------------------------------------------------
//  Socket.IO
// ------------------------------------------------------------
io.on('connection', (socket) => {
  let currentRoomId = null; // комната, в которой находится сокет

  socket.on('createRoom', () => {
    const roomId = generateUniqueRoomId();
    createRoom(roomId);
    currentRoomId = roomId;
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    console.log(`🆕 [${roomId}] Создана комната, создатель: ${socket.id}`);
  });

  // Упрощённый joinRoom – только присоединение к комнате без добавления игрока
  socket.on('joinRoom', ({ roomId }) => {
    const state = getRoom(roomId);
    if (!state) {
      socket.emit('roomError', { message: 'Комната не найдена' });
      return;
    }
    currentRoomId = roomId;
    socket.join(roomId);
    socket.emit('roomJoined', { playerId: socket.id, isHost: false });
    console.log(`🚪 [${roomId}] Игрок ${socket.id} присоединился к комнате`);
  });

  // Добавление игрока в игру (после ввода имени)
  socket.on('joinGame', ({ name }) => {
    if (!currentRoomId) {
      socket.emit('gameError', 'Нет активной комнаты');
      return;
    }
    let state = getRoom(currentRoomId);
    if (!state) {
      socket.emit('gameError', 'Комната не найдена');
      return;
    }
    const res = handleJoin(state, socket.id, name);
    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }
    setRoom(currentRoomId, res.state);
    const me = res.state.players.get(socket.id);
    socket.emit('joinedGame', { playerId: socket.id, isHost: me.isHost });
    io.to(currentRoomId).emit('updatePlayers', { players: publicPlayers(res.state) });
    console.log(`👤 [${currentRoomId}] ${name} (${socket.id}) присоединился к игре`);
  });

  socket.on('leaveRoom', () => {
    if (!currentRoomId) return;
    const state = getRoom(currentRoomId);
    if (state) {
      state.players.delete(socket.id);
      setRoom(currentRoomId, state);
      io.to(currentRoomId).emit('updatePlayers', { players: publicPlayers(state) });
      cleanupRoomIfEmpty(currentRoomId);
    }
    socket.leave(currentRoomId);
    currentRoomId = null;
  });

  socket.on('startGame', ({ survivorsCount, timerDuration }) => {
    if (!currentRoomId) return;
    let state = getRoom(currentRoomId);
    if (!state) return;
    const me = state.players.get(socket.id);
    if (!me?.isHost) return;
    const res = handleStartGame(state, survivorsCount, timerDuration);
    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }
    setRoom(currentRoomId, res.state);
    state = res.state;
    state.players.forEach((p, id) => {
      io.to(id).emit('playerData', { cards: p.cards });
    });
    io.to(currentRoomId).emit('gameStarted', {
      catastrophe: state.catastrophe,
      players: publicPlayers(state),
      round: state.round,
      survivorsTarget: state.survivorsTarget,
      roundEvent: state.roundEvent,
    });
    setTimeout(() => startCountdown(currentRoomId, state.timerDuration, 'discussion', () => startVoting(currentRoomId)), 2000);
  });

  socket.on('openCard', ({ cardType }) => {
    if (!currentRoomId) return;
    let state = getRoom(currentRoomId);
    if (!state) return;
    const res = handleOpenCard(state, socket.id, cardType);
    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }
    setRoom(currentRoomId, res.state);
    io.to(currentRoomId).emit('cardOpened', {
      playerId: socket.id,
      playerName: res.event.playerName,
      cardType: res.event.cardType,
      cardValue: res.event.cardValue,
      players: publicPlayers(res.state),
      byEvent: false,
    });
    const labels = {
      profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
      fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
    };
    const cardLabel = labels[cardType] || cardType;
    const cardTitle = res.event.cardValue?.name || '?';
    const cardNote = res.event.cardValue?.note ? ` (${res.event.cardValue.note})` : '';
    io.to(currentRoomId).emit('chatMessage', {
      id: `system-${Date.now()}`,
      playerId: 'system',
      playerName: '📢 СИСТЕМА',
      text: `${res.event.playerName} открыл ${cardLabel}: ${cardTitle}${cardNote}`,
      ts: Date.now(),
      isSystem: true,
    });
  });

  socket.on('vote', ({ targetId }) => {
    if (!currentRoomId) return;
    let state = getRoom(currentRoomId);
    if (!state) return;
    const res = handleVote(state, socket.id, targetId);
    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }
    setRoom(currentRoomId, res.state);
    const alive = getAlivePlayers(res.state);
    io.to(currentRoomId).emit('updateVotes', {
      hasVoted: Array.from(res.state.votes.keys()),
      count: res.state.votes.size,
      total: alive.length,
    });
    if (res.votingComplete) {
      clearRoomTimer(currentRoomId, 'timerInterval');
      setTimeout(() => finishVoting(currentRoomId), 800);
    }
  });

  socket.on('requestForceVoting', () => {
    if (!currentRoomId) return;
    let state = getRoom(currentRoomId);
    if (!state) return;
    const res = handleForceVoting(state, socket.id);
    if (res.error) return;
    setRoom(currentRoomId, res.state);
    const alive = getAlivePlayers(res.state);
    const needed = Math.ceil(alive.length / 2);
    io.to(currentRoomId).emit('forceVoteUpdate', {
      count: res.state.forceVoteRequests.size,
      needed,
      requesters: Array.from(res.state.forceVoteRequests),
    });
    if (res.startVoting) {
      clearRoomTimer(currentRoomId, 'timerInterval');
      startVoting(currentRoomId);
    }
  });

  socket.on('sendChat', ({ text }) => {
    if (!currentRoomId) return;
    const state = getRoom(currentRoomId);
    if (!state) return;
    const player = state.players.get(socket.id);
    if (!player || player.status !== 'alive') return;
    if (state.phase !== 'discussion') return;
    const msg = (text || '').trim().slice(0, 280);
    if (!msg) return;
    io.to(currentRoomId).emit('chatMessage', {
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      playerName: player.name,
      text: msg,
      ts: Date.now(),
    });
  });

  socket.on('resetGame', () => {
    if (!currentRoomId) return;
    let state = getRoom(currentRoomId);
    if (!state) return;
    const me = state.players.get(socket.id);
    if (!me) return;
    if (state.phase !== 'ended' && state.phase !== 'lobby') {
      socket.emit('gameError', 'Сброс возможен только после окончания игры');
      return;
    }
    clearAllRoomTimers(currentRoomId);
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
    state.players.forEach((p, id) => {
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
    const newState = createGame();
    newState.players = savedPlayers;
    newState.phase = 'lobby';
    setRoom(currentRoomId, newState);
    io.to(currentRoomId).emit('gameReset', { players: publicPlayers(newState) });
  });

  socket.on('disconnect', () => {
    if (!currentRoomId) return;
    const state = getRoom(currentRoomId);
    if (state) {
      const wasHost = state.players.get(socket.id)?.isHost;
      state.players.delete(socket.id);
      if (wasHost && state.players.size > 0) {
        const newHost = getAlivePlayers(state)[0] || Array.from(state.players.values())[0];
        if (newHost) newHost.isHost = true;
      }
      setRoom(currentRoomId, state);
      io.to(currentRoomId).emit('playerLeft', {
        playerId: socket.id,
        playerName: state.players.get(socket.id)?.name || 'Игрок',
        players: publicPlayers(state),
      });
      cleanupRoomIfEmpty(currentRoomId);
    }
    socket.leave(currentRoomId);
    currentRoomId = null;
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
