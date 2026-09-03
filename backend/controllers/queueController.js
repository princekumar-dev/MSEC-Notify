import { Attendance, MessageTemplate, Student } from '../models/index.js';
import queueService from '../services/queue.js';
import whatsAppService from '../services/whatsapp.js';
import { previewMessage } from './templateController.js';
import { ApiSuccess, ApiError, formatDate, formatTime } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const getTodayDate = () => new Date().toLocaleDateString('en-CA');

export const startQueue = async (req, res) => {
  try {
    if (!whatsAppService.isConnected) {
      return ApiError(res, 'WhatsApp is not connected', 400);
    }

    const date = getTodayDate();
    const attendance = await Attendance.find({ date }).populate('studentId');

    const lateStudents = attendance
      .filter((a) => a.status === 'late' && a.studentId)
      .map((a) => ({
        studentId: a.studentId._id,
        studentName: a.studentId.studentName,
        registerNumber: a.studentId.registerNumber,
        phone: a.studentId.parentMobile,
        status: 'late',
      }));

    const absentStudents = attendance
      .filter((a) => a.status === 'absent' && a.studentId)
      .map((a) => ({
        studentId: a.studentId._id,
        studentName: a.studentId.studentName,
        registerNumber: a.studentId.registerNumber,
        phone: a.studentId.parentMobile,
        status: 'absent',
      }));

    const allStudents = [...lateStudents, ...absentStudents];

    if (allStudents.length === 0) {
      return ApiError(res, 'No late or absent students to notify', 400);
    }

    const templates = await MessageTemplate.find({});
    const templateMap = {};
    templates.forEach((t) => {
      templateMap[t.type] = t.template;
    });

    const now = new Date();
    const dateStr = formatDate(now);
    const timeStr = formatTime(now);

    const templateFn = (student) => {
      const template = templateMap[student.status] || templateMap['absent'] || '';
      return previewMessage(template, {
        ...student,
        date: dateStr,
        time: timeStr,
      });
    };

    await queueService.startQueue(allStudents, templateFn, dateStr, timeStr);

    logger.info(`Queue started with ${allStudents.length} students`);
    return ApiSuccess(res, `Queue started with ${allStudents.length} students`, {
      total: allStudents.length,
      late: lateStudents.length,
      absent: absentStudents.length,
    });
  } catch (error) {
    logger.error('Start queue error:', error);
    return ApiError(res, 'Failed to start queue: ' + error.message, 500);
  }
};

export const pauseQueue = (req, res) => {
  queueService.pause();
  return ApiSuccess(res, 'Queue paused');
};

export const resumeQueue = async (req, res) => {
  try {
    await queueService.resume();
    return ApiSuccess(res, 'Queue resumed');
  } catch (error) {
    return ApiError(res, 'Failed to resume queue', 500);
  }
};

export const clearQueue = (req, res) => {
  queueService.clear();
  return ApiSuccess(res, 'Queue cleared');
};

export const getQueueStatus = (req, res) => {
  const status = queueService.getStatus();
  return ApiSuccess(res, 'Queue status', status);
};
