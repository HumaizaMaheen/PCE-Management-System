import { Router } from 'express';
import { receiptUpload } from '../middleware/uploadMiddleware';
import { 
  uploadPaymentReceipt, 
  getPaymentQueue, 
  verifyPayment 
} from '../controllers/paymentController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// 1. Upload Payment Receipt (Finance Officer, Super Admin)
router.post(
  '/upload-receipt',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  receiptUpload.single('receipt_file'),
  uploadPaymentReceipt
);

// 2. Fetch Payment Verification Queue (Finance Officer, Super Admin)
router.get(
  '/queue',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  getPaymentQueue
);

// 3. Verify Payment - Approve/Reject (Finance Officer, Super Admin)
router.put(
  '/:id/verify',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  verifyPayment
);

export default router;
