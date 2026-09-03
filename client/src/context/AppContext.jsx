import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';
import { whatsappService, queueService } from '../services/api';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConnected: false,
    isConnecting: false,
    phoneNumber: null,
    profileName: null,
    connectedAt: null,
  });
  const [qrCode, setQrCode] = useState(null);
  const [queueStatus, setQueueStatus] = useState({
    queueSize: 0,
    isProcessing: false,
    isPaused: false,
    completed: 0,
    failed: 0,
    currentStudent: null,
    total: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchWhatsappStatus = useCallback(async () => {
    try {
      const res = await whatsappService.getStatus();
      if (res.success) setWhatsappStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status', err);
    }
  }, []);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const res = await queueService.getStatus();
      if (res.success) setQueueStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch queue status', err);
    }
  }, []);

  useEffect(() => {
    fetchWhatsappStatus();
    fetchQueueStatus();

    socket.on('whatsapp:status', (status) => setWhatsappStatus(status));
    socket.on('whatsapp:qr', ({ qr }) => setQrCode(qr));
    socket.on('whatsapp:connecting', ({ isConnecting }) => {
      setWhatsappStatus((prev) => ({ ...prev, isConnecting }));
    });
    socket.on('whatsapp:logged_out', () => {
      setWhatsappStatus({
        isConnected: false,
        isConnecting: false,
        phoneNumber: null,
        profileName: null,
        connectedAt: null,
      });
      setQrCode(null);
    });
    socket.on('whatsapp:error', () => {
      setWhatsappStatus((prev) => ({ ...prev, isConnecting: false }));
    });
    socket.on('queue:status', (status) => setQueueStatus(status));
    socket.on('queue:progress', (status) => setQueueStatus(status));
    socket.on('queue:completed', (status) => setQueueStatus(status));

    return () => {
      socket.off('whatsapp:status');
      socket.off('whatsapp:qr');
      socket.off('whatsapp:connecting');
      socket.off('whatsapp:logged_out');
      socket.off('whatsapp:error');
      socket.off('queue:status');
      socket.off('queue:progress');
      socket.off('queue:completed');
    };
  }, [fetchWhatsappStatus, fetchQueueStatus]);

  const value = {
    whatsappStatus,
    qrCode,
    setQrCode,
    queueStatus,
    sidebarOpen,
    setSidebarOpen,
    fetchWhatsappStatus,
    fetchQueueStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
