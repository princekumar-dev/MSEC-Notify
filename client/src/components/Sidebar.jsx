import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUpload,
  FiUsers,
  FiCheckSquare,
  FiMessageSquare,
  FiClock,
  FiSmartphone,
  FiSettings,
  FiX,
  FiActivity,
  FiBookOpen,
  FiSend,
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const navGroups = [
  {
    title: 'Academic Management',
    items: [
      { to: '/', icon: FiHome, label: 'Dashboard' },
      { to: '/attendance', icon: FiCheckSquare, label: 'Attendance Marking' },
      { to: '/students', icon: FiUsers, label: 'Student Directory' },
      { to: '/upload', icon: FiUpload, label: 'Batch & Roster Upload' },
    ],
  },
  {
    title: 'Parent Communication',
    items: [
      { to: '/templates', icon: FiMessageSquare, label: 'Message Templates' },
      { to: '/history', icon: FiClock, label: 'Notification History' },
      { to: '/whatsapp', icon: FiSmartphone, label: 'WhatsApp Gateway' },
    ],
  },
  {
    title: 'System & Config',
    items: [
      { to: '/settings', icon: FiSettings, label: 'Academic Settings' },
    ],
  },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, whatsappStatus } = useApp();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-mint-200/80 shadow-card-elevated z-50 transform transition-transform duration-300 ease-in-out flex flex-col justify-between
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className="flex items-center justify-between h-20 px-5 border-b border-mint-200/70 bg-gradient-to-r from-mint-50 to-emerald-100/60">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="w-11 h-11 rounded-xl bg-white border border-mint-300 flex items-center justify-center p-1 shadow-mint-sm overflow-hidden">
                  <img
                    src="/images/mseclogo.png"
                    alt="MSEC Crest"
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center bg-mint-100 text-mint-900 font-bold text-base">
                    MSEC
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight font-display">
                    MSEC
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300 font-mono">
                    SMART
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600 tracking-tight">
                  Academic Connect
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-mint-100 transition"
              aria-label="Close sidebar"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation Links Grouped for MSEC Academics */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  {group.title}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-mint-100 to-emerald-100 text-emerald-950 border border-mint-400 shadow-mint-sm font-bold'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-mint-50/80 hover:border hover:border-mint-200/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          className={`transition-colors duration-200 ${
                            isActive
                              ? 'text-emerald-700'
                              : 'text-slate-500 group-hover:text-teal-700'
                          }`}
                        />
                        <span className="font-semibold text-[13px]">{item.label}</span>
                        {item.to === '/whatsapp' && (
                          <span
                            className={`ml-auto w-2.5 h-2.5 rounded-full ${
                              whatsappStatus.isConnected
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                                : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* WhatsApp Connection Live Status Bottom Dock */}
        <div className="p-3 border-t border-mint-200/80 bg-mint-50/70">
          <div className="bg-white p-3 rounded-xl border border-mint-200 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FiActivity className="text-teal-600" /> WhatsApp Link
              </span>
              <span
                className={`status-badge text-[10px] font-bold ${
                  whatsappStatus.isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {whatsappStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {whatsappStatus.isConnected ? (
              <p className="text-xs text-slate-900 font-mono font-bold truncate">
                {whatsappStatus.phoneNumber || whatsappStatus.profileName}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">
                Scan QR to enable live notifications
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

