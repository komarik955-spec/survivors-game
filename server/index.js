const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createGame,
  handleJoin,
  handleToggleReady, // ✅ ДОБАВИЛИ
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
//  Утилиты
// ------------------------------------------------------------
function publicPlayers(state) {
  return Array.from(state.players.entries()).map(([id, p]) => ({
    id,
    name: p.name,
    isHost: p.isHost,
    status: p.status,
    ready: p.ready || false, // ✅ ДОБАВИЛИ
    openedCards: p.openedCards,
    cardsOpenedThisRound: p.cardsOpenedThisRound,
  }));
}

function generateUniqueRoomId() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (getRoom(id));
  return id;
}

// ------------------------------------------------------------
//  Socket.IO
// ------------------------------------------------------------
io.on('connection', (socket) => {
  let currentRoomId = null;

  // СОЗДАНИЕ КОМНАТЫ
  socket.on('createRoom', () => {
    const roomId = generateUniqueRoomId();
    createRoom(roomId);
    currentRoomId = roomId;

    socket.join(roomId);
    socket.emit('roomCreated', { roomId });

    console.log(`🆕 [${roomId}] Создана комната (${socket.id})`);
  });

  // ВХОД В КОМНАТУ
  socket.on('joinRoom', ({ roomId }) => {
    const state = getRoom(roomId);
    if (!state) {
      socket.emit('roomError', { message: 'Комната не найдена' });
      return;
    }

    currentRoomId = roomId;
    socket.join(roomId);

    socket.emit('roomJoined', {
      playerId: socket.id,
      isHost: false
    });

    console.log(`🚪 [${roomId}] ${socket.id} вошёл`);
  });

  // ДОБАВЛЕНИЕ В ИГРУ
  socket.on('joinGame', ({ name }) => {
    if (!currentRoomId) return;

    let state = getRoom(currentRoomId);
    if (!state) return;

    const res = handleJoin(state, socket.id, name);

    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }

    setRoom(currentRoomId, res.state);

    const me = res.state.players.get(socket.id);

    socket.emit('joinedGame', {
      playerId: socket.id,
      isHost: me.isHost
    });

    io.to(currentRoomId).emit('updatePlayers', {
      players: publicPlayers(res.state)
    });
  });

  // 🔥 ГОТОВ / НЕ ГОТОВ
  socket.on('toggleReady', () => {
    if (!currentRoomId) return;

    let state = getRoom(currentRoomId);
    if (!state) return;

    const res = handleToggleReady(state, socket.id);

    if (res.error) {
      socket.emit('gameError', res.error);
      return;
    }

    setRoom(currentRoomId, res.state);

    io.to(currentRoomId).emit('updatePlayers', {
      players: publicPlayers(res.state)
    });

    console.log(`🔁 [${currentRoomId}] ${socket.id} сменил ready`);
  });

  // СТАРТ ИГРЫ
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

    io.to(currentRoomId).emit('gameStarted', {
      players: publicPlayers(res.state)
    });
  });

  // ЧАТ
  socket.on('sendChat', ({ text }) => {
    if (!currentRoomId) return;

    const state = getRoom(currentRoomId);
    if (!state) return;

    const player = state.players.get(socket.id);
    if (!player) return;

    io.to(currentRoomId).emit('chatMessage', {
      id: `${socket.id}-${Date.now()}`,
      playerName: player.name,
      text,
    });
  });

  // ВЫХОД
  socket.on('disconnect', () => {
    if (!currentRoomId) return;

    const state = getRoom(currentRoomId);
    if (!state) return;

    state.players.delete(socket.id);

    setRoom(currentRoomId, state);

    io.to(currentRoomId).emit('updatePlayers', {
      players: publicPlayers(state)
    });

    cleanupRoomIfEmpty(currentRoomId);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});