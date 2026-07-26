import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/db';
import { 
  sendApplicationConfirmationEmail,
  sendApplicationApprovalEmail,
  sendApplicationRejectionEmail,
  sendApplicationNeedsInfoEmail
} from '../utils/emailService';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper: Clean up files in case of failure
const cleanupUploadedFiles = (files: any) => {
  if (!files) return;
  const fileArray = Array.isArray(files) 
    ? files 
    : Object.values(files).flat();
    
  fileArray.forEach((file: any) => {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log(`[CLEANUP] Deleted file: ${file.path}`);
      } catch (err: any) {
        console.error(`[CLEANUP ERROR] Could not delete file: ${file.path}`, err.message);
      }
    }
  });
};

// Helper: Verify Google reCAPTCHA
const verifyRecaptchaToken = (token: string, secretKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      secret: secretKey,
      response: token
    }).toString();

    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(!!parsed.success);
        } catch (e) {
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Handle public application submission
 */
export const submitApplication = async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  // 1. Validation check (express-validator)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    cleanupUploadedFiles(files);
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. Check required files
  const requiredFiles = ['cnic_front', 'cnic_back', 'photo', 'degree_certificate'];
  const missingFiles: string[] = [];

  requiredFiles.forEach(field => {
    if (!files || !files[field] || files[field].length === 0) {
      missingFiles.push(field);
    }
  });

  if (missingFiles.length > 0) {
    cleanupUploadedFiles(files);
    return res.status(400).json({
      message: 'Required documents are missing',
      errors: missingFiles.map(field => ({
        type: 'field',
        value: '',
        msg: `Document is required`,
        path: field,
        location: 'body'
      }))
    });
  }

  const {
    full_name,
    father_husband_name,
    cnic,
    dob,
    gender,
    mobile_no,
    whatsapp_no,
    email,
    qualification,
    institute,
    passing_year,
    occupation_designation,
    organization_school_name,
    office_address,
    residential_address,
    district,
    tehsil,
    recaptcha_token
  } = req.body;

  // 3. reCAPTCHA verification
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret && recaptchaSecret.trim() !== '') {
    if (!recaptcha_token) {
      cleanupUploadedFiles(files);
      return res.status(400).json({ message: 'reCAPTCHA verification is required' });
    }
    const isCaptchaValid = await verifyRecaptchaToken(recaptcha_token, recaptchaSecret);
    if (!isCaptchaValid) {
      cleanupUploadedFiles(files);
      return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
    }
  } else {
    console.warn('[SECURITY] RECAPTCHA_SECRET_KEY is not configured. Bypassing reCAPTCHA verification.');
  }

  // 4. DB Transaction to save application and documents
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check unique CNIC in applications and members
    const [existingCnicApp] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM applications WHERE cnic = ?', [cnic]
    );
    const [existingCnicMem] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM members WHERE cnic = ?', [cnic]
    );

    if (existingCnicApp.length > 0 || existingCnicMem.length > 0) {
      cleanupUploadedFiles(files);
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'This CNIC is already registered in our system. Please check your existing application status or sign in.',
        errors: [{
          type: 'field',
          value: cnic,
          msg: 'This CNIC is already registered in our system. Please check your existing application status or sign in.',
          path: 'cnic',
          location: 'body'
        }]
      });
    }

    // Check unique Email in applications, members, and users
    const [existingEmailApp] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM applications WHERE email = ?', [email]
    );
    const [existingEmailMem] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM members WHERE email = ?', [email]
    );
    const [existingEmailUser] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?', [email]
    );

    if (existingEmailApp.length > 0 || existingEmailMem.length > 0 || existingEmailUser.length > 0) {
      cleanupUploadedFiles(files);
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'This Email Address is already registered in our system. Please check your existing application status or sign in.',
        errors: [{
          type: 'field',
          value: email,
          msg: 'This Email Address is already registered in our system. Please check your existing application status or sign in.',
          path: 'email',
          location: 'body'
        }]
      });
    }

    // Insert Application
    const [appResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO applications (
        full_name, father_husband_name, cnic, dob, gender, mobile_no, whatsapp_no,
        email, qualification, institute, passing_year, occupation_designation,
        organization_school_name, office_address, residential_address, district, tehsil, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        full_name, father_husband_name, cnic, dob, gender, mobile_no, whatsapp_no,
        email, qualification, institute, parseInt(passing_year, 10), occupation_designation,
        organization_school_name, office_address, residential_address, district, tehsil
      ]
    );

    const applicationId = appResult.insertId;

    // Document types mapping
    const docMapping: { [key: string]: 'CNIC Front' | 'CNIC Back' | 'Photo' | 'Degree Certificate' | 'Other' } = {
      cnic_front: 'CNIC Front',
      cnic_back: 'CNIC Back',
      photo: 'Photo',
      degree_certificate: 'Degree Certificate',
      other_docs: 'Other'
    };

    // Insert Documents
    for (const [field, typeName] of Object.entries(docMapping)) {
      if (files && files[field] && files[field].length > 0) {
        const file = files[field][0];
        
        // Relative path to save in DB, e.g., /uploads/applications/filename
        const dbFilePath = `/uploads/applications/${file.filename}`;
        
        await connection.query(
          `INSERT INTO documents (
            application_id, document_type, file_path, file_name, file_size, mime_type
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            applicationId,
            typeName,
            dbFilePath,
            file.originalname,
            file.size,
            file.mimetype
          ]
        );
      }
    }

    // Log Audit Event
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await connection.query(
      `INSERT INTO audit_log (
        user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
      ) VALUES (NULL, 'SUBMIT_APPLICATION', 'applications', ?, ?, ?, ?)`,
      [
        applicationId,
        JSON.stringify({ id: applicationId, full_name, cnic, email, status: 'Pending' }),
        ipAddress,
        userAgent
      ]
    );

    await connection.commit();
    connection.release();

    // 5. Generate Reference Number
    const currentYear = new Date().getFullYear();
    const paddedId = String(applicationId).padStart(6, '0');
    const referenceNumber = `PCE-APP-${currentYear}-${paddedId}`;

    // 6. Send confirmation email asynchronously (non-blocking)
    sendApplicationConfirmationEmail(email, full_name, referenceNumber);

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      referenceNumber,
      applicantName: full_name,
      email
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    cleanupUploadedFiles(files);
    console.error('[SUBMIT APPLICATION ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while saving your application. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle application status tracking
 */
export const trackApplication = async (req: Request, res: Response) => {
  const { ref } = req.params;

  if (!ref) {
    return res.status(400).json({ message: 'Reference number is required' });
  }

  // Matches pattern PCE-APP-YYYY-ID (ID is 1 to 8 digits)
  const refRegex = /^PCE-APP-\d{4}-(\d{1,8})$/i;
  const match = ref.match(refRegex);

  if (!match) {
    return res.status(400).json({ message: 'Invalid Reference Number format. Example: PCE-APP-2026-000123' });
  }

  const applicationId = parseInt(match[1], 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.id, a.full_name, a.email, a.status, a.officer_remarks, a.created_at,
        m.membership_id, m.status AS member_status
      FROM applications a
      LEFT JOIN members m ON m.application_id = a.id
      WHERE a.id = ?`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Application not found with this Reference Number.' });
    }

    const app = rows[0];

    return res.json({
      success: true,
      referenceNumber: ref,
      applicantName: app.full_name,
      status: app.membership_id ? 'Approved - Active Member' : app.status,
      membershipId: app.membership_id || null,
      email: app.email || null,
      initialPassword: app.membership_id ? 'PCE@2026' : null,
      officerRemarks: app.officer_remarks || null,
      submittedAt: app.created_at
    });

  } catch (error: any) {
    console.error('[TRACK APPLICATION ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while tracking the application.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper: Generate unique challan number
 */
const generateUniqueChallanNumber = async (connection: any): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  let exists = true;
  let challanNo = '';
  
  while (exists) {
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
    challanNo = `CHN-${dateStr}-${randomSuffix}`;
    
    const [rows] = await connection.query(
      'SELECT id FROM challans WHERE challan_number = ?',
      [challanNo]
    );
    if ((rows as any[]).length === 0) {
      exists = false;
    }
  }
  return challanNo;
};

/**
 * Fetch all applications (Super Admin, Membership Officer, Viewer)
 */
export const getApplications = async (req: Request, res: Response) => {
  const { status, district, tehsil, search, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT id, full_name, father_husband_name, cnic, dob, gender, mobile_no, whatsapp_no, email, 
             qualification, institute, passing_year, occupation_designation, organization_school_name, 
             office_address, residential_address, district, tehsil, status, created_at 
      FROM applications 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (district) {
      query += ` AND district = ?`;
      params.push(district);
    }
    if (tehsil) {
      query += ` AND tehsil LIKE ?`;
      params.push(`%${tehsil}%`);
    }
    if (search) {
      query += ` AND (full_name LIKE ? OR cnic LIKE ? OR email LIKE ? OR mobile_no LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET APPLICATIONS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch application details by ID (Super Admin, Membership Officer, Viewer)
 */
export const getApplicationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [appRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM applications WHERE id = ?`,
      [id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = appRows[0];

    // Fetch documents associated with this application
    const [docRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, document_type, file_path, file_name, file_size, mime_type, created_at 
       FROM documents 
       WHERE application_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...application,
        documents: docRows
      }
    });
  } catch (error: any) {
    console.error('[GET APPLICATION BY ID ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching application details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Review application status (Approve / Reject / Request Info)
 */
export const reviewApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  // 1. Validation
  const allowedStatuses = ['Approved - Awaiting Payment', 'Rejected', 'Needs More Information'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status for application review' });
  }

  if (!remarks || remarks.trim() === '') {
    return res.status(400).json({ message: 'Review officer remarks/notes are required' });
  }

  const reviewerId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch the current application to check status & retrieve email/name
    const [appRows] = await connection.query<RowDataPacket[]>(
      'SELECT full_name, email, status FROM applications WHERE id = ? FOR UPDATE',
      [id]
    );

    if (appRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = appRows[0];

    if (application.status === 'Approved - Awaiting Payment') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Application is already approved and awaiting payment' });
    }

    let challanNumber = '';
    let admissionFee = 5000.00; // default fallback
    let dueDateStr = '';

    // If approved, create dues and challan
    if (status === 'Approved - Awaiting Payment') {
      // Get admission fee from settings
      const [settingsRows] = await connection.query<RowDataPacket[]>(
        "SELECT setting_value FROM settings WHERE setting_key = 'admission_fee_pkr'"
      );
      if (settingsRows.length > 0) {
        admissionFee = parseFloat(settingsRows[0].setting_value);
      }

      // Generate unique challan number
      challanNumber = await generateUniqueChallanNumber(connection);

      // Set due date to 14 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      dueDateStr = dueDate.toISOString().slice(0, 10); // YYYY-MM-DD

      // Insert Challan record
      const [challanResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO challans (
          challan_number, application_id, member_id, total_amount, due_date, status
        ) VALUES (?, ?, NULL, ?, ?, 'Unpaid')`,
        [challanNumber, id, admissionFee, dueDateStr]
      );

      const challanId = challanResult.insertId;

      // Insert Dues record
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      await connection.query(
        `INSERT INTO dues_records (
          application_id, member_id, challan_id, dues_type, period, amount, paid_amount, status, due_date
        ) VALUES (?, NULL, ?, 'Admission Fee', ?, ?, 0.00, 'Unpaid', ?)`,
        [id, challanId, currentPeriod, admissionFee, dueDateStr]
      );
    }

    // Update Application Status
    await connection.query(
      `UPDATE applications 
       SET status = ?, officer_remarks = ?, reviewed_by = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [status, remarks, reviewerId, id]
    );

    // Get old status for audit trail
    const oldStatus = application.status;

    // Log to Audit Log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await connection.query(
      `INSERT INTO audit_log (
        user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent
      ) VALUES (?, 'REVIEW_APPLICATION', 'applications', ?, ?, ?, ?, ?)`,
      [
        reviewerId,
        id,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status, officer_remarks: remarks, reviewed_by: reviewerId }),
        ipAddress,
        userAgent
      ]
    );

    // Insert notification log as Pending before email sending
    let emailSubject = '';
    let emailBody = '';

    if (status === 'Approved - Awaiting Payment') {
      emailSubject = 'Application Approved - Awaiting Payment - Pakistan Chamber of Education';
      emailBody = `Your application has been approved. Please pay PKR ${admissionFee} via Challan ${challanNumber} by ${dueDateStr} and send receipt screenshot/photo to WhatsApp +92 62 1234567. Remarks: ${remarks}`;
    } else if (status === 'Rejected') {
      emailSubject = 'Application Status Update - Pakistan Chamber of Education';
      emailBody = `Your application has been rejected. Remarks: ${remarks}`;
    } else if (status === 'Needs More Information') {
      emailSubject = 'Action Required: Application Information Needed - Pakistan Chamber of Education';
      emailBody = `Additional information is required for your application. Remarks: ${remarks}`;
    }

    const [notifResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO notifications_log (
        user_id, member_id, application_id, channel, recipient, subject, body, status
      ) VALUES (?, NULL, ?, 'Email', ?, ?, ?, 'Pending')`,
      [reviewerId, id, application.email, emailSubject, emailBody]
    );

    const notificationId = notifResult.insertId;

    await connection.commit();
    connection.release();

    // 5. Send notification email asynchronously
    (async () => {
      let sentSuccess = false;
      try {
        if (status === 'Approved - Awaiting Payment') {
          const friendlyDueDate = new Date(dueDateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          sentSuccess = await sendApplicationApprovalEmail(
            application.email,
            application.full_name,
            `PCE-APP-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`,
            challanNumber,
            admissionFee,
            friendlyDueDate
          );
        } else if (status === 'Rejected') {
          const refNo = `PCE-APP-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`;
          sentSuccess = await sendApplicationRejectionEmail(
            application.email,
            application.full_name,
            refNo,
            remarks
          );
        } else if (status === 'Needs More Information') {
          const refNo = `PCE-APP-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`;
          sentSuccess = await sendApplicationNeedsInfoEmail(
            application.email,
            application.full_name,
            refNo,
            remarks
          );
        }

        // Update notifications log status
        await pool.query(
          `UPDATE notifications_log 
           SET status = ?, sent_at = NOW() 
           WHERE id = ?`,
          [sentSuccess ? 'Sent' : 'Failed', notificationId]
        );
      } catch (err: any) {
        console.error('[ASYNC EMAIL ERROR]', err);
        await pool.query(
          `UPDATE notifications_log 
           SET status = 'Failed', error_message = ? 
           WHERE id = ?`,
          [err.message, notificationId]
        );
      }
    })();

    return res.json({
      success: true,
      message: `Application successfully updated to status: ${status}`,
      status,
      challanNumber: challanNumber || undefined
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[REVIEW APPLICATION ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while reviewing the application.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch application review statistics KPIs for Admin Dashboard
 */
export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    // 1. Fetch counts by application status
    const [appStatusRows] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS count 
       FROM applications 
       GROUP BY status`
    );

    const counts: { [key: string]: number } = {
      'Pending': 0,
      'Approved - Awaiting Payment': 0,
      'Rejected': 0,
      'Needs More Information': 0
    };

    appStatusRows.forEach(row => {
      if (row.status in counts) {
        counts[row.status] = row.count;
      }
    });

    // 2. Fetch total and active member counts
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS count 
       FROM members 
       GROUP BY status`
    );

    let totalMembers = 0;
    let activeMembers = 0;

    memberRows.forEach(row => {
      totalMembers += row.count;
      if (row.status === 'Active') {
        activeMembers = row.count;
      }
    });

    return res.json({
      success: true,
      data: {
        pendingApplications: counts['Pending'],
        approvedAwaitingPayment: counts['Approved - Awaiting Payment'],
        rejectedApplications: counts['Rejected'],
        needsMoreInfoApplications: counts['Needs More Information'],
        totalMembers,
        activeMembers
      }
    });
  } catch (error: any) {
    console.error('[GET DASHBOARD KPIS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching dashboard KPIs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete Application (Super Admin & Membership Officers)
 */
export const deleteApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const officerId = req.user?.id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch application
    const [appRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, full_name, cnic FROM applications WHERE id = ? FOR UPDATE',
      [id]
    );

    if (appRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Application record not found.' });
    }

    const app = appRows[0];

    // 2. Fetch associated documents & delete files from filesystem
    const [docRows] = await connection.query<RowDataPacket[]>(
      'SELECT file_path FROM documents WHERE application_id = ?',
      [id]
    );

    docRows.forEach(doc => {
      if (doc.file_path) {
        const fullPath = path.join(__dirname, '../..', doc.file_path);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) {}
        }
      }
    });

    // 3. Delete database records
    await connection.query('DELETE FROM documents WHERE application_id = ?', [id]);
    await connection.query('DELETE FROM dues_records WHERE challan_id IN (SELECT id FROM challans WHERE application_id = ?)', [id]);
    await connection.query('DELETE FROM payments WHERE challan_id IN (SELECT id FROM challans WHERE application_id = ?)', [id]);
    await connection.query('DELETE FROM challans WHERE application_id = ?', [id]);
    await connection.query('DELETE FROM notifications_log WHERE application_id = ?', [id]);
    await connection.query('DELETE FROM applications WHERE id = ?', [id]);

    // 4. Audit Log
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await connection.query(
      `INSERT INTO audit_log (user_id, action, entity_name, entity_id, old_values, ip_address, user_agent)
       VALUES (?, 'DELETE_APPLICATION', 'applications', ?, ?, ?, ?)`,
      [officerId, id, JSON.stringify({ id, full_name: app.full_name, cnic: app.cnic }), ipAddress, userAgent]
    );

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: `Application #${id} (${app.full_name}) and associated files deleted successfully.`
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[DELETE APPLICATION ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while deleting the application.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

