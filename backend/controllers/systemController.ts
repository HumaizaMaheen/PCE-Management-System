import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

/**
 * Fetch System Audit Trail Logs (Paginated & Filterable)
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  const { user_id, action, startDate, endDate, search, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT a.*, u.full_name AS user_name, u.email AS user_email
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user_id) {
      query += ` AND a.user_id = ?`;
      params.push(user_id);
    }

    if (action) {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    if (startDate) {
      query += ` AND a.created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND a.created_at <= ?`;
      params.push(endDate);
    }

    if (search) {
      query += ` AND (a.action LIKE ? OR a.entity_name LIKE ? OR u.full_name LIKE ? OR a.ip_address LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET AUDIT LOGS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching audit logs.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch System Notifications Dispatch Queue Log
 */
export const getNotificationsLog = async (req: Request, res: Response) => {
  const { status, channel, search, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT n.*,
             m.full_name AS member_name, m.membership_id,
             a.full_name AS applicant_name, a.id AS app_ref_no
      FROM notifications_log n
      LEFT JOIN members m ON n.member_id = m.id
      LEFT JOIN applications a ON n.application_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ` AND n.status = ?`;
      params.push(status);
    }

    if (channel) {
      query += ` AND n.channel = ?`;
      params.push(channel);
    }

    if (search) {
      query += ` AND (n.recipient LIKE ? OR n.subject LIKE ? OR n.body LIKE ? OR m.full_name LIKE ? OR a.full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET NOTIFICATIONS LOG ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching notifications log.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch All System Settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, setting_key, setting_value, setting_group, description FROM settings ORDER BY setting_group ASC, id ASC'
    );

    // Format as key-value object + list
    const settingsObject: Record<string, string> = {};
    rows.forEach(r => {
      settingsObject[r.setting_key] = r.setting_value;
    });

    return res.json({
      success: true,
      data: rows,
      settings: settingsObject
    });

  } catch (error: any) {
    console.error('[GET SETTINGS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching system settings.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update System Settings (Super Admin Only)
 */
export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body; // Key-value dictionary e.g. { admission_fee: '5000', monthly_dues: '1000' }

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object is required.' });
  }

  const userId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updatedKeys: string[] = [];

    for (const [key, val] of Object.entries(settings)) {
      const strVal = String(val);
      
      const [updateRes] = await connection.query(
        `INSERT INTO settings (setting_key, setting_value, updated_by, updated_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by), updated_at = NOW()`,
        [key, strVal, userId]
      );
      updatedKeys.push(key);
    }

    // Audit Log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await connection.query(
      `INSERT INTO audit_log (user_id, action, entity_name, entity_id, new_values, ip_address, user_agent)
       VALUES (?, 'UPDATE_SYSTEM_SETTINGS', 'settings', 0, ?, ?, ?)`,
      [userId, JSON.stringify({ updatedKeys, settings }), ipAddress, userAgent]
    );

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: 'System settings updated successfully.'
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[UPDATE SETTINGS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while updating system settings.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
