import { Router } from 'express';
import { login, forgotPassword, resetPassword, me, logout } from '../controllers/authController';
import { loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/authValidators';
import { authenticateJWT, authorizeRoles, permissions } from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Protected auth routes
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, me);

// ==========================================
// RBAC Test Routes (For Phase 1 validation)
// ==========================================
router.get('/admin-only', authenticateJWT, authorizeRoles(permissions.SUPER_ADMIN), (req, res) => {
  res.json({ message: 'Success! You have accessed the Super Admin resource.' });
});

router.get('/finance-only', authenticateJWT, authorizeRoles(permissions.SUPER_ADMIN, permissions.FINANCE_OFFICER), (req, res) => {
  res.json({ message: 'Success! You have accessed the Finance Officer resource.' });
});

router.get('/membership-only', authenticateJWT, authorizeRoles(permissions.SUPER_ADMIN, permissions.MEMBERSHIP_OFFICER), (req, res) => {
  res.json({ message: 'Success! You have accessed the Membership Officer resource.' });
});

router.get('/viewer-only', authenticateJWT, authorizeRoles(permissions.SUPER_ADMIN, permissions.VIEWER, permissions.FINANCE_OFFICER, permissions.MEMBERSHIP_OFFICER), (req, res) => {
  res.json({ message: 'Success! You have accessed the Viewer-accessible resource.' });
});

export default router;
