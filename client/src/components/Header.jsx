import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiActivity, FiSmartphone } from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const Header = () => {
  const location = useLocation();
  const { whatsappStatus } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/students', label: 'Import Students' },
    { to: '/upload', label: 'Upload Absentees' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/history', label: 'History' },
    { to: '/settings', label: 'Settings' },
  ];

  const getLinkClassName = (path) => {
    const isActive = location.pathname === path;
    return isActive
      ? 'text-[#0f172a] text-sm font-extrabold border-b-2 border-emerald-600 pb-1 leading-normal transition-all'
      : 'text-slate-700 text-sm font-semibold hover:text-[#0f172a] hover:font-bold transition-all duration-200 pb-1';
  };

  return (
    <header className="sticky top-0 z-40 w-full pt-3 sm:pt-4 px-4 sm:px-6 md:px-8 mb-2">
      <div className="w-full max-w-[1400px] mx-auto bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-mint-200 shadow-sm px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Left Section: Logo & Brand + Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white border border-mint-200 flex items-center justify-center p-1 shadow-sm overflow-hidden">
              <img
                src="/images/mseclogo.png"
                alt="MSEC Crest"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-emerald-100 text-emerald-900 font-bold text-xs">
                MSEC
              </div>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[#0f172a] text-base sm:text-lg font-bold tracking-tight">
                MSEC
              </span>
              <span className="wave-text text-base sm:text-lg font-bold tracking-normal pr-2">
                Notify
              </span>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={getLinkClassName(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Live WhatsApp Indicator & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {/* Quick WhatsApp Live Status Pill linking to Settings */}
          <Link
            to="/settings?tab=whatsapp"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-mint-50/80 hover:bg-mint-100 border border-mint-200 shadow-2xs transition"
            title="Configure WhatsApp Gateway"
          >
            {whatsappStatus.isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-xs font-bold text-emerald-800">
                  WhatsApp Online
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-xs font-bold text-rose-800">
                  WhatsApp Offline
                </span>
              </>
            )}
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-mint-100 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-mint-200 p-4 shadow-xl animate-slideUp space-y-2">
          {/* Mobile Navigation List */}
          <nav className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  location.pathname === link.to
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-mint-50 hover:text-slate-900'
                }`}
              >
                <span>{link.label}</span>
                {link.to === '/whatsapp' && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      whatsappStatus.isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

