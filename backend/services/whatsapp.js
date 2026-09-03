import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.phoneNumber = null;
    this.profileName = null;
    this.connectedAt = null;
    this.currentQr = null;
    this.io = null;
    this.authDir = path.join(__dirname, '..', 'sessions');
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
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      phoneNumber: this.phoneNumber,
      profileName: this.profileName,
      connectedAt: this.connectedAt,
    };
  }

  getQr() {
    if (this.isConnected) {
      return { connected: true, qr: null };
    }
    return { connected: false, qr: this.currentQr };
  }

  async connect() {
    if (this.isConnected) {
      logger.info('WhatsApp already connected');
      return { success: true, message: 'Already connected' };
    }

    if (this.isConnecting) {
      logger.info('WhatsApp connection already in progress');
      return { success: true, message: 'Connection in progress' };
    }

    this.isConnecting = true;
    this.currentQr = null;
    this.emit('whatsapp:connecting', { isConnecting: true });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['MSEC Parent Connect', 'Chrome', '120.0.0'],
        generateHighQualityLinkPreview: false,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.currentQr = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
            });
            logger.info('QR code generated and converted to base64');
            this.emit('whatsapp:qr', { qr: this.currentQr });
          } catch (qrError) {
            logger.error('Failed to convert QR to base64:', qrError.message);
            this.currentQr = null;
          }
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.info(`Connection closed. Status: ${statusCode}, Reconnect: ${shouldReconnect}`);

          this.isConnected = false;
          this.isConnecting = false;
          this.phoneNumber = null;
          this.profileName = null;
          this.connectedAt = null;
          this.currentQr = null;
          this.emit('whatsapp:status', this.getStatus());

          if (statusCode === DisconnectReason.loggedOut) {
            logger.info('Logged out from WhatsApp');
            this.emit('whatsapp:logged_out', {});
          }
        }

        if (connection === 'open') {
          logger.info('WhatsApp connected successfully');
          this.isConnected = true;
          this.isConnecting = false;
          this.connectedAt = new Date().toISOString();
          this.currentQr = null;

          const me = this.sock.user;
          this.phoneNumber = me?.id?.replace(/:.*@/, '@')?.split('@')[0] || 'Unknown';
          this.profileName = me?.name || 'Unknown';

          this.emit('whatsapp:status', this.getStatus());
          logger.info(`Connected as ${this.profileName} (${this.phoneNumber})`);
        }
      });

      return { success: true, message: 'Connection initiated. Scan QR code.' };
    } catch (error) {
      logger.error('WhatsApp connection error:', error);
      this.isConnecting = false;
      this.currentQr = null;
      this.emit('whatsapp:error', { message: error.message });
      return { success: false, message: error.message };
    }
  }

  async disconnect() {
    try {
      if (this.sock) {
        this.sock.end(undefined);
        this.sock = null;
      }

      this.isConnected = false;
      this.isConnecting = false;
      this.phoneNumber = null;
      this.profileName = null;
      this.connectedAt = null;
      this.currentQr = null;

      if (fs.existsSync(this.authDir)) {
        const files = fs.readdirSync(this.authDir);
        for (const file of files) {
          const filePath = path.join(this.authDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }

      this.emit('whatsapp:status', this.getStatus());
      logger.info('WhatsApp disconnected and session cleared');
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      logger.error('WhatsApp disconnect error:', error);
      return { success: false, message: error.message };
    }
  }

  async sendMessage(phone, message) {
    if (!this.isConnected || !this.sock) {
      throw new Error('WhatsApp is not connected');
    }

    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;

    try {
      const result = await this.sock.sendMessage(jid, { text: message });
      logger.info(`Message sent to ${phone}`);
      return { success: true, messageId: result.key.id };
    } catch (error) {
      logger.error(`Failed to send message to ${phone}:`, error.message);
      throw error;
    }
  }

  async checkNumberExists(phone) {
    if (!this.isConnected || !this.sock) {
      return false;
    }

    try {
      const jid = phone.replace(/\D/g, '');
      const [result] = await this.sock.onWhatsApp(jid + '@s.whatsapp.net');
      return result?.exists || false;
    } catch {
      return false;
    }
  }
}

const whatsAppService = new WhatsAppService();
export default whatsAppService;
