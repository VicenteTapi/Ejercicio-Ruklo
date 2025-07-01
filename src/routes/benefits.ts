import { Router } from 'express';
import { getBenefits } from '../controllers/benefitsController';

const router = Router();
router.get('/clients/:id/benefits', getBenefits);

export default router;
