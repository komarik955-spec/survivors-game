import { io } from 'socket.io-client';

// Подключение к серверу на Railway
const socket = io('survivors-game-production.up.railway.app', {
  autoConnect: true,
  reconnectionDelay: 1000,
});

export default socket;