import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiSmartphone,
  FiMessageSquare,
  FiSliders,
  FiSave,
  FiRotateCcw,
  FiLoader,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiSend,
} from 'react-icons/fi';
import { settingsService, templateService, whatsappService } from '../services/api';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import BackToTop from '../components/BackToTop';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'whatsapp';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { whatsappStatus, fetchWhatsappStatus } = useApp();

  // Settings State
  const [settings, setSettings] = useState({
    collegeName: '',
    teacherName: '',
    messageDelayMin: 4000,
    messageDelayMax: 6000,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState({});

  // Template State
  const [templates, setTemplates] = useState({ late: '', absent: '' });
  const [activeTemplateTab, setActiveTemplateTab] = useState('late');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [showResetTemplatesConfirm, setShowResetTemplatesConfirm] = useState(false);
  const textareaRef = useRef(null);

  // WhatsApp State
  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loadingWhatsApp, setLoadingWhatsApp] = useState({});
  const qrIntervalRef = useRef(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  // WhatsApp QR Polling
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

  // Keyboard shortcut: Ctrl+S to save settings/templates
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab === 'general' && !savingSettings) handleSaveSettings();
        if (activeTab === 'templates' && !savingTemplates) handleSaveTemplates();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, savingSettings, savingTemplates, settings, templates]);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.success) setSettings(res.data.settings);
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      const res = await templateService.getTemplates();
      if (res.success) {
        const map = {};
        res.data.templates.forEach((t) => {
          map[t.type] = t.template;
        });
        setTemplates(map);
      }
    } catch {
      toast.error('Failed to load message templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Validate settings
  const validateSettings = useCallback(() => {
    const errs = {};
    if (!settings.collegeName.trim()) errs.collegeName = 'Institution name is required';
    if (!settings.teacherName.trim()) errs.teacherName = 'Faculty name is required';
    if (settings.messageDelayMin < 2000) errs.messageDelayMin = 'Minimum delay is 2000ms';
    if (settings.messageDelayMax < settings.messageDelayMin) errs.messageDelayMax = 'Max delay must be greater than min';
    setSettingsErrors(errs);
    return Object.keys(errs).length === 0;
  }, [settings]);

  // Save Settings
  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      toast.error('Please fix the validation errors');
      return;
    }
    try {
      setSavingSettings(true);
      const res = await settingsService.updateSettings(settings);
      if (res.success) {
        setSettings(res.data.settings);
        toast.success('System configuration saved successfully');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Save Templates
  const handleSaveTemplates = async () => {
    try {
      setSavingTemplates(true);
      await Promise.all([
        templateService.updateTemplate({ type: 'late', template: templates.late }),
        templateService.updateTemplate({ type: 'absent', template: templates.absent }),
      ]);
      toast.success('Message templates saved successfully');
    } catch {
      toast.error('Failed to save templates');
    } finally {
      setSavingTemplates(false);
    }
  };

  // Reset Templates
  const handleResetTemplates = async () => {
    try {
      const res = await templateService.resetTemplates();
      if (res.success) {
        const map = {};
        res.data.templates.forEach((t) => {
          map[t.type] = t.template;
        });
        setTemplates(map);
        setShowResetTemplatesConfirm(false);
        toast.success('Templates restored to defaults');
      }
    } catch {
      toast.error('Failed to reset templates');
    }
  };

  // Insert Variable Tag into Template
  const insertVariable = (variable) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = templates[activeTemplateTab] || '';
    const newText = text.substring(0, start) + variable + text.substring(end);
    setTemplates((prev) => ({ ...prev, [activeTemplateTab]: newText }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  // WhatsApp Connect
  const handleConnectWhatsApp = async () => {
    try {
      setLoadingWhatsApp((prev) => ({ ...prev, connect: true }));
      setQrImage(null);
      setQrLoading(true);
      await whatsappService.connect();
      toast.success('Initializing session. Fetching QR code...');
      startQrPolling();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate WhatsApp session');
      setQrLoading(false);
    } finally {
      setLoadingWhatsApp((prev) => ({ ...prev, connect: false }));
    }
  };

  // WhatsApp Disconnect
  const handleDisconnectWhatsApp = async () => {
    try {
      setLoadingWhatsApp((prev) => ({ ...prev, disconnect: true }));
      stopQrPolling();
      setQrImage(null);
      await whatsappService.disconnect();
      toast.success('WhatsApp session disconnected');
    } catch (err) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setLoadingWhatsApp((prev) => ({ ...prev, disconnect: false }));
    }
  };

  // WhatsApp New QR
  const handleNewQR = async () => {
    try {
      setLoadingWhatsApp((prev) => ({ ...prev, newQR: true }));
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
      setLoadingWhatsApp((prev) => ({ ...prev, newQR: false }));
    }
  };

  // Validate phone inline
  const validatePhone = useCallback((val) => {
    if (!val) { setPhoneError(''); return true; }
    if (!/^\d+$/.test(val)) { setPhoneError('Only digits allowed'); return false; }
    if (val.length < 10) { setPhoneError('Must be 10 digits'); return false; }
    setPhoneError('');
    return true;
  }, []);

  // WhatsApp Test Message
  const handleTestMessage = async () => {
    if (!validatePhone(testPhone)) return;
    if (!testPhone || testPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      setLoadingWhatsApp((prev) => ({ ...prev, test: true }));
      await whatsappService.sendTestMessage(testPhone);
      toast.success('Test WhatsApp message delivered successfully!');
      setTestPhone('');
      setPhoneError('');
    } catch (err) {
      toast.error(err.message || 'Failed to send test message');
    } finally {
      setLoadingWhatsApp((prev) => ({ ...prev, test: false }));
    }
  };

  const getPreview = (template) => {
    if (!template) return '';
    return template
      .replace(/\{\{studentName\}\}/g, 'Aaditya M')
      .replace(/\{\{registerNumber\}\}/g, '311521104001')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))
      .replace(
        /\{\{time\}\}/g,
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
  };

  const showQrSection = (qrImage || qrLoading) && !whatsappStatus.isConnected;

  return (
    <div className="space-y-6 animate-fadeIn">
      <ConfirmDialog
        open={showResetTemplatesConfirm}
        title="Reset Message Templates"
        message="This will restore both templates to the default institutional message format. Your customizations will be lost."
        confirmText="Reset to Defaults"
        onConfirm={handleResetTemplates}
        onCancel={() => setShowResetTemplatesConfirm(false)}
      />

      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            System <span className="wave-text">Settings</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            Configure WhatsApp gateway pairing, alert message templates, and academic preferences
          </p>
        </div>
      </div>

      {/* Main Settings Tab Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-mint-200/90 shadow-2xs inline-flex flex-wrap gap-1.5">
        {[
          { key: 'whatsapp', icon: <FiSmartphone size={16} />, label: 'WhatsApp Gateway' },
          { key: 'templates', icon: <FiMessageSquare size={16} />, label: 'Message Templates' },
          { key: 'general', icon: <FiSliders size={16} />, label: 'General Preferences' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-mint-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.key === 'whatsapp' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  whatsappStatus.isConnected ? 'bg-emerald-300' : 'bg-rose-400'
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: WHATSAPP GATEWAY */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
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
                      Gateway Engine:
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
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {whatsappStatus.isConnected
                      ? 'Ready to process queued bulk notification dispatches to parents'
                      : 'Requires mobile device session scan to authorize notifications'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {!whatsappStatus.isConnected && !whatsappStatus.isConnecting && (
                  <button
                    onClick={handleConnectWhatsApp}
                    className="btn-mint font-bold w-full sm:w-auto justify-center"
                    disabled={loadingWhatsApp.connect}
                  >
                    {loadingWhatsApp.connect ? <FiLoader className="animate-spin" /> : <FiWifi />}
                    Connect Session
                  </button>
                )}
                {whatsappStatus.isConnected && (
                  <button
                    onClick={handleDisconnectWhatsApp}
                    className="btn-danger w-full sm:w-auto justify-center"
                    disabled={loadingWhatsApp.disconnect}
                  >
                    {loadingWhatsApp.disconnect ? <FiLoader className="animate-spin" /> : <FiWifiOff />}
                    Terminate Session
                  </button>
                )}
                {!whatsappStatus.isConnected && (
                  <button
                    onClick={handleNewQR}
                    className="btn-secondary w-full sm:w-auto justify-center"
                    disabled={loadingWhatsApp.newQR}
                  >
                    {loadingWhatsApp.newQR ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
                    Refresh QR
                  </button>
                )}
              </div>
            </div>

            {/* Live Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="bg-mint-50/70 p-4 rounded-xl border border-mint-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Paired Phone Number
                </span>
                <p className="text-base font-black font-mono text-teal-900">
                  {whatsappStatus.phoneNumber || <span className="text-slate-400 font-sans font-medium">N/A</span>}
                </p>
              </div>

              <div className="bg-mint-50/70 p-4 rounded-xl border border-mint-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Profile / Device Name
                </span>
                <p className="text-base font-extrabold text-slate-900 truncate">
                  {whatsappStatus.profileName || <span className="text-slate-400 font-medium">Unpaired</span>}
                </p>
              </div>

              <div className="bg-mint-50/70 p-4 rounded-xl border border-mint-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
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

          {/* QR Code Section with Scanning Laser */}
          {showQrSection && (
            <div className="bg-white rounded-2xl p-8 text-center space-y-5 border-2 border-teal-400 shadow-md animate-slideUp">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Scan WhatsApp QR Code
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
                  Open WhatsApp &rarr; Linked Devices &rarr; Tap <strong className="text-teal-800">Link a Device</strong> and point camera at the screen.
                </p>
              </div>

              {qrLoading && !qrImage && (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
                  <p className="text-xs font-mono text-slate-600 font-bold">Initializing session & fetching QR code...</p>
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
            <div className="bg-white rounded-2xl p-6 sm:p-7 space-y-4 border border-mint-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <FiSend className="text-teal-700" size={18} />
                <h2 className="text-base font-extrabold text-slate-900 font-display">
                  Test Message Dispatcher
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Verify message delivery latency by sending a test alert to your phone number.
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
                  disabled={loadingWhatsApp.test || !testPhone || testPhone.length < 10}
                >
                  {loadingWhatsApp.test ? <FiLoader className="animate-spin" /> : <FiSend />}
                  Send Test Alert
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MESSAGE TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-mint-100/70 p-1.5 rounded-2xl border border-mint-200 max-w-md shadow-2xs">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTemplateTab('late')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTemplateTab === 'late'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-mint-200/60'
                }`}
              >
                <span>Late Arrival Template</span>
              </button>
              <button
                onClick={() => setActiveTemplateTab('absent')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTemplateTab === 'absent'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-mint-200/60'
                }`}
              >
                <span>Absentee Template</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Column */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 space-y-4 border border-mint-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  {activeTemplateTab === 'late' ? 'Late Template Body' : 'Absentee Template Body'}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {templates[activeTemplateTab]?.length || 0} characters
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={templates[activeTemplateTab] || ''}
                onChange={(e) =>
                  setTemplates((prev) => ({ ...prev, [activeTemplateTab]: e.target.value }))
                }
                placeholder="Compose template message..."
                rows={8}
                className="input-field font-mono text-sm leading-relaxed resize-y bg-slate-50/50"
              />

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                  Dynamic Insertion Tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { tag: '{{studentName}}', label: 'Student Name' },
                    { tag: '{{registerNumber}}', label: 'Register No' },
                    { tag: '{{date}}', label: 'Date' },
                    { tag: '{{time}}', label: 'Time' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariable(item.tag)}
                      className="px-2.5 py-1 rounded-lg bg-mint-50 hover:bg-emerald-100 text-teal-900 border border-mint-200 text-xs font-mono font-bold transition-all cursor-pointer btn-bounce"
                    >
                      + {item.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveTemplates}
                  className="btn-mint font-bold"
                  disabled={savingTemplates}
                >
                  {savingTemplates ? <FiLoader className="animate-spin" /> : <FiSave />}
                  Save Templates
                </button>
                <button onClick={() => setShowResetTemplatesConfirm(true)} className="btn-secondary">
                  <FiRotateCcw /> Reset Defaults
                </button>
              </div>
            </div>

            {/* Live WhatsApp Phone Preview Column */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-mint-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <FiSmartphone className="text-teal-700" size={16} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Real-time WhatsApp Preview
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-[#0b141a] shadow-lg">
                <div className="bg-[#202c33] p-3 flex items-center gap-3 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-teal-400 flex items-center justify-center p-0.5">
                    <img src="/images/mseclogo.png" alt="MSEC Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-white truncate">MSEC Notify</p>
                      <FiCheckCircle className="text-emerald-400 shrink-0" size={12} />
                    </div>
                    <p className="text-[10px] text-slate-400">Institutional Gateway</p>
                  </div>
                </div>

                <div className="p-4 min-h-[220px] max-h-[300px] overflow-y-auto flex flex-col justify-end bg-[#0b141a]">
                  <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs font-sans leading-relaxed shadow-sm max-w-[90%] self-end">
                    <p className="whitespace-pre-wrap font-mono">
                      {getPreview(templates[activeTemplateTab]) || 'Type template text on the left to see live preview...'}
                    </p>
                    <div className="text-[9px] text-emerald-200 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      <span className="text-sky-300">&#10003;&#10003;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL ACADEMIC PREFERENCES */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 space-y-6 border border-mint-200 shadow-2xs">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block font-display">
                  Institution / College Name
                </label>
                <input
                  type="text"
                  value={settings.collegeName}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, collegeName: e.target.value }));
                    if (settingsErrors.collegeName) setSettingsErrors((p) => ({ ...p, collegeName: '' }));
                  }}
                  className={`input-field font-bold text-slate-900 ${settingsErrors.collegeName ? 'input-error' : ''}`}
                  placeholder="e.g. Meenakshi Sundararajan Engineering College"
                />
                {settingsErrors.collegeName && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 ml-1">{settingsErrors.collegeName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block font-display">
                  Faculty In-Charge / Teacher Signature
                </label>
                <input
                  type="text"
                  value={settings.teacherName}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, teacherName: e.target.value }));
                    if (settingsErrors.teacherName) setSettingsErrors((p) => ({ ...p, teacherName: '' }));
                  }}
                  className={`input-field font-semibold text-slate-900 ${settingsErrors.teacherName ? 'input-error' : ''}`}
                  placeholder="e.g. Dr. K. Ramesh (HOD / Attendance Coordinator)"
                />
                {settingsErrors.teacherName && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 ml-1">{settingsErrors.teacherName}</p>
                )}
              </div>
            </div>

            {/* Dispatch Throttling Configuration */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <FiClock className="text-teal-700" />
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  WhatsApp Dispatch Throttling & Delay Range (Milliseconds)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Delay inserted between outbound WhatsApp messages to ensure reliable delivery rates and prevent account suspension.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-mint-50/70 p-4 rounded-xl border border-mint-200 space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block font-mono">
                    Minimum Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.messageDelayMin}
                    onChange={(e) => {
                      const val = Math.max(2000, parseInt(e.target.value) || 2000);
                      setSettings((prev) => ({ ...prev, messageDelayMin: val }));
                      if (settingsErrors.messageDelayMin) setSettingsErrors((p) => ({ ...p, messageDelayMin: '' }));
                    }}
                    min={2000}
                    max={10000}
                    step={500}
                    className={`input-field font-mono text-teal-900 font-black ${settingsErrors.messageDelayMin ? 'input-error' : ''}`}
                  />
                  <span className="text-[11px] text-slate-400 font-semibold block">Recommended: 3,000ms - 4,000ms</span>
                  {settingsErrors.messageDelayMin && (
                    <p className="text-[11px] text-rose-600 font-semibold">{settingsErrors.messageDelayMin}</p>
                  )}
                </div>

                <div className="bg-mint-50/70 p-4 rounded-xl border border-mint-200 space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block font-mono">
                    Maximum Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.messageDelayMax}
                    onChange={(e) => {
                      const val = Math.min(15000, Math.max(3000, parseInt(e.target.value) || 3000));
                      setSettings((prev) => ({ ...prev, messageDelayMax: val }));
                      if (settingsErrors.messageDelayMax) setSettingsErrors((p) => ({ ...p, messageDelayMax: '' }));
                    }}
                    min={3000}
                    max={15000}
                    step={500}
                    className={`input-field font-mono text-teal-900 font-black ${settingsErrors.messageDelayMax ? 'input-error' : ''}`}
                  />
                  <span className="text-[11px] text-slate-400 font-semibold block">Recommended: 6,000ms - 8,000ms</span>
                  {settingsErrors.messageDelayMax && (
                    <p className="text-[11px] text-rose-600 font-semibold">{settingsErrors.messageDelayMax}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                className="btn-mint font-bold"
                disabled={savingSettings}
              >
                {savingSettings ? <FiLoader className="animate-spin" /> : <FiCheck />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default Settings;
