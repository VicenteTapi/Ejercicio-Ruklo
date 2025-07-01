import { Router } from 'express';
import { postEvent } from '../controllers/eventsController';

const router = Router();
router.post('/events', postEvent);
export default router;
