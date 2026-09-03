import { NotificationHistory } from '../models/index.js';
import logger from '../utils/logger.js';
import { formatPhoneForWhatsApp, getRandomDelay, formatDate, formatTime } from '../utils/helpers.js';
import whatsAppService from './whatsapp.js';

class QueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.isPaused = false;
    this.completed = 0;
    this.failed = 0;
    this.currentStudent = null;
    this.io = null;
    this.abortController = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  emit(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  getStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      isPaused: this.isPaused,
      completed: this.completed,
      failed: this.failed,
      currentStudent: this.currentStudent,
      total: this.completed + this.failed + this.queue.length + (this.currentStudent ? 1 : 0),
    };
  }

  addBatch(items) {
    this.queue.push(...items);
    this.emit('queue:status', this.getStatus());
    logger.info(`Added ${items.length} items to queue`);
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
    this.isPaused = false;
    this.completed = 0;
    this.failed = 0;
    this.currentStudent = null;
    this.abortController = null;
    this.emit('queue:status', this.getStatus());
    logger.info('Queue cleared');
  }

  pause() {
    this.isPaused = true;
    this.emit('queue:status', this.getStatus());
    logger.info('Queue paused');
  }

  async resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    logger.info('Queue resumed');
    this.emit('queue:status', this.getStatus());
    await this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing && !this.isPaused) return;
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.emit('queue:completed', this.getStatus());
      logger.info(`Queue completed. Delivered: ${this.completed}, Failed: ${this.failed}`);
      return;
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    while (this.queue.length > 0 && !this.isPaused) {
      const item = this.queue.shift();
      this.currentStudent = item;

      this.emit('queue:progress', {
        ...this.getStatus(),
        currentStudent: item,
      });

      try {
        const formattedPhone = formatPhoneForWhatsApp(item.phone);
        await whatsAppService.sendMessage(formattedPhone, item.message);

        await NotificationHistory.create({
          studentName: item.studentName,
          registerNumber: item.registerNumber,
          phone: item.phone,
          attendanceStatus: item.status,
          message: item.message,
          date: item.date,
          time: item.time,
          deliveryStatus: 'delivered',
        });

        this.completed++;
        logger.info(`Message delivered to ${item.studentName} (${item.registerNumber})`);
      } catch (error) {
        this.failed++;
        logger.error(`Message failed to ${item.studentName}: ${error.message}`);

        await NotificationHistory.create({
          studentName: item.studentName,
          registerNumber: item.registerNumber,
          phone: item.phone,
          attendanceStatus: item.status,
          message: item.message,
          date: item.date,
          time: item.time,
          deliveryStatus: 'failed',
          failureReason: error.message,
        });
      }

      this.currentStudent = null;
      this.emit('queue:progress', this.getStatus());

      if (this.queue.length > 0 && !this.isPaused) {
        const delay = getRandomDelay(
          parseInt(process.env.MESSAGE_DELAY_MIN) || 4000,
          parseInt(process.env.MESSAGE_DELAY_MAX) || 6000
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (this.queue.length === 0 && !this.isPaused) {
      this.isProcessing = false;
      this.emit('queue:completed', this.getStatus());
      logger.info(`Queue completed. Delivered: ${this.completed}, Failed: ${this.failed}`);
    }
  }

  async startQueue(items, templateFn, date, time) {
    this.clear();

    const queueItems = items.map((item) => ({
      ...item,
      message: templateFn(item),
      date,
      time,
    }));

    this.addBatch(queueItems);
    await this.processQueue();
  }
}

const queueService = new QueueService();
export default queueService;
