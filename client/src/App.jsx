import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import WhatsApp from './pages/WhatsApp';
import StudentUpload from './pages/StudentUpload';
import StudentDirectory from './pages/StudentDirectory';
import Attendance from './pages/Attendance';
import MessageTemplates from './pages/MessageTemplates';
import NotificationHistory from './pages/NotificationHistory';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #2dd4bf',
                boxShadow: '0 8px 24px rgba(20, 184, 166, 0.25)',
                fontWeight: '600',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#059669', secondary: '#fff' },
                duration: 3000,
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
                duration: 6000,
              },
            }}
          />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="students" element={<StudentDirectory />} />
              <Route path="upload" element={<StudentUpload />} />
              <Route path="history" element={<NotificationHistory />} />
              <Route path="settings" element={<Settings />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="templates" element={<MessageTemplates />} />
            </Route>
          </Routes>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
