import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { isCollegeEmailValid } from '../models/User.js';
import sendEmailOtp from '../utils/sendEmailOtp.js';
import sendWelcomeEmail from '../utils/sendWelcomeEmail.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new college user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, college, phone } = req.body;

    if (!name || !email || !password || !college) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, college email, password, college)',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format for email or password',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!isCollegeEmailValid(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please use your official RJIT college email ending with @rjit.ac.in',
      });
    }

    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A student account with this college email already exists',
      });
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedCollege = typeof college === 'string' ? college.trim() : '';
    let trimmedPhone = '';

    if (!trimmedName || !trimmedCollege) {
      return res.status(400).json({
        success: false,
        message: 'Name and College cannot be empty or whitespace only',
      });
    }

    if (phone) {
      trimmedPhone = String(phone).trim();
      if (trimmedPhone && !/^(?:(?:\+|0{0,2})91[\s-]?)?[6789]\d{9}$/.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone format. Please provide a valid 10-digit Indian mobile number.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      college: trimmedCollege,
      phone: trimmedPhone,
    });

    // Asynchronously dispatch welcome onboarding email without blocking registration response
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error(`[Welcome Email Error] Failed to send welcome email to ${user.email}:`, err.message);
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('[Register User Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both college email and password',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format for email or password',
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid college email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid college email or password',
      });
    }

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('[Login User Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('[Get Me Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * Formats a college email address with masking for privacy (e.g., 0902••••08@rjit.ac.in)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 4) {
    return `${local[0]}••••${local.slice(-1)}@${domain}`;
  }
  const prefix = local.slice(0, 4);
  const suffix = local.slice(-2);
  return `${prefix}••••${suffix}@${domain}`;
};

/**
 * Finds user by college email or 10-digit registered phone number
 */
export const findUserByIdentifier = async (identifier) => {
  if (!identifier || typeof identifier !== 'string') return null;
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return await User.findOne({ email: trimmed.toLowerCase() });
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return await User.findOne({
      phone: { $regex: new RegExp(last10 + '$') },
    });
  }
  return null;
};

/**
 * @desc    Request a 6-digit Email OTP for password recovery
 * @route   POST /api/auth/forgot-password
 * @access  Public (Rate-limited)
 */
export const forgotPassword = async (req, res) => {
  try {
    const identifier = req.body?.identifier || req.body?.email;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered RJIT college email or 10-digit mobile number.',
      });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.email) {
      return res.status(404).json({
        success: false,
        message: 'No registered student account found matching this email or phone number.',
      });
    }

    const now = Date.now();
    const lastOtpTime = user.lastOtpSentAt
      ? typeof user.lastOtpSentAt.getTime === 'function'
        ? user.lastOtpSentAt.getTime()
        : new Date(user.lastOtpSentAt).getTime()
      : 0;

    // Check if lastOtpSentAt exists and is within the last 60 seconds
    if (user.lastOtpSentAt && now - lastOtpTime < 60000) {
      const timeLeft = Math.ceil((60000 - (now - lastOtpTime)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${timeLeft} seconds before requesting a new OTP.`,
      });
    }

    // If valid, update the timestamp immediately and save BEFORE sending the email
    user.lastOtpSentAt = new Date(now);
    await user.save();

    // Generate cryptographically secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP with bcrypt before saving to database
    const salt = await bcrypt.genSalt(10);
    user.resetOtpHash = await bcrypt.hash(otp, salt);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
    user.resetOtpAttempts = 0;
    await user.save();

    // Dispatch branded campus email containing 6-digit OTP (or console fallback in dev)
    await sendEmailOtp(user.email, otp);

    // Return masked email confirmation without EVER leaking the OTP
    return res.json({
      success: true,
      maskedEmail: maskEmail(user.email),
      message: 'A 6-digit OTP has been sent to your registered campus email.',
    });
  } catch (error) {
    console.error('[Forgot Password Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Verify 6-digit Email OTP and return short-lived password reset token
 * @route   POST /api/auth/verify-otp
 * @access  Public (Rate-limited)
 */
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp || typeof identifier !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your registered identifier and the 6-digit OTP.',
      });
    }

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit OTP code.',
      });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Student account not found or invalid request.',
      });
    }

    // Enforce brute-force protection (maximum 5 failed attempts)
    if (user.resetOtpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. This OTP has been invalidated for security. Please request a new one.',
      });
    }

    // Enforce 10-minute expiry window
    if (!user.resetOtpExpires || user.resetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification OTP has expired. Please request a new code.',
      });
    }

    // Verify OTP hash against stored bcrypt hash
    const isMatch = await bcrypt.compare(cleanOtp, user.resetOtpHash || '');
    if (!isMatch) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.resetOtpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Verification successful! Clear OTP fields to prevent replay attacks
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    // Issue 10-minute password reset JWT
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully! You can now set a new password.',
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Reset student password using verified resetToken
 * @route   POST /api/auth/reset-password
 * @access  Public (Rate-limited)
 */
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both reset token and new password.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid, tampered, or expired password reset token.',
      });
    }

    if (!decoded || decoded.purpose !== 'password_reset' || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password reset token purpose.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User associated with this reset token no longer exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully! Please sign in.',
    });
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};
