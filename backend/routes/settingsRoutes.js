import { Router } from 'express';
import { getSettings, updateSettings, getDashboard } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/dashboard', getDashboard);

export default router;
