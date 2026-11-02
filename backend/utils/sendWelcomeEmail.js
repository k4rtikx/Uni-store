import nodemailer from 'nodemailer';
import { generateWelcomeEmail } from './emailTemplates.js';

/**
 * Sends a welcome onboarding email to a newly registered RJIT student.
 * Falls back to formatted console output in local development when SMTP credentials are not configured.
 *
 * @param {string} recipientEmail - Recipient student college email (@rjit.ac.in)
 * @param {string} userName - Full name of the newly registered student
 * @returns {Promise<{ success?: boolean, devFallback?: boolean, mocked?: boolean }>}
 */
export const sendWelcomeEmail = async (recipientEmail, userName) => {
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
│              [DEV WELCOME EMAIL FALLBACK]                   │
├─────────────────────────────────────────────────────────────┤
│ Recipient : ${recipientEmail.padEnd(46, ' ')}│
│ Student   : ${(userName || 'Student').padEnd(46, ' ')}│
│ Template  : generateWelcomeEmail                            │
│ Note      : Configure SMTP_USER and SMTP_PASS for live SMTP │
└─────────────────────────────────────────────────────────────┘
`);
    return { success: true, devFallback: true };
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

  const displayName = userName ? userName.split(' ')[0] : 'Student';

  const mailOptions = {
    from: `"ReuseCampus Team" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Welcome to ReuseCampus, ${displayName}! 🎓 Official RJIT Marketplace`,
    text: `Welcome to ReuseCampus, ${userName || 'Student'}!\n\nYour student account is now verified and active on the Official RJIT Campus Marketplace.\n\n3 Quick Tips to Get Started:\n1. Verified @rjit.ac.in Community Only - Trade safely with fellow batchmates.\n2. 100% Free & Zero Commission - Keep 100% of your earnings or donate to juniors for ₹0.\n3. Direct WhatsApp Deals - Meet safely at the library, canteen, or hostels.\n\nStart browsing listings: https://reusecampus.netlify.app\n\nHappy trading!\n— The ReuseCampus RJIT Team`,
    html: generateWelcomeEmail(userName),
  };

  await transporter.sendMail(mailOptions);
  return { success: true, devFallback: false };
};

export default sendWelcomeEmail;
