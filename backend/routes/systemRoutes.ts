import { Router } from 'express';
import { 
  getAuditLogs, 
  getNotificationsLog, 
  getSettings, 
  updateSettings 
} from '../controllers/systemController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Audit Logs (Super Admin, Viewer)
router.get(
  '/audit-logs',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Viewer'),
  getAuditLogs
);

// Notifications Queue Log (Super Admin, Viewer)
router.get(
  '/notifications-log',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Viewer'),
  getNotificationsLog
);

// System Settings
router.get(
  '/settings',
  getSettings
);

router.put(
  '/settings',
  authenticateJWT,
  authorizeRoles('Super Admin'),
  updateSettings
);

export default router;
