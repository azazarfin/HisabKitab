const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter using SMTP settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Shared HTML email template
const emailTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1117; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background: linear-gradient(135deg, #1a1d27 0%, #1e2130 100%); border-radius:16px; border:1px solid rgba(255,255,255,0.06); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0; text-align:center;">
              <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">
                📒 HisabKitab
              </h1>
              <p style="margin:8px 0 0; font-size:13px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1.5px;">
                Expense Tracker
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:24px 32px;">
              <div style="height:1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
              <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.3);">
                This email was sent by HisabKitab. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send email verification link
 */
const sendVerificationEmail = async (to, name, token) => {
  const transporter = createTransporter();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const body = `
    <h2 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#ffffff;">
      Verify Your Email
    </h2>
    <p style="margin:0 0 24px; font-size:15px; color:rgba(255,255,255,0.65); line-height:1.6;">
      Hi <strong style="color:#ffffff;">${name}</strong>, welcome to HisabKitab! Please verify your email address to get started.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; border-radius:10px; letter-spacing:0.3px;">
            ✉️ Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0; font-size:13px; color:rgba(255,255,255,0.35); line-height:1.5;">
      This link will expire in <strong style="color:rgba(255,255,255,0.5);">24 hours</strong>. If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:8px 0 0; font-size:12px; color:rgba(99,102,241,0.7); word-break:break-all;">
      ${verifyUrl}
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Verify your HisabKitab account',
    html: emailTemplate('Verify Email', body),
  });
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const body = `
    <h2 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#ffffff;">
      Reset Your Password
    </h2>
    <p style="margin:0 0 24px; font-size:15px; color:rgba(255,255,255,0.65); line-height:1.6;">
      Hi <strong style="color:#ffffff;">${name}</strong>, we received a request to reset your password. Click the button below to choose a new one.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg, #f59e0b, #ef4444); color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; border-radius:10px; letter-spacing:0.3px;">
            🔒 Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0; font-size:13px; color:rgba(255,255,255,0.35); line-height:1.5;">
      This link will expire in <strong style="color:rgba(255,255,255,0.5);">1 hour</strong>. If you didn't request a password reset, you can ignore this email.
    </p>
    <p style="margin:8px 0 0; font-size:12px; color:rgba(99,102,241,0.7); word-break:break-all;">
      ${resetUrl}
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your HisabKitab password',
    html: emailTemplate('Reset Password', body),
  });
};

/**
 * SMTP Health Check — verifies connection and sends a test email to ADMIN_EMAIL
 * Called once on server startup to confirm mail delivery is working.
 */
const smtpHealthCheck = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — skipping mail health check.');
    return { ok: false, reason: 'SMTP credentials not set' };
  }

  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not set — skipping mail health check.');
    return { ok: false, reason: 'ADMIN_EMAIL not set' };
  }

  const transporter = createTransporter();

  // Step 1: Verify SMTP connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully.');
  } catch (err) {
    console.error('❌ SMTP connection failed:', err.message);
    return { ok: false, reason: `SMTP connection failed: ${err.message}` };
  }

  // Step 2: Send test email
  try {
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

    const body = `
      <h2 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#ffffff;">
        🟢 Server Started Successfully
      </h2>
      <p style="margin:0 0 16px; font-size:15px; color:rgba(255,255,255,0.65); line-height:1.6;">
        HisabKitab backend has started and the SMTP mail system is working correctly.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="padding:12px 16px; background:rgba(255,255,255,0.04); border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 6px; font-size:13px; color:rgba(255,255,255,0.4);">Timestamp</p>
            <p style="margin:0; font-size:15px; color:#ffffff; font-weight:500;">${now}</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px 16px; background:rgba(255,255,255,0.04); border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 6px; font-size:13px; color:rgba(255,255,255,0.4);">SMTP Host</p>
            <p style="margin:0; font-size:15px; color:#ffffff; font-weight:500;">${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px 16px; background:rgba(255,255,255,0.04); border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 6px; font-size:13px; color:rgba(255,255,255,0.4);">Environment</p>
            <p style="margin:0; font-size:15px; color:#ffffff; font-weight:500;">${process.env.NODE_ENV || 'development'}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.35); line-height:1.5;">
        If you're receiving this, your email system is fully operational. No action is needed.
      </p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmail,
      subject: `🟢 HisabKitab Server Started — ${now}`,
      html: emailTemplate('Server Health Check', body),
    });

    console.log(`📧 Health check email sent to ${adminEmail}`);
    return { ok: true };
  } catch (err) {
    console.error('❌ Failed to send health check email:', err.message);
    return { ok: false, reason: `Send failed: ${err.message}` };
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, smtpHealthCheck };
