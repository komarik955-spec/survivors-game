import { io } from 'socket.io-client';

// Пустой адрес — подключение к тому же хосту и порту, откуда пришла HTML-страница
const socket = io({
  autoConnect: true,
  reconnectionDelay: 1000,
});

export default socket;