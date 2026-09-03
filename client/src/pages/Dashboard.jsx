import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSmartphone,
  FiUsers,
  FiSend,
  FiClock,
  FiArrowRight,
  FiActivity,
  FiCheckSquare,
  FiShield,
  FiUpload,
} from 'react-icons/fi';
import { settingsService } from '../services/api';
import { useApp } from '../context/AppContext';
import AnimatedCounter from '../components/AnimatedCounter';
import { SkeletonStatCard } from '../components/Skeleton';
import BackToTop from '../components/BackToTop';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { whatsappStatus } = useApp();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await settingsService.getDashboard();
      if (res.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white text-2xl sm:text-3xl shrink-0 animate-pulse">
            <FiShield />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-56 bg-mint-100 rounded-xl animate-pulse" />
            <div className="h-3.5 w-72 bg-mint-50 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="bg-white rounded-2xl border border-mint-200 p-6 animate-pulse space-y-4">
          <div className="h-5 w-48 bg-mint-100 rounded-lg" />
          <div className="h-16 bg-mint-50 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalStudents = data?.totalStudents || 0;
  const lateMarks = data?.lateCount || 0;
  const absentMarks = data?.absentCount || 0;
  const messagesToday = data?.messagesSentToday || 0;
  const presentCount = Math.max(0, totalStudents - lateMarks - absentMarks);

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      sub: 'Active Student Directory',
      icon: <FiUsers className="w-10 h-10 opacity-80" />,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      textSub: 'text-blue-700',
      bgSub: 'bg-blue-50',
      textLabel: 'text-blue-100',
    },
    {
      label: 'Present Today',
      value: presentCount,
      sub: 'On-time verified roster',
      icon: <FiCheckSquare className="w-10 h-10 opacity-80" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      textSub: 'text-emerald-800',
      bgSub: 'bg-emerald-50',
      textLabel: 'text-emerald-100',
    },
    {
      label: "Today's Late",
      value: lateMarks,
      sub: 'Late arrival parent intimations',
      icon: <FiClock className="w-10 h-10 opacity-80" />,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      textSub: 'text-purple-700',
      bgSub: 'bg-purple-50',
      textLabel: 'text-purple-100',
    },
    {
      label: "Today's Absent",
      value: absentMarks,
      sub: `${messagesToday} messages dispatched today`,
      icon: <FiSend className="w-10 h-10 opacity-80" />,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      textSub: 'text-orange-800',
      bgSub: 'bg-orange-50',
      textLabel: 'text-orange-100',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Title Header */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white text-2xl sm:text-3xl shrink-0">
          <FiShield />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            User <span className="text-emerald-700">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Smart Attendance, Leave & Late Arrival Alert Management
          </p>
        </div>
      </div>

      {/* 4 Stats Cards with Animated Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.bg} rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border ${stat.border} overflow-hidden stagger-row`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`bg-gradient-to-r ${stat.gradient} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${stat.textLabel} text-xs font-bold uppercase tracking-wider`}>
                    {stat.label}
                  </p>
                  <p className="text-3xl lg:text-4xl font-black text-white mt-1 font-mono">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </div>
                <div className={`${stat.textLabel}`}>{stat.icon}</div>
              </div>
            </div>
            <div className={`${stat.bgSub} px-5 py-2.5 text-xs ${stat.textSub} font-bold border-t ${stat.border}`}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp Gateway Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-mint-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 sm:px-6 py-4 border-b border-mint-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FiSmartphone className="text-emerald-700 text-xl" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
              WhatsApp Gateway Management
            </h2>
          </div>
          <Link
            to="/settings?tab=whatsapp"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1"
          >
            Configure Session &rarr;
          </Link>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-mint-50/60 border border-mint-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  whatsappStatus.isConnected
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                }`}
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Connection Status:{' '}
                  <span
                    className={
                      whatsappStatus.isConnected ? 'text-emerald-700' : 'text-rose-700'
                    }
                  >
                    {whatsappStatus.isConnected ? 'Active & Paired' : 'Disconnected (Scan Required)'}
                  </span>
                </p>
                <p className="text-xs font-mono text-slate-600 mt-0.5">
                  {whatsappStatus.phoneNumber
                    ? `Paired Device: ${whatsappStatus.phoneNumber}`
                    : 'No active WhatsApp session paired.'}
                </p>
              </div>
            </div>

            <Link
              to="/settings?tab=whatsapp"
              className="btn-mint text-xs py-2 px-4 font-bold shrink-0 self-start sm:self-auto"
            >
              {whatsappStatus.isConnected ? 'Manage Gateway' : 'Scan QR & Connect'}
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Quick Actions Workflow Grid */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
          <FiActivity className="text-emerald-700" /> Academic Operations & Dispatch Workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              to: '/attendance',
              icon: <FiCheckSquare size={20} />,
              title: 'Daily Roll Call',
              desc: 'Mark Present, Late, or Absent and dispatch instant WhatsApp alerts.',
              footer: 'Start Attendance',
              iconBg: 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-500 group-hover:text-white',
              hoverBorder: 'hover:border-emerald-400',
              footerText: 'text-emerald-700',
            },
            {
              to: '/students',
              icon: <FiUsers size={20} />,
              title: 'Import Students',
              desc: 'Manage registered class roster and parent mobile numbers.',
              footer: 'Class Roster',
              iconBg: 'bg-teal-100 text-teal-800 group-hover:bg-teal-500 group-hover:text-white',
              hoverBorder: 'hover:border-teal-400',
              footerText: 'text-teal-700',
            },
            {
              to: '/upload',
              icon: <FiUpload size={20} />,
              title: 'Upload Absentees',
              desc: 'Upload absent student list spreadsheet to dispatch alerts.',
              footer: 'Upload Absentees',
              iconBg: 'bg-blue-100 text-blue-800 group-hover:bg-blue-500 group-hover:text-white',
              hoverBorder: 'hover:border-blue-400',
              footerText: 'text-blue-700',
            },
            {
              to: '/history',
              icon: <FiClock size={20} />,
              title: 'Dispatch History',
              desc: 'Review delivery receipts, failed notifications, and export Excel logs.',
              footer: 'Audit Logs',
              iconBg: 'bg-purple-100 text-purple-800 group-hover:bg-purple-500 group-hover:text-white',
              hoverBorder: 'hover:border-purple-400',
              footerText: 'text-purple-700',
            },
          ].map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={`bg-white p-5 rounded-2xl border border-mint-200 shadow-sm hover:shadow-md ${item.hoverBorder} transition-all group flex flex-col justify-between stagger-row`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${item.iconBg}`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold ${item.footerText}`}>
                {item.footer} <FiArrowRight className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BackToTop />
    </div>
  );
};

export default Dashboard;
