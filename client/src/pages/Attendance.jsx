import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  FiSave,
  FiRotateCcw,
  FiSend,
  FiCheck,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiLoader,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { attendanceService, queueService } from '../services/api';
import { useApp } from '../context/AppContext';
import HighlightText from '../components/HighlightText';
import ConfirmDialog from '../components/ConfirmDialog';
import BackToTop from '../components/BackToTop';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { whatsappStatus, fetchQueueStatus } = useApp();

  useEffect(() => {
    fetchStudents();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving && students.length > 0) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saving, students]);

  const fetchStudents = async () => {
    try {
      const res = await attendanceService.getStudentsWithAttendance();
      if (res.success) {
        setStudents(res.data.students);
        const map = {};
        res.data.students.forEach((s) => {
          map[s._id] = s.status || 'present';
        });
        setAttendance(map);
      }
    } catch {
      toast.error('Failed to load student attendance roster');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendance(updated);
    toast.success(`Marked all ${students.length} students as ${status.toUpperCase()}`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await attendanceService.saveAttendance(attendanceData);
      toast.success('Daily attendance saved successfully');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset = {};
    students.forEach((s) => {
      reset[s._id] = 'present';
    });
    setAttendance(reset);
    setShowResetConfirm(false);
    toast.success('Attendance reset to all Present');
  };

  const handleSendNotifications = async () => {
    if (!whatsappStatus.isConnected) {
      toast.error('WhatsApp is disconnected. Please scan QR in WhatsApp Gateway tab.');
      return;
    }
    try {
      setSending(true);
      await queueService.startQueue();
      fetchQueueStatus();
      toast.success('Notification broadcast queue started!');
    } catch (err) {
      toast.error(err.message || 'Failed to start notification queue');
    } finally {
      setSending(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const notifyCount = lateCount + absentCount;

  const filteredStudents = students.filter(
    (s) =>
      s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
        <p className="text-slate-700 font-semibold text-sm">Loading Attendance Sheet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Attendance"
        message="This will mark all students as Present. Any unsaved changes will be lost."
        confirmText="Reset All"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Daily <span className="text-emerald-700">Attendance</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {students.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs btn-bounce"
            >
              <FiCheckCircle size={14} /> Mark All Present
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs btn-bounce"
            >
              <FiRotateCcw size={13} /> Reset
            </button>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mint-200/80 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-mint-50 border border-mint-200 flex items-center justify-center mx-auto text-teal-700">
            <FiUsers size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Students Found</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Import student records via Excel to start tracking daily attendance.
          </p>
          <Link to="/upload" className="btn-mint inline-flex justify-center">
            Upload Student Roster
          </Link>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-mint-200/80 p-3 flex items-center gap-3 shadow-2xs">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or register number..."
                className="input-field pl-10"
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 px-3 py-2 rounded-xl bg-mint-50 border border-mint-200 shrink-0">
              {filteredStudents.length} / {students.length} Students
            </span>
          </div>

          {/* Student Attendance Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-mint-200/80 shadow-2xs">
            <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-left">
                <thead className="table-header sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center text-xs font-bold text-slate-500">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-700">Register Number</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-700">Student Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans bg-white">
                  {filteredStudents.map((student, i) => {
                    const status = attendance[student._id] || 'present';
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors stagger-row ${
                          status === 'absent'
                            ? 'bg-rose-50/60 hover:bg-rose-50'
                            : status === 'late'
                            ? 'bg-amber-50/60 hover:bg-amber-50'
                            : 'hover:bg-mint-50/40'
                        }`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-4 py-3 text-xs text-center font-mono text-slate-400 font-semibold">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-teal-800">
                          <HighlightText text={student.registerNumber} searchTerm={searchTerm} />
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">
                          <HighlightText text={student.studentName} searchTerm={searchTerm} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusChange(student._id, 'present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer btn-bounce ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500 font-extrabold'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <FiCheck size={13} />
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(student._id, 'late')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer btn-bounce ${
                                status === 'late'
                                  ? 'bg-amber-400 text-slate-950 shadow-2xs ring-1 ring-amber-400 font-extrabold'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <FiAlertTriangle size={13} />
                              Late
                            </button>
                            <button
                              onClick={() => handleStatusChange(student._id, 'absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer btn-bounce ${
                                status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-2xs ring-1 ring-rose-500 font-extrabold'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <FiXCircle size={13} />
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Bottom Summary Control Deck */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-mint-200 p-3.5 shadow-lg">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full md:w-auto text-center font-mono">
                <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <p className="text-base font-black text-emerald-800">{presentCount}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 font-sans">Present</p>
                </div>
                <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  <p className="text-base font-black text-amber-800">{lateCount}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 font-sans">Late</p>
                </div>
                <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  <p className="text-base font-black text-rose-800">{absentCount}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 font-sans">Absent</p>
                </div>
                <div className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                  <p className="text-base font-black text-teal-900">{students.length}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 font-sans">Total</p>
                </div>
                <div className="bg-mint-100 px-3 py-1.5 rounded-xl border border-mint-300">
                  <p className="text-base font-black text-mint-950">{notifyCount}</p>
                  <p className="text-[10px] uppercase font-extrabold text-slate-700 font-sans">To Alert</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={handleSave}
                  className="btn-mint font-bold"
                  disabled={saving}
                >
                  {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                  Save Roster
                </button>
                <button
                  onClick={handleSendNotifications}
                  className="btn-teal font-bold"
                  disabled={sending || !whatsappStatus.isConnected || notifyCount === 0}
                  title={
                    !whatsappStatus.isConnected
                      ? 'Connect WhatsApp first'
                      : notifyCount === 0
                      ? 'No Late or Absent students to notify'
                      : 'Send notifications'
                  }
                >
                  {sending ? <FiLoader className="animate-spin" /> : <FiSend />}
                  Broadcast Alerts ({notifyCount})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <BackToTop />
    </div>
  );
};

export default Attendance;
