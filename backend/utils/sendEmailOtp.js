import nodemailer from 'nodemailer';
import { generateOtpEmail } from './emailTemplates.js';

// Module-level in-memory lock: ensures no email address can receive > 1 email per 60 seconds
export const recentEmails = new Map();

/**
 * Sends a 6-digit OTP to the student's registered college email address.
 * Falls back to formatted console output in local development when SMTP credentials are not configured.
 *
 * @param {string} recipientEmail - Recipient student email (@rjit.ac.in)
 * @param {string} otp - 6-digit one-time password
 * @returns {Promise<{ success?: boolean, devFallback?: boolean, mocked?: boolean }>}
 */
export const sendEmailOtp = async (recipientEmail, otp) => {
  // Block real email dispatch during automated tests and AI verification runs
  if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.JEST_WORKER_ID) {
    return { mocked: true };
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Local development fallback if SMTP credentials are not configured
  if (!smtpUser || !smtpPass) {
    console.info(`
┌─────────────────────────────────────────────────────────────┐
│                [DEV EMAIL OTP FALLBACK]                     │
├─────────────────────────────────────────────────────────────┤
│ Recipient : ${recipientEmail.padEnd(46, ' ')}│
│ 6-Digit OTP : ${otp}                                      │
│ Validity  : 10 Minutes                                      │
│ Note      : Configure SMTP_USER and SMTP_PASS for live SMTP │
└─────────────────────────────────────────────────────────────┘
`);
    return { success: true, devFallback: true };
  }

  // In-memory rate-limit lock: check if toEmail received an email within the last 60 seconds
  const toEmail = recipientEmail ? recipientEmail.toLowerCase().trim() : '';
  const now = Date.now();
  if (recentEmails.has(toEmail)) {
    const lastSent = recentEmails.get(toEmail);
    if (now - lastSent < 60000) {
      const timeLeft = Math.ceil((60000 - (now - lastSent)) / 1000);
      const err = new Error(`Rate limit exceeded: Please wait ${timeLeft} seconds before requesting another OTP.`);
      err.statusCode = 429;
      throw err;
    }
  }

  // Create nodemailer transporter with configured SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"ReuseCampus Security" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Your ReuseCampus Password Reset Code: ${otp}`,
    text: `Your 6-digit password reset verification code for ReuseCampus (RJIT Tekanpur) is: ${otp}\n\nThis code will expire in 10 minutes.\n\nSecurity Notice: Never share this code with anyone.\n\nIf you did not request a password reset, please ignore this email.`,
    html: generateOtpEmail(otp, recipientEmail),
  };

  // Record timestamp immediately before calling transporter.sendMail
  recentEmails.set(toEmail, Date.now());
  await transporter.sendMail(mailOptions);
  return { success: true, devFallback: false };
};

export default sendEmailOtp;
