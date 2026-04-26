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
}

function startCountdown(seconds, phase, onDone) {
  clearTimers();
  let remaining = seconds;
  io.emit('timerUpdate', { remaining, phase });

  timerInterval = setInterval(() => {
    remaining -= 1;
    io.emit('timerUpdate', { remaining, phase });
    if (remaining <= 0) {
      clearTimers();
      onDone();
    }
  }, 1000);
}

// ============================================================
//  ФАЗЫ ИГРЫ
// ============================================================

function startDiscussion() {
  gameState.phase = 'discussion';
  gameState.votes = new Map();
  gameState.forceVoteRequests = new Set();
  gameState.players.forEach(p => { p.cardsOpenedThisRound = 0; });

  io.emit('newRound', {
    round:   gameState.round,
    players: publicPlayers(gameState),
  });

  startCountdown(gameState.timerDuration, 'discussion', startVoting);
}

function startVoting() {
  gameState.phase = 'voting';
  gameState.votes = new Map();

  const alive = getAlivePlayers(gameState);

  io.emit('votingStarted', {
    players: publicPlayers(gameState),
    total:   alive.length,
  });

  // 90 секунд на голосование, потом принудительный подсчёт
  startCountdown(90, 'voting', finishVoting);
}

function finishVoting() {
  clearTimers();

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
    eliminatedCards: eliminated?.cards,    // раскрыть все карты выбывшего
    voteCounts:      result.voteCounts,
    tie:             result.tie,
    noVotes:         result.noVotes,
    players:         publicPlayers(gameState),
    gameOver,
    survivors: gameOver
      ? alive.map(p => ({ id: p.id, name: p.name }))
      : null,
  });

  if (!gameOver) {
    // Пауза 6 сек, потом новый раунд
    setTimeout(startDiscussion, 6000);
  } else {
    gameState.phase = 'ended';
  }
}

// ============================================================
//  SOCKET.IO СОБЫТИЯ
// ============================================================

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // Новый сокет получает текущее состояние
  socket.emit('currentState', {
    phase:   gameState.phase,
    players: publicPlayers(gameState),
  });

  // ──────────────────────────────────
  //  JOIN
  // ──────────────────────────────────
  socket.on('joinGame', ({ name }) => {
    const res = handleJoin(gameState, socket.id, name);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    const me = gameState.players.get(socket.id);
    socket.emit('joinedGame', { playerId: socket.id, isHost: me.isHost });
    io.emit('updatePlayers', { players: publicPlayers(gameState) });
  });

  // ──────────────────────────────────
  //  START
  // ──────────────────────────────────
  socket.on('startGame', ({ survivorsCount, timerDuration }) => {
    const me = gameState.players.get(socket.id);
    if (!me?.isHost) return;

    const res = handleStartGame(gameState, survivorsCount, timerDuration);
    if (res.error) { socket.emit('gameError', res.error); return; }
    gameState = res.state;

    // Отправить приватные карты каждому
    gameState.players.forEach((p, id) => {
      io.to(id).emit('playerData', { cards: p.cards });
    });

    io.emit('gameStarted', {
      catastrophe:    gameState.catastrophe,
      players:        publicPlayers(gameState),
      round:          gameState.round,
      survivorsTarget: gameState.survivorsTarget,
    });

    // 2 сек пауза на показ катастрофы, потом старт таймера
    setTimeout(() => startCountdown(gameState.timerDuration, 'discussion', startVoting), 2000);
  });

  // ──────────────────────────────────
  //  OPEN CARD
  // ──────────────────────────────────
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
    });
  });

  // ──────────────────────────────────
  //  VOTE
  // ──────────────────────────────────
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
      clearTimers();
      setTimeout(finishVoting, 800);
    }
  });

  // ──────────────────────────────────
  //  FORCE VOTING REQUEST
  // ──────────────────────────────────
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
      clearTimers();
      startVoting();
    }
  });

  // ──────────────────────────────────
  //  CHAT
  // ──────────────────────────────────
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

  // ──────────────────────────────────
  //  RESET (хост)
  // ──────────────────────────────────
  socket.on('resetGame', () => {
    const me = gameState.players.get(socket.id);
    if (!me?.isHost) return;
    clearTimers();

    // Сохранить игроков, сбросить всё остальное
    const savedPlayers = new Map();
    let firstPlayer = true;
    gameState.players.forEach((p, id) => {
      savedPlayers.set(id, {
        id, name: p.name,
        isHost:               firstPlayer,
        status:               'alive',
        cards:                null,
        openedCards:          {},
        cardsOpenedThisRound: 0,
      });
      firstPlayer = false;
    });

    gameState = createGame();
    gameState.players = savedPlayers;

    io.emit('gameReset', { players: publicPlayers(gameState) });
  });

  // ──────────────────────────────────
  //  DISCONNECT
  // ──────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const wasHost = player.isHost;
    gameState.players.delete(socket.id);

    // Переназначить хоста
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

    // Если в голосовании все уже проголосовали — считаем результат
    if (gameState.phase === 'voting') {
      const alive = getAlivePlayers(gameState);
      if (alive.length > 0 && gameState.votes.size >= alive.length) {
        clearTimers();
        setTimeout(finishVoting, 800);
      }
      // Если живых <= target — конец
      if (alive.length <= gameState.survivorsTarget) {
        clearTimers();
        finishVoting();
      }
    }
  });
});

// ============================================================
//  СТАРТ
// ============================================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
