import { useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    },
    [onConfirm, onCancel]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm border-2 shadow-2xl animate-slideUp space-y-4"
        style={{ borderColor: danger ? '#fca5a5' : '#99f6e4' }}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                : 'bg-mint-100 text-teal-700 border border-mint-300'
            }`}
          >
            <FiAlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 font-display">{title}</h3>
            <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center text-sm">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 justify-center text-sm font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 ${
              danger
                ? 'bg-rose-600 text-white border border-rose-700 hover:bg-rose-700 shadow-sm'
                : 'btn-mint'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
