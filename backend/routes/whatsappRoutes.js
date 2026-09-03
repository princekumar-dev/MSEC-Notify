import { Router } from 'express';
import { getStatus, getQr, connect, disconnect, sendTestMessage } from '../controllers/whatsappController.js';

const router = Router();

router.get('/status', getStatus);
router.get('/qr', getQr);
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.post('/test-message', sendTestMessage);

export default router;
