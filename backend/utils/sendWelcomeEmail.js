import nodemailer from 'nodemailer';
import { generateWelcomeEmail } from './emailTemplates.js';

/**
 * Sends a welcome onboarding email to a newly registered CED student.
 * Falls back to formatted console output in local development when SMTP credentials are not configured.
 *
 * @param {string} recipientEmail - Recipient student college email (@ced.alliance.edu.in)
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              [DEV WELCOME EMAIL FALLBACK]                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Recipient : ${recipientEmail.padEnd(46, ' ')}â”‚
â”‚ Student   : ${(userName || 'Student').padEnd(46, ' ')}â”‚
â”‚ Template  : generateWelcomeEmail                            â”‚
â”‚ Note      : Configure SMTP_USER and SMTP_PASS for live SMTP â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
    from: `"Uni-store Team" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Welcome to Uni-store, ${displayName}! ðŸŽ“ Official CED Marketplace`,
    text: `Welcome to Uni-store, ${userName || 'Student'}!\n\nYour student account is now verified and active on the Official CED Campus Marketplace.\n\n3 Quick Tips to Get Started:\n1. Verified @ced.alliance.edu.in Community Only - Trade safely with fellow batchmates.\n2. 100% Free & Zero Commission - Keep 100% of your earnings or donate to juniors for â‚¹0.\n3. Direct WhatsApp Deals - Meet safely at the library, canteen, or hostels.\n\nStart browsing listings: https://Uni-store.netlify.app\n\nHappy trading!\nâ€” The Uni-store CED Team`,
    html: generateWelcomeEmail(userName),
  };

  await transporter.sendMail(mailOptions);
  return { success: true, devFallback: false };
};

export default sendWelcomeEmail;

