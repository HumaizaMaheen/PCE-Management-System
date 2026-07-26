import { Router } from 'express';
import { getMembers, getMemberById, getMemberMe, updateMemberStatus, deleteMember } from '../controllers/paymentController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Fetch Current Logged-in Member Profile
router.get(
  '/me',
  authenticateJWT,
  getMemberMe
);

// Fetch Active Members Directory
router.get(
  '/',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer', 'Membership Officer', 'Viewer'),
  getMembers
);

// Fetch Member Details by ID
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer', 'Membership Officer', 'Viewer'),
  getMemberById
);

// Update Member Status / Remove Access (Super Admin, Membership Officer)
router.put(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer', 'Viewer'),
  updateMemberStatus
);

// Permanently Delete Member Record and Purge Credentials
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Membership Officer', 'Viewer'),
  deleteMember
);

export default router;

