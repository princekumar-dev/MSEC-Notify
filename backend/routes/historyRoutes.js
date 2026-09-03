import { Router } from 'express';
import { getHistory, getHistoryStats, deleteHistory, exportHistory } from '../controllers/historyController.js';

const router = Router();

router.get('/', getHistory);
router.get('/stats', getHistoryStats);
router.post('/delete', deleteHistory);
router.get('/export', exportHistory);

export default router;
