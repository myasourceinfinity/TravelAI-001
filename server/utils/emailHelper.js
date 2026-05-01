/**
 * emailHelper.js
 *
 * Nodemailer transport using Gmail SMTP + App Password.
 * Sends real emails for verification and password reset flows.
 *
 * Required .env variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE,
 *   SMTP_USER, SMTP_PASS,
 *   SMTP_FROM_NAME, SMTP_FROM_EMAIL
 */

const nodemailer = require('nodemailer');

// ── Create reusable transporter ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',   // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (non-blocking)
transporter.verify()
  .then(() => console.log('✔  SMTP transport ready'))
  .catch(err => console.warn('⚠  SMTP transport NOT ready:', err.message));

const FROM = `"${process.env.SMTP_FROM_NAME || 'AITravelBuddy'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

// ═══════════════════════════════════════════════════════════════════════════════
// sendVerificationEmail
// ═══════════════════════════════════════════════════════════════════════════════
async function sendVerificationEmail({ to, firstName, token }) {
  const verificationUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;

  const mailOptions = {
    from:    FROM,
    to,
    subject: '✈️ Verify your AITravelBuddy account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0e1117; color: #e6eaf3; border-radius: 16px;">
        <h2 style="color: #7b93db; margin: 0 0 8px;">Hi ${firstName || 'there'} 👋</h2>
        <p style="color: #a0aec0; line-height: 1.6; margin: 16px 0;">
          Thanks for signing up for <strong style="color: #e6eaf3;">AITravelBuddy</strong>!
          Please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}"
             style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4a5cd6, #3b49a8); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #718096; font-size: 13px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color: #7b93db; word-break: break-all;">${verificationUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #2d3748; margin: 24px 0;" />
        <p style="color: #4a5568; font-size: 12px; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  console.log(`📧 Sending verification email to ${to}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✔  Verification email sent — Message ID: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
}

// ═══════════════════════════════════════════════════════════════════════════════
// sendPasswordResetEmail
// ═══════════════════════════════════════════════════════════════════════════════
async function sendPasswordResetEmail({ to, firstName, token }) {
  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;

  const mailOptions = {
    from:    FROM,
    to,
    subject: '🔑 Reset your AITravelBuddy password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0e1117; color: #e6eaf3; border-radius: 16px;">
        <h2 style="color: #7b93db; margin: 0 0 8px;">Hi ${firstName || 'there'} 👋</h2>
        <p style="color: #a0aec0; line-height: 1.6; margin: 16px 0;">
          We received a request to reset your <strong style="color: #e6eaf3;">AITravelBuddy</strong> password.
          Click the button below to set a new password.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4a5cd6, #3b49a8); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <p style="color: #e6794a; font-size: 13px; font-weight: 500; text-align: center;">
          ⏰ This link expires in 1 hour.
        </p>
        <p style="color: #718096; font-size: 13px; line-height: 1.5; margin-top: 16px;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${resetUrl}" style="color: #7b93db; word-break: break-all;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #2d3748; margin: 24px 0;" />
        <p style="color: #4a5568; font-size: 12px; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will remain unchanged.
        </p>
      </div>
    `,
  };

  console.log(`📧 Sending password reset email to ${to}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✔  Password reset email sent — Message ID: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
