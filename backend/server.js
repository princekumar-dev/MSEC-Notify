import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import net from 'net';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import connectDatabase from './config/database.js';
import logger from './utils/logger.js';
import whatsAppService from './services/whatsapp.js';
import queueService from './services/queue.js';

import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['websocket', 'polling'],
});

whatsAppService.setSocketIO(io);
queueService.setSocketIO(io);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MSEC Parent Connect API is running' });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.emit('whatsapp:status', whatsAppService.getStatus());
  socket.emit('queue:status', queueService.getStatus());

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
};

const findAvailablePort = async (startPort) => {
  let port = startPort;
  const maxPort = startPort + 10;

  while (port <= maxPort) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  return null;
};

const startServer = async () => {
  logger.info('Loading environment variables...');

  if (process.env.MONGODB_URI) {
    logger.info('MongoDB URI loaded successfully.');
  }

  const connected = await connectDatabase();

  if (!connected) {
    logger.error('Unable to connect to MongoDB Atlas. Exiting application.');
    process.exit(1);
  }

  const configuredPort = parseInt(process.env.PORT) || 5000;

  logger.info('Checking port...');

  let port = configuredPort;

  if (!(await isPortAvailable(port))) {
    logger.info(`Port ${port} is already in use.`);

    const nextPort = await findAvailablePort(port + 1);

    if (!nextPort) {
      logger.error('No available ports found within range. Exiting.');
      process.exit(1);
    }

    logger.info(`Using port ${nextPort}...`);
    port = nextPort;
  }

  server.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
  });
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export { app, server, io };
