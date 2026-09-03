import { Router } from 'express';
import { startQueue, pauseQueue, resumeQueue, clearQueue, getQueueStatus } from '../controllers/queueController.js';

const router = Router();

router.post('/start', startQueue);
router.post('/pause', pauseQueue);
router.post('/resume', resumeQueue);
router.post('/clear', clearQueue);
router.get('/status', getQueueStatus);

export default router;
