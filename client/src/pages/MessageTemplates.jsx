import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiSave,
  FiRotateCcw,
  FiLoader,
  FiMessageSquare,
  FiTag,
  FiSmartphone,
  FiCheckCircle,
} from 'react-icons/fi';
import { templateService } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const MessageTemplates = () => {
  const [templates, setTemplates] = useState({ late: '', absent: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('late');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saving, templates]);

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
      toast.error('Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        templateService.updateTemplate({ type: 'late', template: templates.late }),
        templateService.updateTemplate({ type: 'absent', template: templates.absent }),
      ]);
      toast.success('Custom templates saved successfully');
    } catch {
      toast.error('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await templateService.resetTemplates();
      if (res.success) {
        const map = {};
        res.data.templates.forEach((t) => {
          map[t.type] = t.template;
        });
        setTemplates(map);
        setShowResetConfirm(false);
        toast.success('Templates restored to defaults');
      }
    } catch {
      toast.error('Failed to reset templates');
    }
  };

  const insertVariable = (variable) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = templates[activeTab] || '';
    const newText = text.substring(0, start) + variable + text.substring(end);
    setTemplates((prev) => ({ ...prev, [activeTab]: newText }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
        <p className="text-slate-700 font-semibold text-sm">Loading Notification Templates...</p>
      </div>
    );
  }

  const currentTemplate = templates[activeTab] || '';

  return (
    <div className="space-y-5 animate-fadeIn">
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Templates"
        message="This will restore both templates to the default institutional message format. Your customizations will be lost."
        confirmText="Reset to Defaults"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Message <span className="wave-text">Templates</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
          Configure automated WhatsApp text templates for late and absent notifications
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="bg-mint-100/70 p-1.5 rounded-2xl border border-mint-200 max-w-md shadow-2xs">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab('late')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'late'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700'
                : 'text-slate-700 hover:text-slate-950 hover:bg-mint-200/60'
            }`}
          >
            <span>Late Arrival Template</span>
          </button>
          <button
            onClick={() => setActiveTab('absent')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'absent'
                ? 'bg-rose-600 text-white shadow-sm border border-rose-700'
                : 'text-slate-700 hover:text-slate-950 hover:bg-mint-200/60'
            }`}
          >
            <span>Absentee Alert Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-mint-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-display">
                <FiMessageSquare className="text-teal-700" />
                {activeTab === 'late' ? 'Late Arrival' : 'Absent Notice'} Message Body
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {currentTemplate.length} characters
              </span>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={currentTemplate}
                onChange={(e) =>
                  setTemplates((prev) => ({ ...prev, [activeTab]: e.target.value }))
                }
                rows={9}
                className="input-field font-mono text-sm leading-relaxed resize-none p-4"
                placeholder="Compose template message..."
              />
            </div>

            {/* Variable Insertion Chips */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FiTag className="text-teal-700" /> Dynamic Insertion Tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: '{{studentName}}', label: 'Student Name' },
                  { tag: '{{registerNumber}}', label: 'Register No' },
                  { tag: '{{date}}', label: 'Current Date' },
                  { tag: '{{time}}', label: 'Current Time' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => insertVariable(item.tag)}
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg bg-mint-50 border border-mint-300 text-xs font-mono font-bold text-teal-900 hover:bg-mint-200 transition flex items-center gap-1 shadow-xs cursor-pointer btn-bounce"
                  >
                    <span>+</span> {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="btn-mint font-bold"
              disabled={saving}
            >
              {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
              Save Template
            </button>
            <button onClick={() => setShowResetConfirm(true)} className="btn-secondary">
              <FiRotateCcw /> Reset Defaults
            </button>
          </div>
        </div>

        {/* Live Smartphone WhatsApp Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 space-y-3 border border-mint-200 shadow-sm">
            <div className="flex items-center gap-2">
              <FiSmartphone className="text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                Real-Time WhatsApp Parent Preview
              </h3>
            </div>

            <div className="rounded-2xl bg-[#0b141a] border border-slate-700 overflow-hidden shadow-md">
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

              <div className="p-4 min-h-[220px] bg-[#0c1317] flex flex-col justify-end space-y-2 relative">
                <div className="relative max-w-[90%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tl-none p-3 shadow-md text-xs leading-relaxed font-sans whitespace-pre-wrap break-words border border-[#00705a]/50">
                  {getPreview(currentTemplate) || 'Type template text on the left to see live preview...'}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-[#8696a0] font-mono">
                    <span>
                      {new Date().toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    <span className="text-[#53bdeb] font-bold">&#10003;&#10003;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTemplates;
