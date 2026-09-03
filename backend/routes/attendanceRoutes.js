import { Router } from 'express';
import {
  saveAttendance,
  getTodayAttendance,
  getAttendanceSummary,
  getStudentsWithAttendance,
} from '../controllers/attendanceController.js';

const router = Router();

router.post('/', saveAttendance);
router.get('/today', getTodayAttendance);
router.get('/summary', getAttendanceSummary);
router.get('/students', getStudentsWithAttendance);

export default router;
