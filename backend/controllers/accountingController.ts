import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Fetch Chart of Accounts / Categories
 */
export const getAccountCategories = async (req: Request, res: Response) => {
  const { type } = req.query;

  try {
    let query = 'SELECT * FROM account_categories WHERE 1=1';
    const params: any[] = [];

    if (type && ['Income', 'Expense'].includes(type as string)) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY type ASC, name ASC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return res.json({
      success: true,
      data: rows
    });

  } catch (error: any) {
    console.error('[GET ACCOUNT CATEGORIES ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching account categories.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create New Custom Category in Chart of Accounts
 */
export const createAccountCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { name, type, description } = req.body;

  if (!name || !type || !['Income', 'Expense'].includes(type)) {
    return res.status(400).json({ message: 'Category name and valid type (Income or Expense) are required.' });
  }

  const userId = req.user?.id || null;

  try {
    // Check if category name exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM account_categories WHERE name = ?',
      [name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account category with this name already exists.' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO account_categories (name, type, description) VALUES (?, ?, ?)`,
      [name.trim(), type, description ? description.trim() : null]
    );

    // Audit Log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_name, entity_id, new_values, ip_address, user_agent)
       VALUES (?, 'CREATE_ACCOUNT_CATEGORY', 'account_categories', ?, ?, ?, ?)`,
      [userId, result.insertId, JSON.stringify({ name, type, description }), ipAddress, userAgent]
    );

    return res.status(201).json({
      success: true,
      message: 'Account category created successfully.',
      data: {
        id: result.insertId,
        name: name.trim(),
        type,
        description
      }
    });

  } catch (error: any) {
    console.error('[CREATE ACCOUNT CATEGORY ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while creating account category.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch General Ledger Transactions List (Paginated & Filterable)
 */
export const getTransactions = async (req: Request, res: Response) => {
  const { type, category_id, startDate, endDate, search, page = '1', limit = '15' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT t.*, 
             ac.name AS category_name, ac.type AS category_type,
             c.challan_number,
             u.full_name AS created_by_name
      FROM transactions t
      JOIN account_categories ac ON t.category_id = ac.id
      LEFT JOIN challans c ON t.challan_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && ['Income', 'Expense'].includes(type as string)) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    if (category_id) {
      query += ` AND t.category_id = ?`;
      params.push(category_id);
    }

    if (startDate) {
      query += ` AND t.transaction_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.transaction_date <= ?`;
      params.push(endDate);
    }

    if (search) {
      query += ` AND (t.description LIKE ? OR t.reference_no LIKE ? OR c.challan_number LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY t.transaction_date DESC, t.id DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error: any) {
    console.error('[GET TRANSACTIONS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching general ledger transactions.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create Manual Income / Expense Transaction (Finance Officer)
 */
export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const { category_id, type, amount, transaction_date, reference_no, description } = req.body;

  if (!category_id || !type || !amount || !transaction_date || !description) {
    return res.status(400).json({ message: 'All fields (category_id, type, amount, transaction_date, description) are mandatory.' });
  }

  if (!['Income', 'Expense'].includes(type)) {
    return res.status(400).json({ message: 'Transaction type must be either Income or Expense.' });
  }

  const userId = req.user?.id || null;

  try {
    // 1. Verify Category exists and matches type
    const [catRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, type, name FROM account_categories WHERE id = ?',
      [category_id]
    );

    if (catRows.length === 0) {
      return res.status(404).json({ message: 'Selected account category not found.' });
    }

    const category = catRows[0];
    if (category.type !== type) {
      return res.status(400).json({ 
        message: `Category type mismatch: Category '${category.name}' is an ${category.type} category, but transaction type specified is ${type}.` 
      });
    }

    // 2. Insert Transaction
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO transactions (
        category_id, type, amount, transaction_date, reference_no, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        type,
        parseFloat(amount),
        transaction_date,
        reference_no ? reference_no.trim() : null,
        description.trim(),
        userId
      ]
    );

    // 3. Audit Log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_name, entity_id, new_values, ip_address, user_agent)
       VALUES (?, 'CREATE_MANUAL_TRANSACTION', 'transactions', ?, ?, ?, ?)`,
      [userId, result.insertId, JSON.stringify({ category_id, type, amount, transaction_date, reference_no, description }), ipAddress, userAgent]
    );

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded in General Ledger successfully.',
      transactionId: result.insertId
    });

  } catch (error: any) {
    console.error('[CREATE TRANSACTION ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while creating transaction.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch Financial Summary & Statements (Income vs Expenses, Surplus/Deficit, Monthly Breakdown)
 */
export const getFinancialSummary = async (req: Request, res: Response) => {
  const { range = 'all', startDate, endDate } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    if (range === 'this_month') {
      dateFilter = ` AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`;
      params.push(`${currentYear}-${currentMonth}`);
    } else if (range === 'this_year') {
      dateFilter = ` AND YEAR(transaction_date) = ?`;
      params.push(currentYear);
    } else if (startDate && endDate) {
      dateFilter = ` AND transaction_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    // 1. Total Income & Total Expenses
    const [summaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS total_expenses
       FROM transactions
       WHERE 1=1 ${dateFilter}`,
      params
    );

    const totalIncome = parseFloat(summaryRows[0].total_income);
    const totalExpenses = parseFloat(summaryRows[0].total_expenses);
    const netBalance = totalIncome - totalExpenses;

    // 2. Category Breakdown
    const [categoryRows] = await pool.query<RowDataPacket[]>(
      `SELECT ac.name AS category_name, ac.type, COALESCE(SUM(t.amount), 0) AS total_amount
       FROM account_categories ac
       LEFT JOIN transactions t ON t.category_id = ac.id ${dateFilter}
       GROUP BY ac.id, ac.name, ac.type
       HAVING total_amount > 0
       ORDER BY ac.type ASC, total_amount DESC`,
      params
    );

    // 3. Monthly Breakdown (Last 12 months)
    const [monthlyRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month_key,
        DATE_FORMAT(transaction_date, '%b %Y') AS month_name,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS monthly_income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS monthly_expense
       FROM transactions
       WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month_key, month_name
       ORDER BY month_key ASC`
    );

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netBalance,
          isSurplus: netBalance >= 0
        },
        categories: categoryRows,
        monthlyBreakdown: monthlyRows.map(r => ({
          monthKey: r.month_key,
          monthName: r.month_name,
          income: parseFloat(r.monthly_income),
          expense: parseFloat(r.monthly_expense),
          net: parseFloat(r.monthly_income) - parseFloat(r.monthly_expense)
        }))
      }
    });

  } catch (error: any) {
    console.error('[GET FINANCIAL SUMMARY ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching financial summary.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export Financial Ledger to CSV
 */
export const exportTransactionsCSV = async (req: Request, res: Response) => {
  const { type, startDate, endDate } = req.query;

  try {
    let query = `
      SELECT t.id, t.transaction_date, t.type, ac.name AS category_name, 
             t.amount, t.reference_no, t.description, c.challan_number, u.full_name AS created_by
      FROM transactions t
      JOIN account_categories ac ON t.category_id = ac.id
      LEFT JOIN challans c ON t.challan_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && ['Income', 'Expense'].includes(type as string)) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    if (startDate && endDate) {
      query += ` AND t.transaction_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Build CSV
    let csv = 'ID,Date,Type,Category,Amount (PKR),Reference No,Description,Challan No,Created By\n';
    rows.forEach(r => {
      const desc = `"${(r.description || '').replace(/"/g, '""')}"`;
      csv += `${r.id},${r.transaction_date},${r.type},${r.category_name},${r.amount},${r.reference_no || ''},${desc},${r.challan_number || ''},${r.created_by || ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=financial_ledger_${Date.now()}.csv`);
    return res.status(200).send(csv);

  } catch (error: any) {
    console.error('[EXPORT CSV ERROR]', error);
    return res.status(500).json({ message: 'An error occurred while generating CSV export.' });
  }
};
