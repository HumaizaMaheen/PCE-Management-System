import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { validateApplication } from '../validators/applicationValidator';
import { 
  submitApplication, 
  trackApplication,
  getApplications,
  getApplicationById,
  reviewApplication,
  getDashboardKPIs,
  deleteApplication
} from '../controllers/applicationController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public Routes
router.post(
  '/submit',
  upload.fields([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic_back', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'degree_certificate', maxCount: 1 },
    { name: 'other_docs', maxCount: 1 }
  ]),
  validateApplication,
  submitApplication
);

router.get('/track/:ref', trackApplication);

// Admin/Officer Routes (Protected by JWT)
router.get(
  '/dashboard-kpis',
  authenticateJWT,
  getDashboardKPIs
);

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer', 'Viewer'),
  getApplications
);

router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer', 'Viewer'),
  getApplicationById
);

router.put(
  '/:id/review',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer'),
  reviewApplication
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer'),
  deleteApplication
);

export default router;

