import { io } from 'socket.io-client';

const socket = io('/', {
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
