import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiSmartphone,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiSend,
  FiLoader,
  FiCheckCircle,
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { whatsappService } from '../services/api';
import BackToTop from '../components/BackToTop';

const WhatsApp = () => {
  const { whatsappStatus, fetchWhatsappStatus } = useApp();
  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState({});
  const qrIntervalRef = useRef(null);

  const startQrPolling = () => {
    stopQrPolling();
    qrIntervalRef.current = setInterval(async () => {
      try {
        const res = await whatsappService.getQr();
        if (res.success) {
          if (res.data.connected) {
            setQrImage(null);
            stopQrPolling();
            fetchWhatsappStatus();
            toast.success('WhatsApp connected successfully!');
          } else if (res.data.qr) {
            setQrImage(res.data.qr);
            setQrLoading(false);
          }
        }
      } catch {
        // Silently retry
      }
    }, 2000);
  };

  const stopQrPolling = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopQrPolling();
  }, []);

  useEffect(() => {
    if (whatsappStatus.isConnected) {
      setQrImage(null);
      stopQrPolling();
    }
  }, [whatsappStatus.isConnected]);

  const handleConnect = async () => {
    try {
      setLoading((prev) => ({ ...prev, connect: true }));
      setQrImage(null);
      setQrLoading(true);
      await whatsappService.connect();
      toast.success('Initializing WhatsApp session. Fetching QR code...');
      startQrPolling();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate WhatsApp session');
      setQrLoading(false);
    } finally {
      setLoading((prev) => ({ ...prev, connect: false }));
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading((prev) => ({ ...prev, disconnect: true }));
      stopQrPolling();
      setQrImage(null);
      await whatsappService.disconnect();
      toast.success('WhatsApp session disconnected');
    } catch (err) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setLoading((prev) => ({ ...prev, disconnect: false }));
    }
  };

  const handleNewQR = async () => {
    try {
      setLoading((prev) => ({ ...prev, newQR: true }));
      stopQrPolling();
      setQrImage(null);
      setQrLoading(true);
      await whatsappService.disconnect();
      await new Promise((r) => setTimeout(r, 1000));
      await whatsappService.connect();
      toast.success('Generating fresh QR code...');
      startQrPolling();
    } catch (err) {
      toast.error(err.message || 'Failed to generate QR code');
      setQrLoading(false);
    } finally {
      setLoading((prev) => ({ ...prev, newQR: false }));
    }
  };

  const validatePhone = useCallback((val) => {
    if (!val) { setPhoneError(''); return true; }
    if (!/^\d+$/.test(val)) { setPhoneError('Only digits allowed'); return false; }
    if (val.length < 10) { setPhoneError('Must be 10 digits'); return false; }
    setPhoneError('');
    return true;
  }, []);

  const handleTestMessage = async () => {
    if (!validatePhone(testPhone)) return;
    if (!testPhone || testPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, test: true }));
      await whatsappService.sendTestMessage(testPhone);
      toast.success('Test WhatsApp message delivered successfully!');
      setTestPhone('');
      setPhoneError('');
    } catch (err) {
      toast.error(err.message || 'Failed to send test message');
    } finally {
      setLoading((prev) => ({ ...prev, test: false }));
    }
  };

  const showQrSection = (qrImage || qrLoading) && !whatsappStatus.isConnected;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          WhatsApp <span className="wave-text">Gateway</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
          Manage WhatsApp device pairing and message delivery socket
        </p>
      </div>

      {/* Status Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-mint-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 ${
                whatsappStatus.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {whatsappStatus.isConnected ? <FiWifi /> : <FiWifiOff />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold text-slate-900 font-display">
                  Gateway Engine Status:
                </span>
                <span
                  className={`status-badge uppercase text-xs font-mono font-black ${
                    whatsappStatus.isConnected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                      : 'bg-rose-100 text-rose-800 border border-rose-400'
                  }`}
                >
                  {whatsappStatus.isConnecting
                    ? 'CONNECTING...'
                    : whatsappStatus.isConnected
                    ? 'ACTIVE & PAIRED'
                    : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {whatsappStatus.isConnected
                  ? 'Ready to process queued bulk notification dispatches to parents'
                  : 'Requires mobile device session scan to authorize notifications'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {!whatsappStatus.isConnected && !whatsappStatus.isConnecting && (
              <button
                onClick={handleConnect}
                className="btn-mint font-bold w-full sm:w-auto justify-center"
                disabled={loading.connect}
              >
                {loading.connect ? <FiLoader className="animate-spin" /> : <FiWifi />}
                Connect Session
              </button>
            )}
            {whatsappStatus.isConnected && (
              <button
                onClick={handleDisconnect}
                className="btn-danger w-full sm:w-auto justify-center"
                disabled={loading.disconnect}
              >
                {loading.disconnect ? <FiLoader className="animate-spin" /> : <FiWifiOff />}
                Terminate Session
              </button>
            )}
            {!whatsappStatus.isConnected && (
              <button
                onClick={handleNewQR}
                className="btn-secondary w-full sm:w-auto justify-center"
                disabled={loading.newQR}
              >
                {loading.newQR ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
                Refresh QR
              </button>
            )}
          </div>
        </div>

        {/* Live Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-mint-50/70 p-4 rounded-2xl border border-mint-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
              Paired Phone Number
            </span>
            <p className="text-base font-black font-mono text-teal-900">
              {whatsappStatus.phoneNumber || <span className="text-slate-400 font-sans font-medium">N/A</span>}
            </p>
          </div>

          <div className="bg-mint-50/70 p-4 rounded-2xl border border-mint-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
              Profile / Device Name
            </span>
            <p className="text-base font-extrabold text-slate-900 truncate">
              {whatsappStatus.profileName || <span className="text-slate-400 font-medium">Unpaired</span>}
            </p>
          </div>

          <div className="bg-mint-50/70 p-4 rounded-2xl border border-mint-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
              Connected Timestamp
            </span>
            <p className="text-xs font-mono font-bold text-teal-950">
              {whatsappStatus.connectedAt
                ? new Date(whatsappStatus.connectedAt).toLocaleString('en-IN')
                : 'Session Idle'}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Section with Scanning Laser Animation */}
      {showQrSection && (
        <div className="bg-white rounded-3xl p-8 text-center space-y-5 border-2 border-teal-400 shadow-md animate-slideUp">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              Scan WhatsApp QR Code
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              Open WhatsApp on your mobile device &rarr; Tap Settings (or Menu) &rarr; Linked Devices &rarr; Tap <strong className="text-teal-800">Link a Device</strong> and point camera at the screen.
            </p>
          </div>

          {qrLoading && !qrImage && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
              <p className="text-xs font-mono text-slate-600 font-bold">Initializing socket connection & fetching QR code...</p>
            </div>
          )}

          {qrImage && (
            <div className="inline-block relative p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-xl">
              <img
                src={qrImage}
                alt="WhatsApp Session QR Code"
                className="w-64 h-64 mx-auto object-contain"
                onError={() => {
                  toast.error('Unable to display QR code frame');
                  setQrImage(null);
                }}
              />
              {/* Scanning laser overlay */}
              <div className="absolute inset-4 pointer-events-none overflow-hidden rounded-xl">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent scan-laser shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="text-slate-900 text-[11px] font-mono font-extrabold mt-2">
                Point Phone Camera Here
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Message Launcher */}
      {whatsappStatus.isConnected && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-mint-200 shadow-sm">
          <div className="flex items-center gap-2">
            <FiSend className="text-teal-700" size={20} />
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              Gateway Diagnostic / Test Dispatch
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Verify message delivery latency by dispatching a test template directly to your faculty phone number.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-teal-800">
                +91
              </span>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setTestPhone(val);
                  validatePhone(val);
                }}
                placeholder="Enter 10-digit mobile number"
                className={`input-field pl-12 font-mono ${phoneError ? 'input-error' : ''}`}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 ml-1">{phoneError}</p>
              )}
            </div>

            <button
              onClick={handleTestMessage}
              className="btn-mint font-bold justify-center"
              disabled={loading.test || !testPhone || testPhone.length < 10}
            >
              {loading.test ? <FiLoader className="animate-spin" /> : <FiSend />}
              Send Test Alert
            </button>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default WhatsApp;
