import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendMemberActivationEmail } from '../utils/emailService';
import fs from 'fs';

// Helper: Generate sequential Membership ID (e.g. PCE-BWP-2026-000123)
const generateMembershipId = async (connection: any): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `PCE-BWP-${currentYear}-`;

  // Get current max count or ID
  const [rows] = (await connection.query(
    'SELECT COUNT(*) AS total FROM members'
  )) as [RowDataPacket[], any];
  const nextSeq = ((rows[0] as any)?.total || 0) + 1;
  const paddedSeq = String(nextSeq).padStart(6, '0');
  
  let membershipId = `${prefix}${paddedSeq}`;

  // Check if exists
  let exists = true;
  let counter = nextSeq;
  while (exists) {
    membershipId = `${prefix}${String(counter).padStart(6, '0')}`;
    const [check] = (await connection.query(
      'SELECT id FROM members WHERE membership_id = ?',
      [membershipId]
    )) as [RowDataPacket[], any];
    if (check.length === 0) {
      exists = false;
    } else {
      counter++;
    }
  }

  return membershipId;
};

/**
 * Finance Officer manual receipt upload
 */
export const uploadPaymentReceipt = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const { challan_id, payment_method, transaction_ref, amount_paid, payment_date } = req.body;

  if (!file) {
    return res.status(400).json({ message: 'Payment receipt document/image is required' });
  }

  if (!challan_id || !payment_method || !transaction_ref || !amount_paid || !payment_date) {
    if (file && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    return res.status(400).json({ message: 'All fields are required (challan_id, payment_method, transaction_ref, amount_paid, payment_date)' });
  }

  const officerId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify Challan exists
    const [challanRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, application_id, member_id, total_amount, status FROM challans WHERE id = ?',
      [challan_id]
    );

    if (challanRows.length === 0) {
      await connection.rollback();
      connection.release();
      if (file && fs.existsSync(file.path)) { try { fs.unlinkSync(file.path); } catch (e) {} }
      return res.status(404).json({ message: 'Challan not found' });
    }

    const challan = challanRows[0];

    // 2. Check duplicate Transaction Reference
    const [existingTrx] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM payments WHERE transaction_ref = ?',
      [transaction_ref.trim()]
    );

    if (existingTrx.length > 0) {
      await connection.rollback();
      connection.release();
      if (file && fs.existsSync(file.path)) { try { fs.unlinkSync(file.path); } catch (e) {} }
      return res.status(400).json({ message: 'A payment with this Transaction Reference Number has already been submitted.' });
    }

    // 3. Save Receipt Document to documents table
    const relativeFilePath = `/uploads/receipts/${file.filename}`;
    const [docResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO documents (
        application_id, member_id, document_type, file_path, file_name, file_size, mime_type, uploaded_by
      ) VALUES (?, ?, 'Payment Receipt', ?, ?, ?, ?, ?)`,
      [
        challan.application_id,
        challan.member_id,
        relativeFilePath,
        file.originalname,
        file.size,
        file.mimetype,
        officerId
      ]
    );

    const documentId = docResult.insertId;

    // 4. Save Payment record
    const [paymentResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO payments (
        challan_id, payment_method, transaction_ref, receipt_document_id, amount_paid, payment_date, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Submitted')`,
      [
        challan_id,
        payment_method,
        transaction_ref.trim(),
        documentId,
        parseFloat(amount_paid),
        payment_date
      ]
    );

    const paymentId = paymentResult.insertId;

    // 5. Log Audit event
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await connection.query(
      `INSERT INTO audit_log (
        user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
      ) VALUES (?, 'UPLOAD_PAYMENT_RECEIPT', 'payments', ?, ?, ?, ?)`,
      [
        officerId,
        paymentId,
        JSON.stringify({ challan_id, payment_method, transaction_ref, amount_paid, payment_date }),
        ipAddress,
        userAgent
      ]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Payment receipt uploaded successfully and placed in the verification queue.',
      paymentId,
      transactionRef: transaction_ref
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    if (file && fs.existsSync(file.path)) { try { fs.unlinkSync(file.path); } catch (e) {} }
    console.error('[UPLOAD PAYMENT RECEIPT ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while uploading the payment receipt.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch Finance Officer Verification Queue
 */
export const getPaymentQueue = async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT p.*,
             c.challan_number, c.total_amount AS challan_total_amount, c.due_date AS challan_due_date,
             d.file_path AS receipt_file_path, d.file_name AS receipt_file_name, d.mime_type AS receipt_mime_type,
             m.full_name AS member_name, m.membership_id, m.email AS member_email,
             a.full_name AS applicant_name, a.email AS applicant_email, a.id AS application_id_ref,
             COALESCE(m.email, a.email) AS email,
             COALESCE(m.whatsapp_no, a.whatsapp_no) AS whatsapp_no,
             u.full_name AS verifier_name
      FROM payments p
      JOIN challans c ON p.challan_id = c.id
      LEFT JOIN documents d ON p.receipt_document_id = d.id
      LEFT JOIN members m ON c.member_id = m.id
      LEFT JOIN applications a ON c.application_id = a.id
      LEFT JOIN users u ON p.verified_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ` AND p.verification_status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (p.transaction_ref LIKE ? OR c.challan_number LIKE ? OR m.full_name LIKE ? OR a.full_name LIKE ? OR m.membership_id LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET PAYMENT QUEUE ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching payment queue.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify Payment (Approve or Reject)
 * THIS IS WHERE MEMBERSHIP IS CREATED FOR FIRST-TIME APPLICANTS
 */
export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { verification_status, rejection_reason } = req.body;

  if (!['Approved', 'Rejected'].includes(verification_status)) {
    return res.status(400).json({ message: 'verification_status must be either Approved or Rejected' });
  }

  if (verification_status === 'Rejected' && (!rejection_reason || rejection_reason.trim() === '')) {
    return res.status(400).json({ message: 'Rejection reason is mandatory when rejecting a payment' });
  }

  const officerId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch payment + challan details
    const [paymentRows] = await connection.query<RowDataPacket[]>(
      `SELECT p.*, 
              c.id AS challan_id, c.challan_number, c.application_id, c.member_id, c.total_amount
       FROM payments p
       JOIN challans c ON p.challan_id = c.id
       WHERE p.id = ? FOR UPDATE`,
      [id]
    );

    if (paymentRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const payment = paymentRows[0];

    if (payment.verification_status === 'Approved') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'This payment has already been verified and approved.' });
    }

    // ==========================================
    // CASE 1: APPROVE PAYMENT
    // ==========================================
    if (verification_status === 'Approved') {
      let createdMembershipId: string | null = null;
      let memberEmail = '';
      let memberName = '';
      let generatedPassword = '';

      // CASE A: First payment for an approved applicant (No member record exists yet)
      if (payment.application_id !== null && payment.member_id === null) {
        
        // Fetch original Application details
        const [appRows] = await connection.query<RowDataPacket[]>(
          'SELECT * FROM applications WHERE id = ? FOR UPDATE',
          [payment.application_id]
        );

        if (appRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: 'Associated application not found' });
        }

        const app = appRows[0];
        memberEmail = app.email;
        memberName = app.full_name;

        // 1. Generate Membership ID
        createdMembershipId = await generateMembershipId(connection);

        // 2. Create User Account for Member Portal login
        // Generate random initial password e.g. PCE@<random4digits>
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        generatedPassword = `PCE@${randomNum}`;
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Check if user account with this email already exists
        const [existingUser] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM users WHERE email = ?',
          [app.email]
        );

        let memberUserId: number;

        if (existingUser.length > 0) {
          memberUserId = existingUser[0].id;
        } else {
          // Role ID 4 = Viewer (standard portal user)
          const [userResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO users (role_id, full_name, email, password, status)
             VALUES (4, ?, ?, ?, 'Active')`,
            [app.full_name, app.email, hashedPassword]
          );
          memberUserId = userResult.insertId;
        }

        // 3. Insert Member record
        const [memberResult] = await connection.query<ResultSetHeader>(
          `INSERT INTO members (
            membership_id, application_id, user_id, full_name, father_husband_name, cnic, dob,
            gender, mobile_no, whatsapp_no, email, qualification, institute, passing_year,
            occupation_designation, organization_school_name, office_address, residential_address,
            district, tehsil, status, activated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW())`,
          [
            createdMembershipId,
            app.id,
            memberUserId,
            app.full_name,
            app.father_husband_name,
            app.cnic,
            app.dob,
            app.gender,
            app.mobile_no,
            app.whatsapp_no,
            app.email,
            app.qualification,
            app.institute,
            app.passing_year,
            app.occupation_designation,
            app.organization_school_name,
            app.office_address,
            app.residential_address,
            app.district,
            app.tehsil
          ]
        );

        const newMemberId = memberResult.insertId;

        // 4. Update Challan & Dues to link to the new member_id & mark Paid (satisfying 3NF check constraints)
        await connection.query(
          `UPDATE challans SET application_id = NULL, member_id = ?, status = 'Paid' WHERE id = ?`,
          [newMemberId, payment.challan_id]
        );

        await connection.query(
          `UPDATE dues_records SET application_id = NULL, member_id = ?, status = 'Paid', paid_amount = amount WHERE challan_id = ?`,
          [newMemberId, payment.challan_id]
        );

        // 5. Link documents attached to this application to reference member_id
        await connection.query(
          `UPDATE documents SET application_id = NULL, member_id = ? WHERE application_id = ?`,
          [newMemberId, app.id]
        );

        // 6. Create General Ledger Income Transaction (Admission Fee)
        await connection.query(
          `INSERT INTO transactions (
            category_id, challan_id, payment_id, type, amount, transaction_date, reference_no, description, created_by
          ) VALUES (1, ?, ?, 'Income', ?, ?, ?, ?, ?)`,
          [
            payment.challan_id,
            payment.id,
            payment.amount_paid,
            payment.payment_date,
            payment.transaction_ref,
            `Admission fee payment verified for new member ${createdMembershipId} (${app.full_name})`,
            officerId
          ]
        );

        // 7. Update Payment status
        await connection.query(
          `UPDATE payments SET verification_status = 'Approved', verified_by = ?, verified_at = NOW() WHERE id = ?`,
          [officerId, id]
        );

        // 8. Notification Log
        const emailSubject = `Welcome to PCE! Your Membership ID is ${createdMembershipId}`;
        const emailBody = `Dear ${app.full_name}, your payment of PKR ${payment.amount_paid} has been verified. Your official Membership ID is ${createdMembershipId}. Portal Login: ${app.email} / Initial Password: ${generatedPassword}.`;

        await connection.query(
          `INSERT INTO notifications_log (
            user_id, member_id, application_id, channel, recipient, subject, body, status
          ) VALUES (?, ?, ?, 'Email', ?, ?, ?, 'Pending')`,
          [officerId, newMemberId, app.id, app.email, emailSubject, emailBody]
        );

        // 9. Audit Log
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        await connection.query(
          `INSERT INTO audit_log (
            user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
          ) VALUES (?, 'APPROVE_FIRST_PAYMENT_CREATE_MEMBER', 'members', ?, ?, ?, ?)`,
          [
            officerId,
            newMemberId,
            JSON.stringify({ membership_id: createdMembershipId, application_id: app.id, user_id: memberUserId }),
            ipAddress,
            userAgent
          ]
        );

        await connection.commit();
        connection.release();

        // Send activation email asynchronously
        sendMemberActivationEmail(app.email, app.full_name, createdMembershipId, generatedPassword);

        return res.json({
          success: true,
          message: `Payment verified successfully! Member profile created with Membership ID: ${createdMembershipId}`,
          membershipId: createdMembershipId,
          memberName: app.full_name,
          email: app.email,
          whatsappNo: app.whatsapp_no,
          generatedPassword
        });

      } else {
        // CASE B: Recurring payment for an existing member
        const [memberRows] = await connection.query<RowDataPacket[]>(
          'SELECT full_name, email, membership_id FROM members WHERE id = ? FOR UPDATE',
          [payment.member_id]
        );

        const member = memberRows[0];
        memberEmail = member.email;
        memberName = member.full_name;

        // 1. Update Challan & Dues to Paid
        await connection.query(
          `UPDATE challans SET status = 'Paid' WHERE id = ?`,
          [payment.challan_id]
        );

        await connection.query(
          `UPDATE dues_records SET status = 'Paid', paid_amount = amount WHERE challan_id = ?`,
          [payment.challan_id]
        );

        // 2. Create General Ledger Income Transaction (Monthly Dues)
        await connection.query(
          `INSERT INTO transactions (
            category_id, challan_id, payment_id, type, amount, transaction_date, reference_no, description, created_by
          ) VALUES (2, ?, ?, 'Income', ?, ?, ?, ?, ?)`,
          [
            payment.challan_id,
            payment.id,
            payment.amount_paid,
            payment.payment_date,
            payment.transaction_ref,
            `Recurring monthly dues payment verified for member ${member.membership_id} (${member.full_name})`,
            officerId
          ]
        );

        // 3. Update Payment status
        await connection.query(
          `UPDATE payments SET verification_status = 'Approved', verified_by = ?, verified_at = NOW() WHERE id = ?`,
          [officerId, id]
        );

        // 4. Audit Log
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        await connection.query(
          `INSERT INTO audit_log (
            user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
          ) VALUES (?, 'APPROVE_RECURRING_PAYMENT', 'payments', ?, ?, ?, ?)`,
          [
            officerId,
            id,
            JSON.stringify({ challan_id: payment.challan_id, member_id: payment.member_id, amount_paid: payment.amount_paid }),
            ipAddress,
            userAgent
          ]
        );

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: `Payment verified and recorded for member ${member.membership_id}.`
        });
      }

    } else {
      // ==========================================
      // CASE 2: REJECT PAYMENT
      // ==========================================
      await connection.query(
        `UPDATE payments 
         SET verification_status = 'Rejected', rejection_reason = ?, verified_by = ?, verified_at = NOW() 
         WHERE id = ?`,
        [rejection_reason, officerId, id]
      );

      // Audit Log
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;

      await connection.query(
        `INSERT INTO audit_log (
          user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
        ) VALUES (?, 'REJECT_PAYMENT', 'payments', ?, ?, ?, ?)`,
        [
          officerId,
          id,
          JSON.stringify({ verification_status: 'Rejected', rejection_reason }),
          ipAddress,
          userAgent
        ]
      );

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: 'Payment has been marked as Rejected. The challan remains unpaid.'
      });
    }

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[VERIFY PAYMENT ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while verifying the payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch Activated Members Directory
 */
export const getMembers = async (req: Request, res: Response) => {
  const { status, district, search, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT id, membership_id, full_name, father_husband_name, cnic, mobile_no, whatsapp_no, email,
             qualification, institute, occupation_designation, organization_school_name, district, tehsil,
             status, activated_at, created_at
      FROM members
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (district) {
      query += ` AND district = ?`;
      params.push(district);
    }

    if (search) {
      query += ` AND (membership_id LIKE ? OR full_name LIKE ? OR cnic LIKE ? OR email LIKE ? OR mobile_no LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY activated_at DESC, created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET MEMBERS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching members.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch Member Profile Details by ID
 */
export const getMemberById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM members WHERE id = ?`,
      [id]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: 'Member profile not found' });
    }

    const member = memberRows[0];

    // Fetch documents
    const [docRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, document_type, file_path, file_name, file_size, mime_type, created_at 
       FROM documents 
       WHERE member_id = ?`,
      [id]
    );

    // Fetch payment & challan history
    const [challanRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.challan_number, c.total_amount, c.due_date, c.status, c.created_at,
              p.transaction_ref, p.amount_paid, p.payment_date, p.verification_status
       FROM challans c
       LEFT JOIN payments p ON p.challan_id = c.id
       WHERE c.member_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...member,
        documents: docRows,
        challans: challanRows
      }
    });

  } catch (error: any) {
    console.error('[GET MEMBER BY ID ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching member profile details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch Current Logged-in Member Profile (/api/members/me)
 */
export const getMemberMe = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  try {
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM members WHERE user_id = ? OR email = ?`,
      [userId, userEmail]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: 'No associated member profile found for this account.' });
    }

    const member = memberRows[0];

    // Fetch documents
    const [docRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, document_type, file_path, file_name, file_size, mime_type, created_at 
       FROM documents 
       WHERE member_id = ?`,
      [member.id]
    );

    // Fetch payment & challan history
    const [challanRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.challan_number, c.total_amount, c.due_date, c.status, c.created_at,
              p.transaction_ref, p.amount_paid, p.payment_date, p.verification_status
       FROM challans c
       LEFT JOIN payments p ON p.challan_id = c.id
       WHERE c.member_id = ?
       ORDER BY c.created_at DESC`,
      [member.id]
    );

    return res.json({
      success: true,
      data: {
        ...member,
        documents: docRows,
        challans: challanRows
      }
    });

  } catch (error: any) {
    console.error('[GET MEMBER ME ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching your member profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Update Member Status (Active, Suspended, Inactive) / Remove Access
 */
export const updateMemberStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be Active, Suspended, or Inactive.' });
  }

  const officerId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch member
    const [memberRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, membership_id, full_name, user_id, status FROM members WHERE id = ? FOR UPDATE',
      [id]
    );

    if (memberRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Member record not found.' });
    }

    const member = memberRows[0];

    // Update member status
    await connection.query(
      'UPDATE members SET status = ? WHERE id = ?',
      [status, id]
    );

    // Update user login account status if linked
    if (member.user_id) {
      const userStatus = status === 'Active' ? 'Active' : 'Inactive';
      await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [userStatus, member.user_id]
      );
    }

    // Audit log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await connection.query(
      `INSERT INTO audit_log (user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, 'UPDATE_MEMBER_STATUS', 'members', ?, ?, ?, ?, ?)`,
      [
        officerId,
        id,
        JSON.stringify({ status: member.status }),
        JSON.stringify({ status, reason }),
        ipAddress,
        userAgent
      ]
    );

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: `Member ${member.membership_id} status updated to ${status}.`
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[UPDATE MEMBER STATUS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while updating member status.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

