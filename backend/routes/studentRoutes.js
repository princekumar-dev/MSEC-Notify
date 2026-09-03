import { Router } from 'express';
import multer from 'multer';
import {
  uploadStudents,
  getStudents,
  getAllStudents,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  exportStudents,
  getStudentCount,
} from '../controllers/studentController.js';
import { config } from '../config/index.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.xlsx?$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed'));
    }
  },
});

router.post('/upload', upload.single('file'), uploadStudents);
router.get('/', getStudents);
router.get('/all', getAllStudents);
router.get('/count', getStudentCount);
router.get('/export', exportStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/bulk-delete', bulkDeleteStudents);

export default router;
