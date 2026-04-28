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
  console.log('🎲 startDiscussion: начало раунда', gameState.round);
  gameState.phase = 'discussion';
  gameState.votes = new Map();
  gameState.forceVoteRequests = new Set();
  gameState.players.forEach(p => { p.cardsOpenedThisRound = 0; });

  // Генерируем событие раунда
  gameState = generateNewRoundEvent(gameState);
  const roundEvent = gameState.roundEvent;
  console.log('🎲 roundEvent после генерации:', roundEvent?.title);

  io.emit('newRound', {
    round:      gameState.round,
    players:    publicPlayers(gameState),
    roundEvent: roundEvent,
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
    console.log('🏁 Игра окончена');
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
      clearTimers();
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
      clearTimers();
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

    clearTimers();

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
        clearTimers();
        setTimeout(finishVoting, 800);
      }
      if (alive.length <= gameState.survivorsTarget) {
        clearTimers();
        finishVoting();
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен: http://localhost:${PORT}\n`);
});