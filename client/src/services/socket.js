import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '/';

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Socket.IO connected');
});

socket.on('disconnect', () => {
  console.log('Socket.IO disconnected');
});

export default socket;
