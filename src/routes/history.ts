import { Router } from 'express';
import { getHistory } from '../controllers/historyController';

const router = Router();
router.get('/clients/:id/history', getHistory);
export default router;