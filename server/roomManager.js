// roomManager.js
const { createGame, handleJoin, handleStartGame, handleOpenCard, handleVote, handleForceVoting, processVotingResult, generateNewRoundEvent, getAlivePlayers } = require('./gameLogic');

const rooms = new Map(); // roomId -> gameState

// Генерация короткого ID комнаты (например, 6 символов)
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Создать новую комнату
function createRoom() {
  const roomId = generateRoomId();
  rooms.set(roomId, createGame());
  return roomId;
}

// Получить состояние комнаты (если её нет, можно создать? лучше явно)
function getRoom(roomId) {
  return rooms.get(roomId);
}

// Удалить комнату если она пуста
function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑️ Комната ${roomId} удалена (пуста)`);
  }
}

// Обновить состояние комнаты
function setRoom(roomId, state) {
  rooms.set(roomId, state);
}

module.exports = { rooms, createRoom, getRoom, setRoom, cleanupRoom, generateRoomId };