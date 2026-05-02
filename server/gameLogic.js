const { getRandomCards, getRandomCatastrophe } = require('./cards');
const { generateRoundEvent } = require('./events');

// ============================================================
//  СОЗДАНИЕ ИГРЫ
// ============================================================

function createGame() {
  return {
    players: new Map(),
    phase: 'lobby',
    round: 1,
    catastrophe: null,
    survivorsTarget: 2,
    timerDuration: 120,
    votes: new Map(),
    forceVoteRequests: new Set(),
    roundEvent: null,
  };
}

// ============================================================
//  JOIN
// ============================================================

function handleJoin(state, socketId, name) {
  if (state.phase !== 'lobby') {
    return { error: 'Игра уже идёт — нельзя войти' };
  }
  if (state.players.size >= 12) {
    return { error: 'Комната заполнена (макс. 12)' };
  }

  const trimmed = (name || '').trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { error: 'Имя: от 2 до 20 символов' };
  }

  const nameTaken = Array.from(state.players.values())
    .some(p => p.name.toLowerCase() === trimmed.toLowerCase());
  if (nameTaken) {
    return { error: 'Это имя уже занято' };
  }

  const isHost = state.players.size === 0;

  state.players.set(socketId, {
    id: socketId,
    name: trimmed,
    isHost,
    status: 'alive',
    ready: false, // 🔥 ДОБАВИЛИ
    cards: null,
    openedCards: {},
    cardsOpenedThisRound: 0,
  });

  return { state };
}

// ============================================================
//  TOGGLE READY
// ============================================================

function handleToggleReady(state, socketId) {
  if (state.phase !== 'lobby') {
    return { error: 'Можно менять готовность только в лобби' };
  }

  const player = state.players.get(socketId);

  if (!player) {
    return { error: 'Игрок не найден' };
  }

  player.ready = !player.ready;

  return { state };
}

// ============================================================
//  START GAME
// ============================================================

function handleStartGame(state, survivorsCount, timerDuration) {
  if (state.players.size < 2) {
    return { error: 'Нужно минимум 2 игрока' };
  }

  // 🔥 Проверка готовности (по желанию)
  const allReady = Array.from(state.players.values()).every(p => p.ready);
  if (!allReady) {
    return { error: 'Не все игроки готовы' };
  }

  const maxSurvivors = Math.max(1, state.players.size - 1);
  state.survivorsTarget = Math.max(1, Math.min(Number(survivorsCount) || 2, maxSurvivors));
  state.timerDuration   = Math.max(60, Math.min(Number(timerDuration) || 120, 300));
  state.catastrophe     = getRandomCatastrophe();
  state.phase           = 'discussion';
  state.round           = 1;
  state.votes           = new Map();
  state.forceVoteRequests = new Set();

  state.players.forEach(player => {
    player.cards               = getRandomCards();
    player.openedCards         = {};
    player.cardsOpenedThisRound = 0;
    player.status              = 'alive';
  });

  const alive = Array.from(state.players.values()).filter(p => p.status === 'alive');
  state.roundEvent = generateRoundEvent(alive);

  return { state };
}

// ============================================================
//  OPEN CARD
// ============================================================

function handleOpenCard(state, socketId, cardType) {
  if (state.phase !== 'discussion') {
    return { error: 'Карты открываются только во время обсуждения' };
  }

  const player = state.players.get(socketId);
  if (!player || player.status !== 'alive') {
    return { error: 'Игрок не найден' };
  }
  if (player.cardsOpenedThisRound >= 2) {
    return { error: 'Лимит раунда — 2 карты' };
  }
  if (player.openedCards[cardType]) {
    return { error: 'Карта уже открыта' };
  }

  const validTypes = ['profession', 'health', 'biology', 'fact', 'hobby', 'baggage'];
  if (!validTypes.includes(cardType)) {
    return { error: 'Неверный тип карты' };
  }

  player.openedCards[cardType] = player.cards[cardType];
  player.cardsOpenedThisRound += 1;

  return {
    state,
    event: {
      playerName: player.name,
      cardType,
      cardValue: player.cards[cardType],
    },
  };
}

// ============================================================
//  VOTE
// ============================================================

function handleVote(state, socketId, targetId) {
  if (state.phase !== 'voting') {
    return { error: 'Голосование ещё не началось' };
  }

  const voter  = state.players.get(socketId);
  const target = state.players.get(targetId);

  if (!voter  || voter.status  !== 'alive') return { error: 'Вы не можете голосовать' };
  if (!target || target.status !== 'alive') return { error: 'Нельзя голосовать за этого игрока' };
  if (socketId === targetId)                return { error: 'Нельзя голосовать за себя' };
  if (state.votes.has(socketId))            return { error: 'Вы уже проголосовали' };

  state.votes.set(socketId, targetId);

  const alive = Array.from(state.players.values()).filter(p => p.status === 'alive');
  const votingComplete = state.votes.size >= alive.length;

  return { state, votingComplete };
}

// ============================================================
//  FORCE VOTING
// ============================================================

function handleForceVoting(state, socketId) {
  if (state.phase !== 'discussion') return { error: 'Нельзя' };

  const player = state.players.get(socketId);
  if (!player || player.status !== 'alive') return { error: 'Нельзя' };

  state.forceVoteRequests.add(socketId);

  const alive = Array.from(state.players.values()).filter(p => p.status === 'alive');
  const needed = Math.ceil(alive.length / 2);

  return { state, startVoting: state.forceVoteRequests.size >= needed };
}

// ============================================================
//  HELPERS
// ============================================================

function getAlivePlayers(state) {
  return Array.from(state.players.values()).filter(p => p.status === 'alive');
}

module.exports = {
  createGame,
  handleJoin,
  handleStartGame,
  handleOpenCard,
  handleVote,
  handleForceVoting,
  processVotingResult,
  generateNewRoundEvent,
  getAlivePlayers,
  handleToggleReady,      // 🔥 НОВАЯ ФУНКЦИЯ
};