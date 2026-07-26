import { Router } from 'express';
import { getPublicSettings } from '../controllers/publicController';

const router = Router();

// Publicly accessible configurations and statistics
router.get('/settings', getPublicSettings);

export default router;
