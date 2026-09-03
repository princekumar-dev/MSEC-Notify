import whatsAppService from '../services/whatsapp.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const getStatus = (req, res) => {
  const status = whatsAppService.getStatus();
  return ApiSuccess(res, 'WhatsApp status', status);
};

export const getQr = (req, res) => {
  const qrData = whatsAppService.getQr();

  if (qrData.connected) {
    return ApiSuccess(res, 'WhatsApp connected', { connected: true, qr: null });
  }

  if (qrData.qr) {
    return ApiSuccess(res, 'QR code ready', { connected: false, qr: qrData.qr });
  }

  return ApiSuccess(res, 'WhatsApp service is starting...', { connected: false, qr: null });
};

export const connect = async (req, res) => {
  try {
    const result = await whatsAppService.connect();
    return ApiSuccess(res, result.message);
  } catch (error) {
    logger.error('Connect error:', error);
    return ApiError(res, error.message, 500);
  }
};

export const disconnect = async (req, res) => {
  try {
    const result = await whatsAppService.disconnect();
    return ApiSuccess(res, result.message);
  } catch (error) {
    logger.error('Disconnect error:', error);
    return ApiError(res, error.message, 500);
  }
};

export const sendTestMessage = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return ApiError(res, 'Phone number is required', 400);
    }

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return ApiError(res, 'Invalid phone number', 400);
    }

    const jid = cleaned.length === 10 ? '91' + cleaned : cleaned;
    await whatsAppService.sendMessage(jid + '@s.whatsapp.net', 'This is a test message from MSEC Parent Connect.');
    return ApiSuccess(res, 'Test message sent successfully');
  } catch (error) {
    logger.error('Test message error:', error);
    return ApiError(res, 'Failed to send test message: ' + error.message, 500);
  }
};
