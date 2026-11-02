/**
 * @file emailTemplates.js
 * @desc Responsive, email-client compatible HTML/CSS email templates for ReuseCampus.
 * Adheres to a cohesive "Light Emerald" theme matching the frontend aesthetics.
 * Uses inline styles and table layouts for maximum cross-client email rendering support.
 */

/**
 * Reusable HTML shell wrapper for all ReuseCampus transactional emails.
 *
 * @param {Object} options
 * @param {string} options.title - Email document title
 * @param {string} options.preheader - Preview text snippet shown in inbox list
 * @param {string} options.contentHtml - Main inner HTML body content
 * @returns {string} Fully structured HTML document
 */
export const wrapEmailShell = ({ title, preheader = '', contentHtml }) => {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <style>
    table, td, div, p, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  ${
    preheader
      ? `<div style="display: none; font-size: 1px; color: #f0fdf4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          ${preheader}
         </div>`
      : ''
  }

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-align: center;">
              <!-- Campus Icon Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td style="width: 44px; height: 44px; background-color: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 14px; text-align: center; vertical-align: middle; font-size: 22px;">
                    🎓
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                Reuse<span style="color: #a7f3d0;">Campus</span>
              </h1>
              
              <!-- College Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 8px auto 0 auto;">
                <tr>
                  <td style="background-color: rgba(6, 95, 70, 0.4); border: 1px solid rgba(167, 243, 208, 0.4); border-radius: 20px; padding: 4px 14px; text-align: center;">
                    <span style="color: #e6fffa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                      Official RJIT Tekanpur Marketplace
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Inner Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background-color: #ffffff;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600;">
                Rustamji Institute of Technology (RJIT) · BSF Academy, Tekanpur, Gwalior (M.P.)
              </p>
              <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This is an automated transmission for verified student accounts ending with @rjit.ac.in.
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                © ${currentYear} ReuseCampus RJIT · All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generates an OTP verification email for password resets or identity checks.
 *
 * @param {string} otp - 6-digit one-time password
 * @param {string} [recipientEmail=''] - Optional recipient email for display
 * @returns {string} Full HTML email string
 */
export const generateOtpEmail = (otp, recipientEmail = '') => {
  const contentHtml = `
    <!-- Title -->
    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">
      Password Reset Verification
    </h2>

    <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
      Hello, we received a request to reset the password for your RJIT campus account${
        recipientEmail ? ` (<strong>${recipientEmail}</strong>)` : ''
      }.
      Use the one-time verification code below to complete your password update:
    </p>

    <!-- Prominent Centered Emerald OTP Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 18px; padding: 24px 16px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
            Your 6-Digit One-Time Code
          </p>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #047857; margin: 0 0 12px 0; text-indent: 10px;">
            ${otp}
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="background-color: #d1fae5; border-radius: 20px; padding: 4px 14px; color: #047857; font-size: 12px; font-weight: 700;">
                ⏱️ Valid for 10 minutes only
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Security Warning Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px 16px;">
      <tr>
        <td style="vertical-align: top; width: 24px; padding-right: 10px; font-size: 16px;">
          🔒
        </td>
        <td style="color: #92400e; font-size: 13px; line-height: 1.5; font-weight: 500;">
          <strong>Security Warning:</strong> Never share this OTP with anyone. ReuseCampus administrators and faculty will <em>never</em> ask for your verification code or password.
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
      If you did not request this password reset, you can safely ignore this email. Your current password remains secure and unchanged.
    </p>

    <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
      Need assistance? Contact your campus student administrator or support.
    </p>
  `;

  return wrapEmailShell({
    title: 'Your ReuseCampus Password Reset Code',
    preheader: `Your 6-digit verification code is ${otp}. Valid for 10 minutes.`,
    contentHtml,
  });
};

/**
 * Generates a warm, welcoming onboarding email for newly registered college students.
 *
 * @param {string} userName - Full name of the student
 * @returns {string} Full HTML email string
 */
export const generateWelcomeEmail = (userName) => {
  const displayName = userName ? userName.split(' ')[0] : 'Student';

  const contentHtml = `
    <!-- Header Greeting -->
    <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">
      Welcome to the Campus Family, ${displayName}! 🎉
    </h2>

    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Congratulations! Your student account is now verified and active. You have full access to the <strong>Official RJIT Campus Marketplace</strong>—where students buy, sell, and donate second-hand academic gear safely on campus.
    </p>

    <!-- 3 Quick Tips Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px 20px; margin: 0 0 28px 0;">
      <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚡ 3 Quick Tips to Get Started
      </h3>

      <!-- Tip 1 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 38px; vertical-align: top; padding-right: 12px;">
            <div style="width: 34px; height: 34px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; text-align: center; line-height: 34px; font-size: 17px;">
              🎓
            </div>
          </td>
          <td>
            <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; font-weight: 700;">
              Verified @rjit.ac.in Community Only
            </h4>
            <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
              Every user on ReuseCampus is an authenticated student or staff member. No strangers or commercial brokers—trade with trust.
            </p>
          </td>
        </tr>
      </table>

      <!-- Tip 2 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 38px; vertical-align: top; padding-right: 12px;">
            <div style="width: 34px; height: 34px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; text-align: center; line-height: 34px; font-size: 17px;">
              💸
            </div>
          </td>
          <td>
            <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; font-weight: 700;">
              100% Free & Zero Commission
            </h4>
            <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
              Keep 100% of your earnings. Donate books or engineering drafters to junior batchmates for ₹0 or sell at student-friendly prices.
            </p>
          </td>
        </tr>
      </table>

      <!-- Tip 3 -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 38px; vertical-align: top; padding-right: 12px;">
            <div style="width: 34px; height: 34px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; text-align: center; line-height: 34px; font-size: 17px;">
              💬
            </div>
          </td>
          <td>
            <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; font-weight: 700;">
              Direct WhatsApp & Campus Deals
            </h4>
            <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
              Chat directly via WhatsApp and meet safely in familiar campus locations like the Central Library, Canteen, or Hostels.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0; text-align: center;">
      <tr>
        <td align="center">
          <a href="https://reusecampus.netlify.app" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
            Explore Campus Listings →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px; line-height: 1.5;">
      Got old textbooks, lab coats, or scientific calculators sitting around? List them now and help a peer save money!
    </p>

    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px; font-weight: 600;">
      Warm regards,<br>
      <span style="color: #059669;">The ReuseCampus Student Team</span>
    </p>
  `;

  return wrapEmailShell({
    title: 'Welcome to ReuseCampus - RJIT Student Marketplace',
    preheader: `Welcome ${displayName}! Start buying, selling, and donating academic gear on campus.`,
    contentHtml,
  });
};

export default {
  wrapEmailShell,
  generateOtpEmail,
  generateWelcomeEmail,
};
