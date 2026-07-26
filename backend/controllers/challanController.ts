import { Request, Response } from 'express';
import pool from '../config/db';
import { generateChallanPDF, ChallanPDFData } from '../utils/pdfGenerator';
import { AuthenticatedRequest } from '../middleware/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Helper to generate unique challan number
const generateUniqueChallanNumber = async (connection: any): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  let exists = true;
  let challanNo = '';
  
  while (exists) {
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit random
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
 * Trigger recurring monthly dues generation for all Active members
 */
export const generateMonthlyDues = async (req: AuthenticatedRequest, res: Response) => {
  const { period } = req.body; // format 'YYYY-MM', e.g., '2026-08'
  
  const targetPeriod = period || new Date().toISOString().slice(0, 7);
  const periodRegex = /^\d{4}-\d{2}$/;
  if (!periodRegex.test(targetPeriod)) {
    return res.status(400).json({ message: 'Invalid period format. Use YYYY-MM (e.g. 2026-08)' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch Active members
    const [members] = await connection.query<RowDataPacket[]>(
      'SELECT id, full_name, email, cnic, mobile_no FROM members WHERE status = "Active"'
    );

    if (members.length === 0) {
      await connection.rollback();
      connection.release();
      return res.json({ success: true, message: 'No active members found to generate dues for.' });
    }

    // 2. Fetch members who already have dues for this period to avoid duplicates
    const [existingDues] = await connection.query<RowDataPacket[]>(
      'SELECT member_id FROM dues_records WHERE period = ? AND dues_type = "Monthly Subscription"',
      [targetPeriod]
    );
    
    const existingMemberIds = new Set(existingDues.map(d => d.member_id));
    const eligibleMembers = members.filter(m => !existingMemberIds.has(m.id));

    if (eligibleMembers.length === 0) {
      await connection.rollback();
      connection.release();
      return res.json({ 
        success: true, 
        message: `Monthly dues for period ${targetPeriod} have already been generated for all active members.` 
      });
    }

    // 3. Get monthly fee from settings
    let monthlyFee = 2000.00;
    const [settingsRows] = await connection.query<RowDataPacket[]>(
      "SELECT setting_value FROM settings WHERE setting_key = 'monthly_fee_pkr'"
    );
    if (settingsRows.length > 0) {
      monthlyFee = parseFloat(settingsRows[0].setting_value);
    }

    // Due date is 15th of the month of the target period or 14 days from now
    // Let's use targetPeriod + "-15"
    const dueDateStr = `${targetPeriod}-15`;

    let generatedCount = 0;
    const adminUserId = req.user?.id || null;

    for (const member of eligibleMembers) {
      // Calculate previous outstanding balance (unpaid dues records prior to targetPeriod)
      const [balanceRows] = await connection.query<RowDataPacket[]>(
        `SELECT SUM(amount - paid_amount) AS balance 
         FROM dues_records 
         WHERE member_id = ? AND status IN ('Unpaid', 'Partially Paid') AND period < ?`,
        [member.id, targetPeriod]
      );
      
      const outstandingBalance = balanceRows[0].balance ? parseFloat(balanceRows[0].balance) : 0.00;
      const totalAmount = monthlyFee + outstandingBalance;

      // Generate unique challan number
      const challanNo = await generateUniqueChallanNumber(connection);

      // Insert Challan
      const [challanResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO challans (
          challan_number, application_id, member_id, total_amount, due_date, status
        ) VALUES (?, NULL, ?, ?, ?, 'Unpaid')`,
        [challanNo, member.id, totalAmount, dueDateStr]
      );
      
      const challanId = challanResult.insertId;

      // Insert new Dues record for this month
      await connection.query(
        `INSERT INTO dues_records (
          application_id, member_id, challan_id, dues_type, period, amount, paid_amount, status, due_date
        ) VALUES (NULL, ?, ?, 'Monthly Subscription', ?, ?, 0.00, 'Unpaid', ?)`,
        [member.id, challanId, targetPeriod, monthlyFee, dueDateStr]
      );

      // Update prior unpaid/partially paid dues to link to the new challan
      await connection.query(
        `UPDATE dues_records 
         SET challan_id = ? 
         WHERE member_id = ? AND status IN ('Unpaid', 'Partially Paid') AND period < ?`,
        [challanId, member.id, targetPeriod]
      );

      // Insert Notification Log
      const emailSubject = `Monthly Dues Generated - ${targetPeriod} - Pakistan Chamber of Education`;
      const emailBody = `Dear ${member.full_name}, your monthly dues challan for ${targetPeriod} has been generated. Challan Number: ${challanNo}, Total Amount: PKR ${totalAmount}. Due Date: ${dueDateStr}.`;
      
      await connection.query(
        `INSERT INTO notifications_log (
          user_id, member_id, application_id, channel, recipient, subject, body, status
        ) VALUES (?, ?, NULL, 'Email', ?, ?, ?, 'Pending')`,
        [adminUserId, member.id, member.email, emailSubject, emailBody]
      );

      // Log Audit Event
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;
      await connection.query(
        `INSERT INTO audit_log (
          user_id, action, entity_name, entity_id, new_values, ip_address, user_agent
        ) VALUES (?, 'GENERATE_MEMBER_DUES', 'challans', ?, ?, ?, ?)`,
        [
          adminUserId,
          challanId,
          JSON.stringify({ challan_number: challanNo, member_id: member.id, period: targetPeriod, total_amount: totalAmount }),
          ipAddress,
          userAgent
        ]
      );

      generatedCount++;
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: `Successfully generated dues challans for ${generatedCount} active members for period ${targetPeriod}.`
    });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('[GENERATE MONTHLY DUES ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while generating monthly dues.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * List all generated challans with filtering (Admin only)
 */
export const getChallans = async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = `
      SELECT c.*, 
             m.full_name AS member_name, m.membership_id,
             a.full_name AS applicant_name, a.id AS application_id_ref
      FROM challans c
      LEFT JOIN members m ON c.member_id = m.id
      LEFT JOIN applications a ON c.application_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (c.challan_number LIKE ? OR m.full_name LIKE ? OR m.membership_id LIKE ? OR a.full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS temp`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const totalCount = countRows[0].total;

    // Apply pagination
    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
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
    console.error('[GET CHALLANS ERROR]', error);
    return res.status(500).json({
      message: 'An error occurred while fetching challans.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Common PDF compiler logic
 */
const compileChallanPDFFile = async (challanId: number): Promise<{ filePath: string; filename: string }> => {
  // 1. Fetch Challan Details
  const [challanRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, 
            m.full_name AS member_name, m.membership_id, m.cnic AS member_cnic, m.mobile_no AS member_mobile,
            a.full_name AS applicant_name, a.cnic AS applicant_cnic, a.mobile_no AS applicant_mobile
     FROM challans c
     LEFT JOIN members m ON c.member_id = m.id
     LEFT JOIN applications a ON c.application_id = a.id
     WHERE c.id = ?`,
    [challanId]
  );

  if (challanRows.length === 0) {
    throw new Error('Challan not found');
  }

  const challan = challanRows[0];

  // 2. Fetch Itemized Dues
  const [duesRows] = await pool.query<RowDataPacket[]>(
    `SELECT dues_type, period, amount, status FROM dues_records WHERE challan_id = ?`,
    [challanId]
  );

  // 3. Fetch Settings for Bank details
  const [settings] = await pool.query<RowDataPacket[]>(
    `SELECT setting_key, setting_value FROM settings WHERE category = 'Financial'`
  );

  const settingsMap = new Map(settings.map(s => [s.setting_key, s.setting_value]));

  const bankName = settingsMap.get('bank_name') || 'Habib Bank Limited (HBL)';
  const bankAccountTitle = settingsMap.get('bank_account_title') || 'Pakistan Chamber of Education';
  const bankAccountNo = settingsMap.get('bank_account_no') || '1234-56789012-03';
  const bankIban = settingsMap.get('bank_iban') || 'PK12 HABB 0012 3456 7890 1203';

  // Construct PDF Generation Data
  const isMember = challan.member_id !== null;
  const payerName = isMember ? challan.member_name : challan.applicant_name;
  const payerRefLabel = isMember ? 'Membership ID' : 'Application Ref';
  const payerRefValue = isMember 
    ? challan.membership_id 
    : `PCE-APP-${new Date(challan.created_at).getFullYear()}-${String(challan.application_id).padStart(6, '0')}`;
  
  const payerCnic = isMember ? challan.member_cnic : challan.applicant_cnic;
  const payerPhone = isMember ? challan.member_mobile : challan.applicant_mobile;

  // Build itemized dues array
  const currentPeriod = duesRows.length > 0 ? duesRows[0].period : '';
  const currentDuesList = duesRows.filter(d => d.period === currentPeriod);
  const priorDuesList = duesRows.filter(d => d.period < currentPeriod);
  
  // Calculate outstanding carry forward
  const outstandingBalance = priorDuesList.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const dues = currentDuesList.map(d => ({
    type: d.dues_type,
    period: d.period,
    amount: parseFloat(d.amount)
  }));

  const pdfData: ChallanPDFData = {
    challanNumber: challan.challan_number,
    payerName,
    payerRefLabel,
    payerRefValue,
    payerCnic,
    payerPhone,
    dueDate: new Date(challan.due_date).toISOString().slice(0, 10),
    issueDate: new Date(challan.created_at).toISOString().slice(0, 10),
    totalAmount: parseFloat(challan.total_amount),
    dues,
    outstandingBalance,
    bankName,
    bankAccountTitle,
    bankAccountNo,
    bankIban
  };

  const filename = `${challan.challan_number}.pdf`;
  const relativeUploadPath = `/uploads/challans/${filename}`;
  const absoluteUploadPath = path.join(__dirname, '..', relativeUploadPath);

  // Generate the PDF file on disk
  await generateChallanPDF(pdfData, absoluteUploadPath);

  // Update challan record in DB with pdf path
  await pool.query(
    'UPDATE challans SET pdf_file_path = ? WHERE id = ?',
    [relativeUploadPath, challanId]
  );

  return { filePath: absoluteUploadPath, filename };
};

/**
 * Download/stream Challan PDF for Admin
 */
export const getChallanPDF = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { filePath, filename } = await compileChallanPDFFile(parseInt(id, 10));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error: any) {
    console.error('[GET CHALLAN PDF ERROR]', error);
    return res.status(500).json({
      message: 'Failed to generate or retrieve Challan PDF.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Public PDF downloader based on reference number or challan number
 */
export const getPublicChallanPDF = async (req: Request, res: Response) => {
  const { ref } = req.params; // Can be CHN-XXXX or PCE-APP-YYYY-ID

  try {
    let challanId: number | null = null;

    if (ref.startsWith('CHN-')) {
      // It is a direct Challan Number
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM challans WHERE challan_number = ?',
        [ref]
      );
      if (rows.length > 0) {
        challanId = rows[0].id;
      }
    } else if (ref.startsWith('PCE-APP-')) {
      // It is an Application Reference Number
      const match = ref.match(/^PCE-APP-\d{4}-(\d{1,8})$/i);
      if (match) {
        const appId = parseInt(match[1], 10);
        // Get latest unpaid challan first, or any latest challan for this application
        let [rows] = await pool.query<RowDataPacket[]>(
          'SELECT id FROM challans WHERE application_id = ? AND status = "Unpaid" ORDER BY created_at DESC LIMIT 1',
          [appId]
        );
        if (rows.length === 0) {
          [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM challans WHERE application_id = ? ORDER BY created_at DESC LIMIT 1',
            [appId]
          );
        }
        if (rows.length > 0) {
          challanId = rows[0].id;
        } else {
          // Check if application exists and auto-create a Case A Challan on the fly
          const [apps] = await pool.query<RowDataPacket[]>(
            'SELECT id, full_name FROM applications WHERE id = ?',
            [appId]
          );
          if (apps.length > 0) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const chnNum = `CHN-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
            const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

            const [ins] = await pool.query<any>(
              `INSERT INTO challans (application_id, challan_number, total_amount, due_date, status)
               VALUES (?, ?, 7000.00, ?, 'Unpaid')`,
              [appId, chnNum, dueDate]
            );
            challanId = ins.insertId;

            // Insert itemized dues
            const currentMonth = new Date().toLocaleString('default', { month: 'short' }) + ' ' + new Date().getFullYear();
            await pool.query(
              `INSERT INTO dues_records (challan_id, application_id, dues_type, period, amount, status)
               VALUES (?, ?, 'Admission Registration Fee', 'One-Time', 5000.00, 'Unpaid'),
                      (?, ?, 'First Monthly Contribution', ?, 2000.00, 'Unpaid')`,
              [challanId, appId, challanId, appId, currentMonth]
            );
          }
        }
      }
    } else if (ref.startsWith('PCE-BWP-')) {
      // It is a Member ID
      let [rows] = await pool.query<RowDataPacket[]>(
        `SELECT c.id FROM challans c
         JOIN members m ON c.member_id = m.id
         WHERE m.membership_id = ? AND c.status = "Unpaid"
         ORDER BY c.created_at DESC LIMIT 1`,
        [ref]
      );
      if (rows.length === 0) {
        [rows] = await pool.query<RowDataPacket[]>(
          `SELECT c.id FROM challans c
           JOIN members m ON c.member_id = m.id
           WHERE m.membership_id = ?
           ORDER BY c.created_at DESC LIMIT 1`,
          [ref]
        );
      }
      if (rows.length > 0) {
        challanId = rows[0].id;
      }
    }

    if (!challanId) {
      return res.status(404).json({ message: 'No challan invoice found for this reference.' });
    }

    const { filePath, filename } = await compileChallanPDFFile(challanId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (error: any) {
    console.error('[GET PUBLIC CHALLAN PDF ERROR]', error);
    return res.status(500).json({
      message: 'Failed to retrieve Challan PDF.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Send Challan via Email
 */
export const sendChallanEmail = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Compile PDF first
    const { filePath, filename } = await compileChallanPDFFile(parseInt(id, 10));

    // 2. Fetch email address
    const [challanRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.challan_number, c.total_amount,
              m.full_name AS member_name, m.email AS member_email,
              a.full_name AS applicant_name, a.email AS applicant_email
       FROM challans c
       LEFT JOIN members m ON c.member_id = m.id
       LEFT JOIN applications a ON c.application_id = a.id
       WHERE c.id = ?`,
      [id]
    );

    const challan = challanRows[0];
    const email = challan.member_id ? challan.member_email : challan.applicant_email;
    const name = challan.member_id ? challan.member_name : challan.applicant_name;

    // 3. Create mail transport
    const [smtpSettings] = await pool.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM settings WHERE category = 'Notification'`
    );
    const settingsMap = new Map(smtpSettings.map(s => [s.setting_key, s.setting_value]));
    
    const host = settingsMap.get('smtp_host');
    const port = settingsMap.get('smtp_port');
    const user = settingsMap.get('smtp_user');
    const pass = settingsMap.get('smtp_pass');

    if (!host || !user) {
      // Simulate
      console.log('========================================================================');
      console.log(`[SIMULATED CHALLAN EMAIL] Sent to: ${email}`);
      console.log(`[SIMULATED CHALLAN EMAIL] Attached file: ${filename}`);
      console.log('========================================================================');
      return res.json({ success: true, message: 'Challan email simulated successfully.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587', 10),
      secure: parseInt(port || '587', 10) === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: email,
      subject: `Your Membership Invoice / Challan: ${challan.challan_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
          <h2 style="color: #006A4E;">Pakistan Chamber of Education</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Please find attached your membership invoice/challan fee slip for your records.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background-color: #f7f9fa;">
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Challan Number:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${challan.challan_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Total Amount:</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #006A4E;">PKR ${parseFloat(challan.total_amount).toLocaleString()}</td>
            </tr>
          </table>
          <p>Kindly pay the amount and send a screenshot/photograph of the deposit slip back to us via WhatsApp at <strong>+92 62 1234567</strong>.</p>
          <p>Best regards,<br/>Pakistan Chamber of Education</p>
        </div>
      `,
      attachments: [
        {
          filename,
          path: filePath
        }
      ]
    });

    return res.json({ success: true, message: `Challan successfully emailed to ${email}.` });
  } catch (error: any) {
    console.error('[SEND CHALLAN EMAIL ERROR]', error);
    return res.status(500).json({
      message: 'Failed to email challan.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
