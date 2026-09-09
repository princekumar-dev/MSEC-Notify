import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message, errors: error.response?.data?.errors });
  }
);

export const studentService = {
  getStudents: (params) => api.get('/students', { params }),
  getAllStudents: () => api.get('/students/all'),
  uploadStudents: (formData) => api.post('/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  bulkDeleteStudents: (ids) => api.post('/students/bulk-delete', { ids }),
  exportStudents: () => api.get('/students/export', { responseType: 'blob' }),
  getStudentCount: () => api.get('/students/count'),
};

export const attendanceService = {
  saveAttendance: (attendance) => api.post('/attendance', { attendance }),
  getTodayAttendance: () => api.get('/attendance/today'),
  getSummary: () => api.get('/attendance/summary'),
  getStudentsWithAttendance: () => api.get('/attendance/students'),
};

export const templateService = {
  getTemplates: () => api.get('/templates'),
  updateTemplate: (data) => api.put('/templates', data),
  resetTemplates: () => api.post('/templates/reset'),
};

export const historyService = {
  getHistory: (params) => api.get('/history', { params }),
  getStats: () => api.get('/history/stats'),
  deleteHistory: (ids) => api.post('/history/delete', { ids }),
  exportHistory: () => api.get('/history/export', { responseType: 'blob' }),
};

export const whatsappService = {
  getStatus: () => api.get('/whatsapp/status'),
  getQr: () => api.get('/whatsapp/qr'),
  connect: () => api.post('/whatsapp/connect'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  sendTestMessage: (phone) => api.post('/whatsapp/test-message', { phone }),
};

export const queueService = {
  startQueue: () => api.post('/queue/start'),
  pauseQueue: () => api.post('/queue/pause'),
  resumeQueue: () => api.post('/queue/resume'),
  clearQueue: () => api.post('/queue/clear'),
  getStatus: () => api.get('/queue/status'),
};

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  getDashboard: () => api.get('/settings/dashboard'),
};

export default api;
