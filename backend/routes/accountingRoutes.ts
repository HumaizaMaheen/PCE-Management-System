import { Router } from 'express';
import { 
  getAccountCategories, 
  createAccountCategory, 
  getTransactions, 
  createTransaction, 
  getFinancialSummary, 
  exportTransactionsCSV 
} from '../controllers/accountingController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Chart of Accounts
router.get(
  '/categories',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer', 'Viewer'),
  getAccountCategories
);

router.post(
  '/categories',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  createAccountCategory
);

// General Ledger Transactions
router.get(
  '/transactions',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer', 'Viewer'),
  getTransactions
);

router.post(
  '/transactions',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  createTransaction
);

// Financial Statements & Summaries
router.get(
  '/summary',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer', 'Viewer'),
  getFinancialSummary
);

// CSV Ledger Export
router.get(
  '/export-csv',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Finance Officer'),
  exportTransactionsCSV
);

export default router;
