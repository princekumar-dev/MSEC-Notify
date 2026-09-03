import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiSearch,
  FiDownload,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiList,
  FiPhone,
} from 'react-icons/fi';
import { historyService } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import HighlightText from '../components/HighlightText';
import ConfirmDialog from '../components/ConfirmDialog';
import BackToTop from '../components/BackToTop';

const NotificationHistory = () => {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { page, limit, nextPage, prevPage } = usePagination();

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [page, search, statusFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await historyService.getHistory({ page, limit, search, status: statusFilter });
      if (res.success) {
        setHistory(res.data.history);
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to fetch notification history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await historyService.getStats();
      if (res.success) setStats(res.data);
    } catch {}
  };

  const handleExport = async () => {
    try {
      const res = await historyService.exportHistory();
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'MSEC_Notification_History.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Notification history exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await historyService.deleteHistory(selectedIds);
      toast.success(`Deleted ${selectedIds.length} records`);
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchHistory();
      fetchStats();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map((h) => h._id));
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Records"
        message={`Permanently delete ${selectedIds.length} selected notification records? This action cannot be undone.`}
        confirmText="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Notification <span className="text-emerald-700">History</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            {pagination.total} WhatsApp notification records logged
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExport} className="btn-mint font-bold">
            <FiDownload /> Export Excel Log
          </button>
          {selectedIds.length > 0 && (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
              <FiTrash2 /> Delete Records ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Summary Performance Stat Pods */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Today Dispatched', value: stats.totalToday, border: 'border-teal-300', text: 'text-teal-900' },
            { label: 'Delivered Today', value: stats.deliveredToday, border: 'border-emerald-300', text: 'text-emerald-800' },
            { label: 'Failed Today', value: stats.failedToday, border: 'border-rose-300', text: 'text-rose-800' },
            { label: 'All-Time Total', value: stats.totalAll, border: 'border-mint-300', text: 'text-mint-900' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`bg-white p-4 rounded-2xl text-center border ${s.border} shadow-sm stagger-row`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className={`text-2xl font-black font-mono ${s.text}`}>{s.value}</p>
              <p className="text-xs uppercase tracking-wider font-extrabold text-slate-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-mint-200 p-3.5 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, register number, or parent mobile..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-48 font-bold text-slate-900 bg-white"
        >
          <option value="">All Delivery Status</option>
          <option value="delivered">Delivered Only</option>
          <option value="failed">Failed Only</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-mint-200 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
            <p className="text-xs font-mono text-slate-600 font-bold">Loading historical dispatches...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-600 space-y-3">
            <FiList className="mx-auto text-teal-600" size={32} />
            <p className="text-base font-bold text-slate-900">No Transmission History Records</p>
            <p className="text-xs text-slate-500">Dispatched WhatsApp alerts will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === history.length && history.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Register No</th>
                  <th className="px-4 py-3.5">Parent Mobile</th>
                  <th className="px-4 py-3.5">Attendance</th>
                  <th className="px-4 py-3.5">Date / Time</th>
                  <th className="px-4 py-3.5 text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans bg-white">
                {history.map((item, i) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-mint-50/50 transition stagger-row ${
                      selectedIds.includes(item._id) ? 'bg-mint-100/50' : ''
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelect(item._id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-900">
                      <HighlightText text={item.studentName} searchTerm={search} />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-teal-800">
                      <HighlightText text={item.registerNumber} searchTerm={search} />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        <FiPhone size={13} className="text-teal-700" />
                        <HighlightText text={item.phone} searchTerm={search} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`status-badge uppercase text-[10px] ${
                          item.attendanceStatus === 'late'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                        }`}
                      >
                        {item.attendanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-medium text-slate-600">
                      {item.date} {item.time}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`status-badge text-[11px] font-bold ${
                          item.deliveryStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {item.deliveryStatus === 'delivered' ? 'Delivered' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-mint-200 bg-mint-50/50">
            <p className="text-xs font-mono font-semibold text-slate-600">
              Showing Page <span className="text-teal-800 font-bold">{page}</span> of{' '}
              <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={nextPage}
                disabled={page >= pagination.totalPages}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <BackToTop />
    </div>
  );
};

export default NotificationHistory;
