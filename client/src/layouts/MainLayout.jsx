import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import QueueProgress from '../components/QueueProgress';
import BackToTop from '../components/BackToTop';

const MainLayout = () => {
  const { queueStatus } = useApp();

  return (
    <div className="min-h-screen bg-[#F0FDF9] text-slate-900 flex flex-col relative overflow-x-hidden font-sans">
      {/* Ambient lush mint and soft teal highlights */}
      <div className="fixed top-0 left-1/4 w-[36rem] h-[36rem] bg-mint-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[32rem] h-[32rem] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Floating / Rounded Horizontal Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 animate-fadeIn">
        <Outlet />
      </main>

      {queueStatus.isProcessing && <QueueProgress />}
      <BackToTop />
    </div>
  );
};

export default MainLayout;
