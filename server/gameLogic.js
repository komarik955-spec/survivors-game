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
    cards: null,
    openedCards: {},
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

  // Генерируем первое событие раунда
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
//  ГЕНЕРАЦИЯ СОБЫТИЯ ДЛЯ НОВОГО РАУНДА
// ============================================================

function generateNewRoundEvent(state) {
  const { generateRoundEvent } = require('./events');
  // Новый events.js не требует аргументов, просто возвращает случайное событие
  const rawEvent = generateRoundEvent();
  
  // Создаём чисто информационное событие без механик и без имён
  state.roundEvent = {
    icon: rawEvent.icon,
    title: rawEvent.title,
    description: rawEvent.description,
    effect: { type: 'none' },
    effectLabel: '',
    effectText: ''
  };
  
  return state;
}
// ============================================================
//  PROCESS VOTING RESULT (с учётом эффектов события)
// ============================================================

function processVotingResult(state) {
  const alive = Array.from(state.players.values()).filter(p => p.status === 'alive');
  const event  = state.roundEvent;
  const effect = event?.effect || { type: 'none' };

  const voteCounts = {};
  alive.forEach(p => { voteCounts[p.id] = 0; });

  state.votes.forEach((targetId) => {
    if (!voteCounts.hasOwnProperty(targetId)) return;

    if (effect.type === 'penalty' && effect.targetId === targetId) {
      voteCounts[targetId] += 2;
    } else {
      voteCounts[targetId] += 1;
    }
  });

  if (effect.type === 'immunity' && voteCounts.hasOwnProperty(effect.targetId)) {
    voteCounts[effect.targetId] = 0;
  }

  const allZero = Object.values(voteCounts).every(v => v === 0);
  if (allZero && alive.length > 0) {
    const candidates = effect.type === 'immunity'
      ? alive.filter(p => p.id !== effect.targetId)
      : alive;
    const pool = candidates.length ? candidates : alive;
    const unlucky = pool[Math.floor(Math.random() * pool.length)];
    return { eliminatedId: unlucky.id, voteCounts, tie: false, noVotes: true };
  }

  let candidates;
  if (effect.type === 'protect' && voteCounts.hasOwnProperty(effect.targetId)) {
    const protectedVotes = voteCounts[effect.targetId];
    const othersMax = Math.max(
      ...Object.entries(voteCounts)
        .filter(([id]) => id !== effect.targetId)
        .map(([, v]) => v),
      0
    );
    const adjustedCounts = { ...voteCounts };
    if (protectedVotes - othersMax < 2) {
      adjustedCounts[effect.targetId] = 0;
    }
    const maxV  = Math.max(...Object.values(adjustedCounts));
    candidates  = Object.keys(adjustedCounts).filter(id => adjustedCounts[id] === maxV && adjustedCounts[id] > 0);
    if (!candidates.length) {
      const unlucky = alive[Math.floor(Math.random() * alive.length)];
      return { eliminatedId: unlucky.id, voteCounts, tie: false, noVotes: true };
    }
  } else {
    const maxV = Math.max(...Object.values(voteCounts));
    candidates = Object.keys(voteCounts).filter(id => voteCounts[id] === maxV);
  }

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
  generateNewRoundEvent,
  getAlivePlayers,
};