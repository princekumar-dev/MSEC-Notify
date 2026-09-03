import { Settings, Attendance, NotificationHistory, Student } from '../models/index.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    return ApiSuccess(res, 'Settings fetched', { settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    return ApiError(res, 'Failed to fetch settings', 500);
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { collegeName, teacherName, messageDelayMin, messageDelayMax } = req.body;

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({});
    }

    if (collegeName !== undefined) settings.collegeName = collegeName;
    if (teacherName !== undefined) settings.teacherName = teacherName;
    if (messageDelayMin !== undefined) settings.messageDelayMin = Math.max(2000, messageDelayMin);
    if (messageDelayMax !== undefined) settings.messageDelayMax = Math.min(15000, Math.max(3000, messageDelayMax));

    await settings.save();
    logger.info('Settings updated');
    return ApiSuccess(res, 'Settings updated', { settings });
  } catch (error) {
    logger.error('Update settings error:', error);
    return ApiError(res, 'Failed to update settings', 500);
  }
};

export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const totalStudents = await Student.countDocuments();
    const todayAttendance = await Attendance.find({ date: today });
    const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
    const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
    const messagesSentToday = await NotificationHistory.countDocuments({ date: today });
    const totalMessages = await NotificationHistory.countDocuments();

    const recentActivity = await NotificationHistory.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('studentName registerNumber attendanceStatus deliveryStatus date time createdAt');

    return ApiSuccess(res, 'Dashboard data fetched', {
      totalStudents,
      lateCount,
      absentCount,
      messagesSentToday,
      totalMessages,
      recentActivity,
      date: today,
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return ApiError(res, 'Failed to fetch dashboard', 500);
  }
};
