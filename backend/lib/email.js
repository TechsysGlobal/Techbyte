import nodemailer from 'nodemailer';
import xss from 'xss';
import prisma from './prisma.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email and log the result to ActivityLog
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 */
export async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"TechByte Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);

    // Log successful email
    await prisma.activityLog.create({
      data: {
        adminId: null,
        action: 'EMAIL_SENT',
        entity: 'Email',
        entityId: to,
        details: { recipient: to, subject, status: 'sent' },
      },
    }).catch(err => console.error('[Audit] Failed to log EMAIL_SENT:', err.message));

  } catch (err) {
    console.error('Email send error:', err.message);

    // Log failed email
    await prisma.activityLog.create({
      data: {
        adminId: null,
        action: 'EMAIL_FAILED',
        entity: 'Email',
        entityId: to,
        details: { recipient: to, subject, status: 'failed', error: err.message },
      },
    }).catch(logErr => console.error('[Audit] Failed to log EMAIL_FAILED:', logErr.message));
  }
}

/**
 * Notify admin that a new customer registered
 */
export async function notifyAdminNewRegistration(customer) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: #36b084;">🔔 New Customer Registration</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Company:</strong> ${xss(customer.companyName)}</p>
        <p><strong>Email:</strong> ${xss(customer.email)}</p>
        <p><strong>Country:</strong> ${xss(customer.country)}</p>
        <p><strong>CEO:</strong> ${xss(customer.ceoName)}</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/customers/${customer.id}" 
             style="background: #36b084; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Review Application
          </a>
        </p>
      </div>
    </div>
  `;
  await sendEmail(process.env.ADMIN_NOTIFICATION_EMAIL, `New Registration: ${customer.companyName}`, html);
}

/**
 * Send approval email to customer with password-set link
 */
export async function sendApprovalEmail(customer) {
  const setPasswordUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/set-password?token=${customer.id}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: #36b084;">✅ Registration Approved!</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear ${xss(customer.personalName || customer.ceoName)},</p>
        <p>Your business registration for <strong>${xss(customer.companyName)}</strong> has been approved!</p>
        <p>Please click the button below to set your password and start using your account:</p>
        <p style="margin-top: 20px;">
          <a href="${setPasswordUrl}" 
             style="background: #36b084; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Set Your Password
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">If the button doesn't work, copy this link: ${setPasswordUrl}</p>
      </div>
    </div>
  `;
  await sendEmail(customer.email, 'Your TechByte Registration Has Been Approved!', html);
}

/**
 * Send decline email to customer with reason
 */
export async function sendDeclineEmail(customer, reason) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: #e74c3c;">⚠️ Registration Update Required</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear ${xss(customer.personalName || customer.ceoName)},</p>
        <p>We reviewed your registration for <strong>${xss(customer.companyName)}</strong> and need some additional information or corrections:</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e74c3c;">
          ${xss(reason)}
        </div>
        <p>Please update your information and re-apply. If you have questions, contact us at support@techbyte.com.</p>
      </div>
    </div>
  `;
  await sendEmail(customer.email, 'TechByte Registration - Action Required', html);
}

/**
 * Send password setup email to new admin-created customer
 */
export async function sendPasswordSetupEmail(email, setupLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: #36b084;">Welcome to TechByte!</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Your account has been created by our administrator.</p>
        <p>Please click the button below to set your password and access your account:</p>
        <p style="margin-top: 20px;">
          <a href="${setupLink}" 
             style="background: #36b084; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Set Password
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Or copy this link: ${setupLink}</p>
      </div>
    </div>
  `;
  await sendEmail(email, 'Welcome to TechByte - Set Your Password', html);
}

/**
 * Send a security alert email to admin (skips ActivityLog as per user request)
 */
export async function sendSecurityAlert(ip, failureCount, emailAttempted) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e74c3c; border-radius: 8px;">
      <div style="background: #e74c3c; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🚨 Security Alert: Brute Force Detected</h2>
      </div>
      <div style="padding: 20px;">
        <p>Multiple failed login attempts detected from a single IP address.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Detected IP:</strong> ${ip}</p>
        <p><strong>Failure Count:</strong> ${failureCount} attempts in the last 5 minutes</p>
        <p><strong>Most Recent Email Attempted:</strong> ${emailAttempted}</p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          The IP address has been flagged in SecurityLog. Please monitor logs for further activity.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"TechByte Security" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: `🚨 Security Alert: Brute Force from ${ip}`,
      html,
    });
    console.log(`Security alert sent for IP: ${ip}`);
  } catch (err) {
    console.error('Failed to send security alert email:', err.message);
  }
}

