const { createGame } = require('./gameLogic');

const rooms = new Map();
const roomTimers = new Map();

function getRoom(roomId) { return rooms.get(roomId); }
function setRoom(roomId, state) { rooms.set(roomId, state); }
function createRoom(roomId) { rooms.set(roomId, createGame()); }
function cleanupRoomIfEmpty(roomId) {
  const state = rooms.get(roomId);
  if (state && state.players.size === 0) {
    rooms.delete(roomId);
    roomTimers.delete(roomId);
    console.log(`🗑️ Комната ${roomId} удалена (пуста)`);
  }
}
function getRoomTimers(roomId) { return roomTimers.get(roomId) || {}; }
function setRoomTimer(roomId, name, timer) {
  if (!roomTimers.has(roomId)) roomTimers.set(roomId, {});
  const timers = roomTimers.get(roomId);
  if (timers[name]) clearTimeout(timers[name]);
  timers[name] = timer;
}
function clearRoomTimer(roomId, name) {
  const timers = roomTimers.get(roomId);
  if (timers && timers[name]) {
    clearTimeout(timers[name]);
    delete timers[name];
  }
}
function clearAllRoomTimers(roomId) {
  const timers = roomTimers.get(roomId);
  if (timers) {
    Object.values(timers).forEach(timer => clearTimeout(timer));
    roomTimers.delete(roomId);
  }
}

module.exports = {
  getRoom, setRoom, createRoom, cleanupRoomIfEmpty,
  getRoomTimers, setRoomTimer, clearRoomTimer, clearAllRoomTimers
};
