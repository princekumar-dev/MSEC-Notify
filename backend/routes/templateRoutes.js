import { Router } from 'express';
import { getTemplates, updateTemplate, resetTemplates } from '../controllers/templateController.js';

const router = Router();

router.get('/', getTemplates);
router.put('/', updateTemplate);
router.post('/reset', resetTemplates);

export default router;
