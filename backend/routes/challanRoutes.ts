import { Router } from 'express';
import { 
  generateMonthlyDues,
  getChallans,
  getChallanPDF,
  getPublicChallanPDF,
  sendChallanEmail
} from '../controllers/challanController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public download route
router.get('/public/:ref/pdf', getPublicChallanPDF);

// Admin-only routes
router.post(
  '/generate-monthly',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  generateMonthlyDues
);

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  getChallans
);

router.get(
  '/:id/pdf',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  getChallanPDF
);

router.post(
  '/:id/send-email',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  sendChallanEmail
);

export default router;
