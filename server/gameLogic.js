const { getRandomCards, getRandomCatastrophe } = require('./cards');

// ============================================================
//  СОЗДАНИЕ ИГРЫ
// ============================================================

function createGame() {
  return {
    players: new Map(),       // socketId → playerObj
    phase: 'lobby',           // lobby | discussion | voting | result | ended
    round: 1,
    catastrophe: null,
    survivorsTarget: 2,
    timerDuration: 120,       // секунды обсуждения
    votes: new Map(),         // voterId → targetId
    forceVoteRequests: new Set(),
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
    cards: null,
    openedCards: {},           // { cardType: cardObj }  — что открыто
    cardsOpenedThisRound: 0,
  });

  return { state };
}

// ============================================================
//  START GAME
// ============================================================

function handleStartGame(state, survivorsCount, timerDuration) {
  if (state.players.size < 2) {
    return { error: 'Нужно минимум 2 игрока' };
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

  player.openedCards[cardType]   = player.cards[cardType];
  player.cardsOpenedThisRound   += 1;

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
//  FORCE VOTING REQUEST
// ============================================================

function handleForceVoting(state, socketId) {
  if (state.phase !== 'discussion') return { error: 'Нельзя' };

  const player = state.players.get(socketId);
  if (!player || player.status !== 'alive') return { error: 'Нельзя' };

  state.forceVoteRequests.add(socketId);

  const alive    = Array.from(state.players.values()).filter(p => p.status === 'alive');
  const needed   = Math.ceil(alive.length / 2);
  const startVoting = state.forceVoteRequests.size >= needed;

  return { state, startVoting };
}

// ============================================================
//  PROCESS VOTING RESULT
// ============================================================

function processVotingResult(state) {
  const alive = Array.from(state.players.values()).filter(p => p.status === 'alive');

  // Инициализируем счётчики для всех живых
  const voteCounts = {};
  alive.forEach(p => { voteCounts[p.id] = 0; });

  state.votes.forEach((targetId) => {
    if (voteCounts.hasOwnProperty(targetId)) {
      voteCounts[targetId] += 1;
    }
  });

  // Если никто не голосовал — случайное исключение
  const allZero = Object.values(voteCounts).every(v => v === 0);
  if (allZero && alive.length > 0) {
    const unlucky = alive[Math.floor(Math.random() * alive.length)];
    return { eliminatedId: unlucky.id, voteCounts, tie: false, noVotes: true };
  }

  const maxVotes  = Math.max(...Object.values(voteCounts));
  const candidates = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
  const tie        = candidates.length > 1;
  const eliminatedId = candidates[Math.floor(Math.random() * candidates.length)];

  return { eliminatedId, voteCounts, tie, noVotes: false };
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
  getAlivePlayers,
};
