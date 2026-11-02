import mongoose from 'mongoose';

/**
 * Validates college email against configurable environment variable ALLOWED_COLLEGE_DOMAIN / ALLOWED_EMAIL_DOMAINS
 * Strict support for RJIT campus emails (e.g., 0902cs241008@rjit.ac.in)
 * as specified in PRD Section 8.
 */
export const isCollegeEmailValid = (email) => {
  if (!email || typeof email !== 'string') return false;
  const lowerEmail = email.toLowerCase().trim();

  // Basic email structure validation allowing alphanumeric student roll numbers (e.g., 0902cs241008@rjit.ac.in)
  const emailRegex = /^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/i;
  const match = lowerEmail.match(emailRegex);
  if (!match) return false;

  const domain = match[1];

  // Retrieve allowed domains from environment variables (ALLOWED_COLLEGE_DOMAIN takes precedence)
  const rawDomains =
    process.env.ALLOWED_COLLEGE_DOMAIN ||
    process.env.ALLOWED_EMAIL_DOMAINS ||
    'rjit.ac.in';

  const allowedDomains = rawDomains
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (allowedDomains.length > 0) {
    return allowedDomains.some((d) => domain === d || domain.endsWith('.' + d));
  }

  return domain === 'rjit.ac.in' || domain.endsWith('.rjit.ac.in');
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your institutional college email address'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return isCollegeEmailValid(value);
        },
        message: 'Please use your official RJIT college email ending with @rjit.ac.in',
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    college: {
      type: String,
      required: [true, 'Please specify your college or university name'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
    resetOtpHash: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },
    lastOtpSentAt: {
      type: Date,
    },
    savedItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to exclude sensitive fields when transforming user to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.resetOtpHash;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
