import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

// Create a reusable transporter using the default SMTP transport
const createTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS || ''
    }
  });
};

/**
 * Sends a confirmation email to the applicant upon successful submission.
 * This is non-blocking (gracefully catches and logs errors).
 */
export const sendApplicationConfirmationEmail = async (
  toEmail: string,
  applicantName: string,
  refNumber: string
): Promise<boolean> => {
  const transporter = createTransporter();
  
  const subject = 'Application Received - Pakistan Chamber of Education';
  const htmlContent = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #006A4E; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600;">Pakistan Chamber of Education</h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C8A951; font-weight: bold;">Division Bahawalpur</p>
      </div>
      
      <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0;">Dear <strong>${applicantName}</strong>,</p>
        
        <p>Thank you for submitting your membership application to the Pakistan Chamber of Education (PCE), Bahawalpur Division. We are pleased to inform you that your application has been received successfully.</p>
        
        <div style="background-color: #F7F9FA; border-left: 4px solid #C8A951; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Application Reference Number</p>
          <p style="margin: 0; font-size: 20px; color: #006A4E; font-weight: bold; letter-spacing: 0.5px;">${refNumber}</p>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol style="padding-left: 20px; margin: 10px 0;">
          <li style="margin-bottom: 8px;">Our Membership Officer will review your application details and uploaded documents (CNIC, photo, and degrees).</li>
          <li style="margin-bottom: 8px;">You can track your application status in real-time at the <strong>Applicant Tracking Portal</strong> using your Reference Number above.</li>
          <li style="margin-bottom: 8px;">Once approved, you will receive instructions to pay the admission fee and standard monthly contribution.</li>
        </ol>
        
        <p style="margin-bottom: 0;">If you have any immediate questions, feel free to contact us at <a href="mailto:info@pce.org.pk" style="color: #006A4E; text-decoration: underline;">info@pce.org.pk</a>.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e8ed; padding: 16px 24px; text-align: center; font-size: 11px; color: #888888; background-color: #F7F9FA; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Pakistan Chamber of Education. All rights reserved.</p>
        <p style="margin: 0;">PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('========================================================================');
    console.log(`[SIMULATED EMAIL] To: ${toEmail}`);
    console.log(`[SIMULATED EMAIL] Subject: ${subject}`);
    console.log(`[SIMULATED EMAIL] Reference Number: ${refNumber}`);
    console.log('========================================================================');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`[EMAIL SENT] MessageId: ${info.messageId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends an approval email to the applicant.
 */
export const sendApplicationApprovalEmail = async (
  toEmail: string,
  applicantName: string,
  refNumber: string,
  challanNumber: string,
  amount: number,
  dueDate: string
): Promise<boolean> => {
  const transporter = createTransporter();
  
  const subject = 'Application Approved - Awaiting Payment - Pakistan Chamber of Education';
  const htmlContent = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #006A4E; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600;">Pakistan Chamber of Education</h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C8A951; font-weight: bold;">Division Bahawalpur</p>
      </div>
      
      <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0;">Dear <strong>${applicantName}</strong>,</p>
        
        <p>Congratulations! Your membership application (Reference: <strong>${refNumber}</strong>) has been reviewed and <strong>Approved</strong> by the Membership Committee.</p>
        
        <p>To finalize your membership and activate your profile, please pay the initial admission fee. We have generated a challan invoice for you:</p>
        
        <div style="background-color: #F7F9FA; border-left: 4px solid #006A4E; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #666666; padding: 4px 0;">Challan Number:</td>
              <td style="font-weight: 600; color: #333333; text-align: right; padding: 4px 0;">${challanNumber}</td>
            </tr>
            <tr>
              <td style="color: #666666; padding: 4px 0;">Amount Payable:</td>
              <td style="font-weight: bold; color: #006A4E; text-align: right; padding: 4px 0;">PKR ${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #666666; padding: 4px 0;">Due Date:</td>
              <td style="font-weight: 600; color: #DC3545; text-align: right; padding: 4px 0;">${dueDate}</td>
            </tr>
          </table>
        </div>
        
        <p><strong>Next Steps to Complete Activation:</strong></p>
        <ol style="padding-left: 20px; margin: 10px 0;">
          <li style="margin-bottom: 8px;">Download/print your Challan from the <a href="http://localhost:5173/portal" style="color: #006A4E; text-decoration: underline; font-weight: 600;">Applicant Portal</a> by searching your Reference Number.</li>
          <li style="margin-bottom: 8px;">Make the payment of <strong>PKR ${amount}</strong> at the designated bank account or online via IBAN listed on the Challan.</li>
          <li style="margin-bottom: 8px;"><strong>Crucial:</strong> Take a photo/screenshot of the bank payment receipt and send it to our official Chamber WhatsApp number <strong>+92 62 1234567</strong>. Please include your Reference Number in the WhatsApp message text.</li>
        </ol>
        
        <p>Once our Finance Officer manually verifies your payment receipt uploaded via WhatsApp, your formal Membership ID will be issued and login credentials will be emailed to you.</p>
        
        <p style="margin-bottom: 0;">If you have any questions, feel free to reach out to us.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e8ed; padding: 16px 24px; text-align: center; font-size: 11px; color: #888888; background-color: #F7F9FA; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Pakistan Chamber of Education. All rights reserved.</p>
        <p style="margin: 0;">PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('========================================================================');
    console.log(`[SIMULATED EMAIL] To: ${toEmail}`);
    console.log(`[SIMULATED EMAIL] Subject: ${subject}`);
    console.log(`[SIMULATED EMAIL] Challan Number: ${challanNumber}, Amount: ${amount}`);
    console.log('========================================================================');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log(`[EMAIL SENT] Approval Email Sent: ${info.messageId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send approval email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends a rejection email to the applicant.
 */
export const sendApplicationRejectionEmail = async (
  toEmail: string,
  applicantName: string,
  refNumber: string,
  reason: string
): Promise<boolean> => {
  const transporter = createTransporter();
  
  const subject = 'Application Status Update - Pakistan Chamber of Education';
  const htmlContent = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #DC3545; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600;">Pakistan Chamber of Education</h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; font-weight: bold; opacity: 0.85;">Division Bahawalpur</p>
      </div>
      
      <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0;">Dear <strong>${applicantName}</strong>,</p>
        
        <p>Thank you for your interest in joining the Pakistan Chamber of Education. We have reviewed your application (Reference: <strong>${refNumber}</strong>).</p>
        
        <p>Regretfully, we are unable to approve your application at this time. The reason for rejection provided by the review officer is:</p>
        
        <div style="background-color: #FFF5F5; border-left: 4px solid #DC3545; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #C53030;">
          <p style="margin: 0; font-weight: 500;">${reason || 'Does not meet the membership criteria'}</p>
        </div>
        
        <p>If you believe there has been a misunderstanding or if you wish to apply again in the future once the requirements are met, you are welcome to submit a new application on our website.</p>
        
        <p style="margin-bottom: 0;">If you have any questions or require clarification, please feel free to reply to this email.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e8ed; padding: 16px 24px; text-align: center; font-size: 11px; color: #888888; background-color: #F7F9FA; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Pakistan Chamber of Education. All rights reserved.</p>
        <p style="margin: 0;">PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('========================================================================');
    console.log(`[SIMULATED EMAIL] To: ${toEmail}`);
    console.log(`[SIMULATED EMAIL] Subject: ${subject}`);
    console.log(`[SIMULATED EMAIL] Status: Rejected. Reason: ${reason}`);
    console.log('========================================================================');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log(`[EMAIL SENT] Rejection Email Sent: ${info.messageId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send rejection email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends a needs info email to the applicant.
 */
export const sendApplicationNeedsInfoEmail = async (
  toEmail: string,
  applicantName: string,
  refNumber: string,
  remarks: string
): Promise<boolean> => {
  const transporter = createTransporter();
  
  const subject = 'Action Required: Application Information Needed - Pakistan Chamber of Education';
  const htmlContent = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #FFC107; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #333333;">
        <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600;">Pakistan Chamber of Education</h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #333333; font-weight: bold; opacity: 0.75;">Division Bahawalpur</p>
      </div>
      
      <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0;">Dear <strong>${applicantName}</strong>,</p>
        
        <p>Our Membership Officer has reviewed your application (Reference: <strong>${refNumber}</strong>) and requires additional details or document revisions before we can proceed.</p>
        
        <p><strong>Remarks from the review officer:</strong></p>
        
        <div style="background-color: #FFFDF5; border-left: 4px solid #FFC107; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #856404;">
          <p style="margin: 0; font-weight: 500;">${remarks}</p>
        </div>
        
        <p>Please contact our team or reply to this email directly with the requested information or document updates so that we can process your application.</p>
        
        <p style="margin-bottom: 0;">Thank you for your cooperation.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e8ed; padding: 16px 24px; text-align: center; font-size: 11px; color: #888888; background-color: #F7F9FA; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Pakistan Chamber of Education. All rights reserved.</p>
        <p style="margin: 0;">PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('========================================================================');
    console.log(`[SIMULATED EMAIL] To: ${toEmail}`);
    console.log(`[SIMULATED EMAIL] Subject: ${subject}`);
    console.log(`[SIMULATED EMAIL] Status: Needs Info. Remarks: ${remarks}`);
    console.log('========================================================================');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log(`[EMAIL SENT] Needs Info Email Sent: ${info.messageId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send Needs Info email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends a welcome email to the newly activated member with their Membership ID & initial credentials.
 */
export const sendMemberActivationEmail = async (
  toEmail: string,
  memberName: string,
  membershipId: string,
  initialPassword?: string
): Promise<boolean> => {
  const transporter = createTransporter();
  
  const subject = `Welcome to PCE! Your Membership ID is ${membershipId}`;
  const htmlContent = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #006A4E; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600;">Pakistan Chamber of Education</h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C8A951; font-weight: bold;">Division Bahawalpur</p>
      </div>
      
      <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 14px;">
        <p style="margin-top: 0;">Dear <strong>${memberName}</strong>,</p>
        
        <p>Congratulations! Your payment has been verified, and your official membership with the Pakistan Chamber of Education (Bahawalpur Division) is now <strong>Active</strong>.</p>
        
        <div style="background-color: #F7F9FA; border-left: 4px solid #006A4E; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Official Membership ID</p>
          <p style="margin: 0 0 12px 0; font-size: 22px; color: #006A4E; font-weight: bold;">${membershipId}</p>
          ${initialPassword ? `
            <p style="margin: 8px 0 2px 0; font-size: 11px; color: #666666; font-weight: 600; text-transform: uppercase;">Portal Login Email</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">${toEmail}</p>
            <p style="margin: 8px 0 2px 0; font-size: 11px; color: #666666; font-weight: 600; text-transform: uppercase;">Initial Password</p>
            <p style="margin: 0; font-size: 13px; font-weight: bold; font-mono;">${initialPassword}</p>
          ` : ''}
        </div>
        
        <p>You can now sign in to the PCE Member Portal to view your profile, download receipts, and access member-only announcements.</p>
        
        <p style="margin-bottom: 0;">Welcome aboard!<br/><strong>Pakistan Chamber of Education</strong></p>
      </div>
      
      <div style="border-top: 1px solid #e1e8ed; padding: 16px 24px; text-align: center; font-size: 11px; color: #888888; background-color: #F7F9FA; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Pakistan Chamber of Education. All rights reserved.</p>
        <p style="margin: 0;">PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('========================================================================');
    console.log(`[SIMULATED ACTIVATION EMAIL] To: ${toEmail}`);
    console.log(`[SIMULATED ACTIVATION EMAIL] Membership ID: ${membershipId}`);
    if (initialPassword) console.log(`[SIMULATED ACTIVATION EMAIL] Initial Password: ${initialPassword}`);
    console.log('========================================================================');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Pakistan Chamber of Education" <noreply@pce.org.pk>',
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log(`[EMAIL SENT] Member Activation Email Sent: ${info.messageId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send activation email to ${toEmail}:`, error.message);
    return false;
  }
};


