import { useApp } from '../context/AppContext';
import { FiSend, FiLoader, FiAlertCircle, FiClock } from 'react-icons/fi';

const QueueProgress = () => {
  const { queueStatus } = useApp();
  const { completed, failed, total, currentStudent, isPaused } = queueStatus;
  const processed = completed + failed;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const remaining = Math.max(0, total - processed);

  const estimatedSeconds = remaining * 5;
  const estimatedMin = Math.floor(estimatedSeconds / 60);
  const estimatedSec = estimatedSeconds % 60;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-72 lg:right-8 z-50 animate-slideUp">
      <div className="bg-white rounded-3xl p-5 border-2 border-mint-300 shadow-2xl backdrop-blur-2xl max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${
                  isPaused
                    ? 'bg-amber-500'
                    : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                }`}
              />
              {!isPaused && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
              <FiSend className="text-emerald-700" />
              {isPaused ? 'Notification Queue Paused' : 'Broadcasting Live WhatsApp Notifications'}
            </span>
          </div>
          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-mint-100 text-teal-900 border border-mint-300">
            {percentage}% ({processed}/{total})
          </span>
        </div>

        {/* Progress Bar with Shimmer Animation */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-4 p-0.5 border border-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-600 via-emerald-500 to-mint-400 shadow-sm relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {!isPaused && percentage > 0 && percentage < 100 && (
              <div className="absolute inset-0 progress-shimmer" />
            )}
          </div>
        </div>

        {/* Stats Pods */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center mb-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
            <p className="text-lg font-black font-mono text-emerald-800">{completed}</p>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600">Delivered</p>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-300">
            <p className="text-lg font-black font-mono text-rose-800">{failed}</p>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600">Failed</p>
          </div>
          <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-300">
            <p className="text-lg font-black font-mono text-teal-900">{remaining}</p>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600">Remaining</p>
          </div>
          <div className="bg-mint-50 p-2.5 rounded-xl border border-mint-300">
            <p className="text-lg font-black font-mono text-mint-900">
              {estimatedMin}m {estimatedSec}s
            </p>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600">Est. Time</p>
          </div>
        </div>

        {/* Current Recipient Stream */}
        {currentStudent && (
          <div className="flex items-center gap-2 text-xs text-slate-800 bg-mint-50/80 px-3 py-2 rounded-xl border border-mint-200 truncate font-mono">
            <FiLoader className="animate-spin text-emerald-700 shrink-0" />
            <span className="text-slate-600 font-semibold">Dispatching to:</span>
            <span className="text-slate-900 font-bold">{currentStudent.studentName}</span>
            <span className="text-slate-600 font-medium">({currentStudent.registerNumber})</span>
            <span className="text-teal-800 font-bold ml-auto">{currentStudent.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueProgress;
