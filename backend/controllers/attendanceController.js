import { Attendance, Student } from '../models/index.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const getTodayDate = () => {
  return new Date().toLocaleDateString('en-CA');
};

export const saveAttendance = async (req, res) => {
  try {
    const { attendance } = req.body;
    const date = getTodayDate();

    if (!attendance || !Array.isArray(attendance)) {
      return ApiError(res, 'Invalid attendance data', 400);
    }

    const operations = attendance.map((item) => ({
      updateOne: {
        filter: { studentId: item.studentId, date },
        update: { $set: { status: item.status } },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);
    logger.info(`Attendance saved for ${attendance.length} students`);
    return ApiSuccess(res, 'Attendance saved successfully');
  } catch (error) {
    logger.error('Save attendance error:', error);
    return ApiError(res, 'Failed to save attendance', 500);
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const date = getTodayDate();
    const attendance = await Attendance.find({ date }).populate('studentId');

    const result = attendance.map((a) => ({
      _id: a.studentId?._id,
      registerNumber: a.studentId?.registerNumber,
      studentName: a.studentId?.studentName,
      parentMobile: a.studentId?.parentMobile,
      status: a.status,
      attendanceId: a._id,
    }));

    return ApiSuccess(res, 'Attendance fetched', { attendance: result, date });
  } catch (error) {
    logger.error('Get attendance error:', error);
    return ApiError(res, 'Failed to fetch attendance', 500);
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const date = getTodayDate();
    const students = await Student.countDocuments();
    const attendance = await Attendance.find({ date });

    const present = attendance.filter((a) => a.status === 'present').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;

    return ApiSuccess(res, 'Summary fetched', {
      total: students,
      present,
      late,
      absent,
      date,
    });
  } catch (error) {
    logger.error('Get summary error:', error);
    return ApiError(res, 'Failed to fetch summary', 500);
  }
};

export const getStudentsWithAttendance = async (req, res) => {
  try {
    const date = getTodayDate();
    const students = await Student.find({}).sort({ registerNumber: 1 });
    const attendance = await Attendance.find({ date });

    const attendanceMap = {};
    attendance.forEach((a) => {
      if (a.studentId) {
        attendanceMap[a.studentId.toString()] = a.status;
      }
    });

    const result = students.map((s) => ({
      _id: s._id,
      registerNumber: s.registerNumber,
      studentName: s.studentName,
      parentMobile: s.parentMobile,
      status: attendanceMap[s._id.toString()] || 'present',
    }));

    return ApiSuccess(res, 'Students with attendance', { students: result, date });
  } catch (error) {
    logger.error('Get students with attendance error:', error);
    return ApiError(res, 'Failed to fetch students', 500);
  }
};
