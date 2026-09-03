import { NotificationHistory } from '../models/index.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import * as XLSX from 'xlsx';
import logger from '../utils/logger.js';

export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', date = '' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.deliveryStatus = status;
    if (date) query.date = date;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await NotificationHistory.countDocuments(query);
    const history = await NotificationHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return ApiSuccess(res, 'History fetched', {
      history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get history error:', error);
    return ApiError(res, 'Failed to fetch history', 500);
  }
};

export const getHistoryStats = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const totalToday = await NotificationHistory.countDocuments({ date: today });
    const deliveredToday = await NotificationHistory.countDocuments({ date: today, deliveryStatus: 'delivered' });
    const failedToday = await NotificationHistory.countDocuments({ date: today, deliveryStatus: 'failed' });
    const totalAll = await NotificationHistory.countDocuments();

    return ApiSuccess(res, 'Stats fetched', {
      totalToday,
      deliveredToday,
      failedToday,
      totalAll,
    });
  } catch (error) {
    logger.error('Get history stats error:', error);
    return ApiError(res, 'Failed to fetch stats', 500);
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return ApiError(res, 'No IDs provided', 400);
    }
    await NotificationHistory.deleteMany({ _id: { $in: ids } });
    logger.info(`Deleted ${ids.length} history records`);
    return ApiSuccess(res, 'History deleted');
  } catch (error) {
    logger.error('Delete history error:', error);
    return ApiError(res, 'Failed to delete history', 500);
  }
};

export const exportHistory = async (req, res) => {
  try {
    const history = await NotificationHistory.find({}).sort({ createdAt: -1 });
    const exportData = history.map((h) => ({
      'Student Name': h.studentName,
      'Register Number': h.registerNumber,
      Phone: h.phone,
      'Attendance Status': h.attendanceStatus,
      Message: h.message,
      Date: h.date,
      Time: h.time,
      'Delivery Status': h.deliveryStatus,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Notification History');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=notification_history.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    logger.error('Export history error:', error);
    return ApiError(res, 'Failed to export history', 500);
  }
};
