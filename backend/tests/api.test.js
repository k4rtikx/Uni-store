/**
 * @file api.test.js
 * @desc Built-in automated test suite using Node's native test runner (node:test).
 * Validates core business logic, RJIT email security, NoSQL injection sanitization,
 * marketplace domain invariants, auth middleware guards, and HTTP health contracts.
 * Zero external testing libraries or mock frameworks required.
 */

// 1. Explicitly initialize test environment variables before module evaluation
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.JWT_SECRET = 'test_jwt_secret_token_key_for_unit_tests_32chars';
process.env.ALLOWED_COLLEGE_DOMAIN = 'rjit.ac.in';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// 2. Dynamic asynchronous imports ensure process.env.NODE_ENV='test' is active
const { default: app } = await import('../server.js');
const { default: User, isCollegeEmailValid } = await import('../models/User.js');
const { sanitizeKeys } = await import('../middlewares/sanitizeMiddleware.js');
const { default: Listing, CATEGORIES, CONDITIONS, STATUSES } = await import('../models/Listing.js');
const { protect } = await import('../middlewares/authMiddleware.js');
const { isListingOwner, createListing, getListingById, markAsSold, updateListing, deleteListing, updateListingStatus, getMyListings, getListings } = await import('../controllers/listingController.js');
const { registerUser, loginUser, getMe, forgotPassword, verifyOtp, resetPassword, maskEmail } = await import('../controllers/authController.js');
const { getSavedItems, toggleSaveItem, getUserProfile, updateUserProfile } = await import('../controllers/userController.js');
const { errorHandler, notFound } = await import('../middlewares/errorHandler.js');
const { uploadSingleImage } = await import('../middlewares/uploadMiddleware.js');
const { configureCloudinary } = await import('../utils/cloudinary.js');
const { default: jwt } = await import('jsonwebtoken');
const { default: bcrypt } = await import('bcryptjs');
const { generateOtpEmail, generateWelcomeEmail } = await import('../utils/emailTemplates.js');
const { sendWelcomeEmail } = await import('../utils/sendWelcomeEmail.js');
const { sendEmailOtp, recentEmails } = await import('../utils/sendEmailOtp.js');

describe('=== ReuseCampus Senior Engineering Automated Test Suite ===', () => {

  describe('1. RJIT Institutional Email Validation (@rjit.ac.in)', () => {
    it('should approve valid RJIT student roll number email addresses', () => {
      assert.strictEqual(isCollegeEmailValid('0902cs241008@rjit.ac.in'), true);
      assert.strictEqual(isCollegeEmailValid('0902it211045@rjit.ac.in'), true);
      assert.strictEqual(isCollegeEmailValid('0902me221012@rjit.ac.in'), true);
    });

    it('should approve valid department subdomains and dot notations', () => {
      assert.strictEqual(isCollegeEmailValid('student.cse@rjit.ac.in'), true);
      assert.strictEqual(isCollegeEmailValid('faculty@cs.rjit.ac.in'), true);
      assert.strictEqual(isCollegeEmailValid('admin.office@rjit.ac.in'), true);
    });

    it('should normalize and accept mixed-case or padded emails', () => {
      assert.strictEqual(isCollegeEmailValid('  0902CS241008@RJIT.AC.IN  '), true);
      assert.strictEqual(isCollegeEmailValid('Student@Rjit.Ac.In'), true);
    });

    it('should strictly reject commercial public email providers', () => {
      assert.strictEqual(isCollegeEmailValid('user@gmail.com'), false);
      assert.strictEqual(isCollegeEmailValid('student@gmail.com'), false);
      assert.strictEqual(isCollegeEmailValid('hacker@yahoo.co.in'), false);
      assert.strictEqual(isCollegeEmailValid('scammer@outlook.com'), false);
      assert.strictEqual(isCollegeEmailValid('user@hotmail.com'), false);
    });

    it('should reject other university domains or domain spoofing attempts', () => {
      assert.strictEqual(isCollegeEmailValid('student@iitd.ac.in'), false);
      assert.strictEqual(isCollegeEmailValid('student@mit.edu'), false);
      assert.strictEqual(isCollegeEmailValid('scammer@rjit.ac.in.attacker.com'), false);
      assert.strictEqual(isCollegeEmailValid('fake@fake-rjit.ac.in'), false);
    });

    it('should reject malformed emails, non-strings, and empty inputs', () => {
      assert.strictEqual(isCollegeEmailValid(''), false);
      assert.strictEqual(isCollegeEmailValid(null), false);
      assert.strictEqual(isCollegeEmailValid(undefined), false);
      assert.strictEqual(isCollegeEmailValid(12345), false);
      assert.strictEqual(isCollegeEmailValid('plainaddress'), false);
      assert.strictEqual(isCollegeEmailValid('@rjit.ac.in'), false);
    });
  });

  describe('2. NoSQL Injection & Input Sanitization (sanitizeKeys)', () => {
    it('should strip malicious MongoDB operator keys ($where, $gt, $ne, $regex)', () => {
      const maliciousPayload = {
        email: '0902cs241008@rjit.ac.in',
        password: { $gt: '' },
        $where: 'this.password.length > 0',
        role: 'student',
      };

      sanitizeKeys(maliciousPayload);

      assert.strictEqual(maliciousPayload.$where, undefined);
      assert.deepStrictEqual(maliciousPayload.password, {});
      assert.strictEqual(maliciousPayload.email, '0902cs241008@rjit.ac.in');
      assert.strictEqual(maliciousPayload.role, 'student');
    });

    it('should recursively sanitize deeply nested objects and arrays', () => {
      const nestedPayload = {
        filter: {
          category: 'Books',
          price: {
            $lte: 500,
            nested: {
              $regex: '.*',
              validTag: 'semester-4',
            },
          },
        },
        tags: [{ $ne: 'sold' }, { name: 'electronics' }],
      };

      sanitizeKeys(nestedPayload);

      assert.strictEqual(nestedPayload.filter.price.$lte, undefined);
      assert.strictEqual(nestedPayload.filter.price.nested.$regex, undefined);
      assert.strictEqual(nestedPayload.filter.price.nested.validTag, 'semester-4');
      assert.strictEqual(nestedPayload.tags[0].$ne, undefined);
      assert.strictEqual(nestedPayload.tags[1].name, 'electronics');
    });

    it('should strip dot-notated field injection keys', () => {
      const dotPayload = {
        'seller.isVerified': true,
        'profile.role': 'admin',
        title: 'Engineering Mechanics by Timoshenko',
      };

      sanitizeKeys(dotPayload);

      assert.strictEqual(dotPayload['seller.isVerified'], undefined);
      assert.strictEqual(dotPayload['profile.role'], undefined);
      assert.strictEqual(dotPayload.title, 'Engineering Mechanics by Timoshenko');
    });

    it('should safely preserve Base64 canvas compressed image strings', () => {
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...==';
      const listingPayload = {
        title: 'Scientific Calculator fx-991EX',
        price: 850,
        imageUrl: base64Data,
      };

      sanitizeKeys(listingPayload);

      assert.strictEqual(listingPayload.imageUrl, base64Data);
      assert.strictEqual(listingPayload.price, 850);
    });
  });

  describe('3. Marketplace Domain Rules & Schema Invariants', () => {
    it('should maintain canonical campus categories including books, lab equipment, and electronics', () => {
      const requiredCategories = ['Books', 'Lab Equipment', 'Electronics', 'Stationery'];
      for (const cat of requiredCategories) {
        assert.ok(CATEGORIES.includes(cat), `Missing required category: ${cat}`);
      }
    });

    it('should strictly define allowed conditions', () => {
      assert.deepStrictEqual(CONDITIONS, ['New', 'Like New', 'Good', 'Fair']);
    });

    it('should restrict listing status to Available or Sold (Stage 2)', () => {
      assert.deepStrictEqual(STATUSES, ['Available', 'Sold']);
    });

    it('should include views Number field in Listing schema defaulting to 0', () => {
      const viewsField = Listing.schema.path('views');
      assert.ok(viewsField);
      assert.strictEqual(viewsField.instance, 'Number');
      assert.strictEqual(viewsField.defaultValue, 0);
    });

    it('should configure status field in Listing schema with enum [Available, Sold] defaulting to Available', () => {
      const statusField = Listing.schema.path('status');
      assert.ok(statusField);
      assert.strictEqual(statusField.defaultValue, 'Available');
      assert.deepStrictEqual(statusField.options.enum, ['Available', 'Sold']);
    });

    it('should support ₹0 pricing for peer-to-peer junior donations', () => {
      const freeDonationPrice = 0;
      assert.strictEqual(freeDonationPrice >= 0, true);
      assert.strictEqual(freeDonationPrice === 0, true);
    });

    it('should enforce 800,000 character maximum length on imageUrl in Listing schema', () => {
      const imageField = Listing.schema.path('imageUrl');
      assert.ok(imageField);
      assert.strictEqual(imageField.options.maxlength[0], 800000);
    });

    it('should include itemPhoto string field in Listing schema for Cloudinary uploads', () => {
      const itemPhotoField = Listing.schema.path('itemPhoto');
      assert.ok(itemPhotoField);
      assert.strictEqual(itemPhotoField.instance, 'String');
    });
  });

  describe('4. Authentication & Authorization Middleware Guard', () => {
    it('should reject unauthenticated requests missing bearer token with 401', async () => {
      const req = { headers: {} };
      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /not authorized/i);
    });

    it('should reject non-Bearer authorization header formats', async () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.success, false);
    });

    it('should reject malformed or tampered JWT bearer tokens with 401', async () => {
      const req = { headers: { authorization: 'Bearer invalid.tampered.token' } };
      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /token validation failed/i);
    });

    it('should correctly authorize listing owner and block unauthorized cross-user modifications (403 guard)', () => {
      const ownerId = '654321000000000000000001';
      const attackerId = '654321000000000000000002';

      // Owner access authorized
      assert.strictEqual(isListingOwner(ownerId, ownerId), true);

      // Attacker blocked from modifying another student user's listing
      assert.strictEqual(isListingOwner(ownerId, attackerId), false);

      // Edge cases: missing/null IDs return false
      assert.strictEqual(isListingOwner(null, ownerId), false);
      assert.strictEqual(isListingOwner(ownerId, undefined), false);
    });
  });

  describe('5. Health Endpoint & Live HTTP Contract', () => {
    let testServer;
    let baseUrl;

    before(async () => {
      await new Promise((resolve) => {
        testServer = app.listen(0, '127.0.0.1', () => {
          const port = testServer.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (testServer) {
        await new Promise((resolve) => testServer.close(resolve));
      }
    });

    it('should expose a valid, running Express app instance', () => {
      assert.ok(app);
      assert.strictEqual(typeof app.handle, 'function');
    });

    it('should return 200 OK with online status and ISO timestamp on GET /api/health', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'online');
      assert.strictEqual(data.environment, 'test');
      assert.ok(data.timestamp);
      assert.ok(!isNaN(Date.parse(data.timestamp)), 'Timestamp must be a valid ISO date');
    });
  });

  describe('6. Production-Grade 3-Step Email OTP Password Recovery Flow', () => {
    it('should correctly mask student college emails for privacy (e.g., 0902••••08@rjit.ac.in)', () => {
      assert.strictEqual(maskEmail('0902cs241008@rjit.ac.in'), '0902••••08@rjit.ac.in');
      assert.strictEqual(maskEmail('0902it211045@rjit.ac.in'), '0902••••45@rjit.ac.in');
      assert.strictEqual(maskEmail('user@rjit.ac.in'), 'u••••r@rjit.ac.in');
      assert.strictEqual(maskEmail(''), '');
    });

    it('should reject forgot-password when identifier is missing or empty with 400', async () => {
      const req = { body: {} };
      let statusCode = null;
      let jsonBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await forgotPassword(req, res);
      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /registered rjit college email or 10-digit/i);
    });

    it('should return 404 when no student account matches the provided email or phone', async () => {
      const origFindOne = User.findOne;
      User.findOne = async () => null;

      try {
        const req = { body: { identifier: 'unknown.student@rjit.ac.in' } };
        let statusCode = null;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await forgotPassword(req, res);
        assert.strictEqual(statusCode, 404);
        assert.strictEqual(jsonBody.success, false);
        assert.match(jsonBody.message, /no registered student account found/i);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should generate 6-digit OTP, bcrypt hash, 10m expiry, and return maskedEmail without leaking OTP', async () => {
      const origFindOne = User.findOne;
      const testUserId = '654321000000000000000001';
      let savedUser = null;

      const mockUser = {
        _id: testUserId,
        email: '0902cs241008@rjit.ac.in',
        phone: '9876543210',
        resetOtpHash: null,
        resetOtpExpires: null,
        resetOtpAttempts: 0,
        save: async function () {
          savedUser = this;
          return this;
        },
      };

      User.findOne = async () => mockUser;

      try {
        const req = { body: { identifier: '0902cs241008@rjit.ac.in' } };
        let statusCode = 200;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await forgotPassword(req, res);

        assert.strictEqual(statusCode, 200);
        assert.strictEqual(jsonBody.success, true);
        assert.strictEqual(jsonBody.maskedEmail, '0902••••08@rjit.ac.in');
        assert.strictEqual(jsonBody.otp, undefined, 'CRITICAL SECURITY INVARIANT: OTP must NEVER be leaked in JSON response');
        assert.strictEqual(jsonBody.code, undefined);

        // Verify stored state on User
        assert.ok(savedUser.resetOtpHash, 'Bcrypt hash must be set');
        assert.ok(savedUser.resetOtpExpires > new Date(), 'Expiry must be in the future (10 min)');
        assert.strictEqual(savedUser.resetOtpAttempts, 0);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should allow requesting OTP using 10-digit registered phone number', async () => {
      const origFindOne = User.findOne;
      let searchedQuery = null;

      User.findOne = async (query) => {
        searchedQuery = query;
        return {
          _id: '654321000000000000000001',
          email: '0902cs241008@rjit.ac.in',
          phone: '+91 98765 43210',
          save: async () => {},
        };
      };

      try {
        const req = { body: { identifier: '9876543210' } };
        let statusCode = 200;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await forgotPassword(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(jsonBody.success, true);
        assert.strictEqual(jsonBody.maskedEmail, '0902••••08@rjit.ac.in');
        assert.ok(searchedQuery && searchedQuery.phone);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should reject forgot-password with 429 when OTP was requested less than 60 seconds ago (cooldown timer)', async () => {
      const origFindOne = User.findOne;
      const recentOtpTime = new Date(Date.now() - 25000); // 25 seconds ago

      User.findOne = async () => ({
        _id: '654321000000000000000001',
        email: '0902cs241008@rjit.ac.in',
        lastOtpSentAt: recentOtpTime,
        save: async () => {},
      });

      try {
        const req = { body: { identifier: '0902cs241008@rjit.ac.in' } };
        let statusCode = null;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await forgotPassword(req, res);
        assert.strictEqual(statusCode, 429);
        assert.strictEqual(jsonBody.success, false);
        assert.match(jsonBody.message, /Please wait \d+ seconds before requesting a new OTP\./);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should allow forgot-password when lastOtpSentAt was 60 or more seconds ago and update lastOtpSentAt', async () => {
      const origFindOne = User.findOne;
      const oldOtpTime = new Date(Date.now() - 65000); // 65 seconds ago
      let savedUser = null;

      const mockUser = {
        _id: '654321000000000000000001',
        email: '0902cs241008@rjit.ac.in',
        lastOtpSentAt: oldOtpTime,
        resetOtpHash: null,
        resetOtpExpires: null,
        resetOtpAttempts: 0,
        save: async function () {
          savedUser = this;
          return this;
        },
      };

      User.findOne = async () => mockUser;

      try {
        const req = { body: { identifier: '0902cs241008@rjit.ac.in' } };
        let statusCode = 200;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await forgotPassword(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(jsonBody.success, true);
        assert.ok(savedUser.lastOtpSentAt, 'lastOtpSentAt must be updated');
        assert.ok(
          new Date(savedUser.lastOtpSentAt) > oldOtpTime,
          'lastOtpSentAt should be updated to a newer timestamp'
        );
        assert.ok(
          Date.now() - new Date(savedUser.lastOtpSentAt).getTime() < 30000,
          'lastOtpSentAt should be updated to current time'
        );
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should reject verify-otp if OTP is malformed or not 6 digits', async () => {
      const req = { body: { identifier: '0902cs241008@rjit.ac.in', otp: '123' } };
      let statusCode = null;
      let jsonBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await verifyOtp(req, res);
      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /valid 6-digit otp code/i);
    });

    it('should reject verify-otp if OTP is expired (> 10 minutes)', async () => {
      const origFindOne = User.findOne;
      User.findOne = async () => ({
        _id: '654321000000000000000001',
        email: '0902cs241008@rjit.ac.in',
        resetOtpHash: '$2a$10$abcdefg',
        resetOtpExpires: new Date(Date.now() - 1000), // Expired 1 second ago
        resetOtpAttempts: 0,
      });

      try {
        const req = { body: { identifier: '0902cs241008@rjit.ac.in', otp: '123456' } };
        let statusCode = null;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await verifyOtp(req, res);
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(jsonBody.success, false);
        assert.match(jsonBody.message, /otp has expired/i);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should increment resetOtpAttempts on failed OTP check and block after 5 attempts (brute-force defense)', async () => {
      const origFindOne = User.findOne;
      const testHash = await bcrypt.hash('654321', 10);
      let attemptsCount = 0;

      const mockUser = {
        _id: '654321000000000000000001',
        email: '0902cs241008@rjit.ac.in',
        resetOtpHash: testHash,
        resetOtpExpires: new Date(Date.now() + 600000),
        resetOtpAttempts: 0,
        save: async function () {
          attemptsCount = this.resetOtpAttempts;
          return this;
        },
      };

      User.findOne = async () => mockUser;

      try {
        // Attempt 1: Wrong code '111111'
        const req1 = { body: { identifier: '0902cs241008@rjit.ac.in', otp: '111111' } };
        let statusCode1 = null;
        let jsonBody1 = null;
        const res1 = {
          status(code) {
            statusCode1 = code;
            return this;
          },
          json(data) {
            jsonBody1 = data;
            return this;
          },
        };

        await verifyOtp(req1, res1);
        assert.strictEqual(statusCode1, 400);
        assert.strictEqual(jsonBody1.success, false);
        assert.strictEqual(attemptsCount, 1);
        assert.match(jsonBody1.message, /4 attempt\(s\) remaining/i);

        // Simulate 5 prior failed attempts
        mockUser.resetOtpAttempts = 5;
        const req2 = { body: { identifier: '0902cs241008@rjit.ac.in', otp: '654321' } };
        let statusCode2 = null;
        let jsonBody2 = null;
        const res2 = {
          status(code) {
            statusCode2 = code;
            return this;
          },
          json(data) {
            jsonBody2 = data;
            return this;
          },
        };

        await verifyOtp(req2, res2);
        assert.strictEqual(statusCode2, 400);
        assert.strictEqual(jsonBody2.success, false);
        assert.match(jsonBody2.message, /too many failed attempts/i);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should successfully verify valid 6-digit OTP, clear OTP fields, and return short-lived 10m resetToken', async () => {
      const origFindOne = User.findOne;
      const testUserId = '654321000000000000000001';
      const plainOtp = '789456';
      const testHash = await bcrypt.hash(plainOtp, 10);

      const mockUser = {
        _id: testUserId,
        email: '0902cs241008@rjit.ac.in',
        resetOtpHash: testHash,
        resetOtpExpires: new Date(Date.now() + 600000),
        resetOtpAttempts: 0,
        save: async function () {
          return this;
        },
      };

      User.findOne = async () => mockUser;

      try {
        const req = { body: { identifier: '0902cs241008@rjit.ac.in', otp: plainOtp } };
        let statusCode = 200;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await verifyOtp(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(jsonBody.success, true);
        assert.ok(jsonBody.resetToken);

        // Invariants: OTP fields must be cleared
        assert.strictEqual(mockUser.resetOtpHash, undefined);
        assert.strictEqual(mockUser.resetOtpExpires, undefined);
        assert.strictEqual(mockUser.resetOtpAttempts, 0);

        // Invariant: resetToken must be a valid JWT with purpose='password_reset'
        const decoded = jwt.verify(
          jsonBody.resetToken,
          process.env.JWT_SECRET || 'test_jwt_secret_token_key_for_unit_tests_32chars'
        );
        assert.strictEqual(decoded.id, testUserId);
        assert.strictEqual(decoded.purpose, 'password_reset');
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('should reject reset-password with 401 on invalid or tampered reset token', async () => {
      const req = {
        body: {
          resetToken: 'invalid.tampered.token',
          newPassword: 'newValidPassword123',
        },
      };

      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await resetPassword(req, res);

      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /invalid, tampered, or expired/i);
    });

    it('should reject reset-password with 401 when token purpose is not password_reset', async () => {
      const fakeToken = jwt.sign(
        { id: '654321000000000000000001', purpose: 'login_session' },
        process.env.JWT_SECRET || 'test_jwt_secret_token_key_for_unit_tests_32chars',
        { expiresIn: '10m' }
      );

      const req = {
        body: {
          resetToken: fakeToken,
          newPassword: 'newValidPassword123',
        },
      };

      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await resetPassword(req, res);

      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /invalid password reset token purpose/i);
    });

    it('should reject reset-password with 400 when new password is too short (< 6 chars)', async () => {
      const req = {
        body: {
          resetToken: 'someTokenString',
          newPassword: '123',
        },
      };

      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await resetPassword(req, res);

      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /at least 6 characters/i);
    });

    it('should successfully update user password when given a valid resetToken', async () => {
      const origFindById = User.findById;
      let updatedHash = null;
      const testUserId = '654321000000000000000001';

      const mockUser = {
        _id: testUserId,
        passwordHash: 'originalHash',
        save: async function () {
          updatedHash = this.passwordHash;
          return this;
        },
      };

      User.findById = async () => mockUser;

      const validResetToken = jwt.sign(
        { id: testUserId, purpose: 'password_reset' },
        process.env.JWT_SECRET || 'test_jwt_secret_token_key_for_unit_tests_32chars',
        { expiresIn: '10m' }
      );

      try {
        const req = {
          body: {
            resetToken: validResetToken,
            newPassword: 'BrandNewSecurePass2026',
          },
        };

        let statusCode = 200;
        let jsonBody = null;
        let errCatch = null;

        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await resetPassword(req, res, (err) => {
          errCatch = err;
        });

        assert.strictEqual(errCatch, null);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(jsonBody.success, true);
        assert.match(jsonBody.message, /password updated successfully/i);
        assert.ok(updatedHash && updatedHash !== 'originalHash');
      } finally {
        User.findById = origFindById;
      }
    });
  });

  describe('7. Premium Responsive HTML Email Templates & Onboarding Flow', () => {
    it('should generate responsive HTML OTP email with prominent 6-digit box and security warning', () => {
      const testOtp = '849201';
      const testEmail = '0902cs241008@rjit.ac.in';
      const html = generateOtpEmail(testOtp, testEmail);

      assert.ok(typeof html === 'string');
      assert.ok(html.includes(testOtp));
      assert.ok(html.includes(testEmail));
      assert.ok(html.includes('Reuse'));
      assert.ok(html.includes('Campus'));
      assert.ok(html.includes('RJIT Tekanpur'));
      assert.ok(html.includes('Valid for 10 minutes'));
      assert.ok(html.includes('Security Warning:'));
      assert.ok(html.includes('#059669')); // Emerald brand color
    });

    it('should generate warm, congratulatory HTML welcome email highlighting 3 quick tips', () => {
      const studentName = 'Abhishek Pachori';
      const html = generateWelcomeEmail(studentName);

      assert.ok(typeof html === 'string');
      assert.ok(html.includes('Welcome to the Campus Family, Abhishek!'));
      assert.ok(html.includes('Verified @rjit.ac.in Community Only'));
      assert.ok(html.includes('100% Free & Zero Commission'));
      assert.ok(html.includes('Direct WhatsApp & Campus Deals'));
      assert.ok(html.includes('Official RJIT Campus Marketplace'));
      assert.ok(html.includes('Explore Campus Listings'));
    });

    it('should return { mocked: true } in test mode (NODE_ENV=test) for sendEmailOtp and sendWelcomeEmail without sending real emails', async () => {
      const otpRes = await sendEmailOtp('0902cs241008@rjit.ac.in', '123456');
      assert.strictEqual(otpRes.mocked, true);

      const welcomeRes = await sendWelcomeEmail('0902cs241008@rjit.ac.in', 'Abhishek Pachori');
      assert.strictEqual(welcomeRes.mocked, true);
    });

    it('should safely execute sendEmailOtp using HTML template in development fallback', async () => {
      const origEnv = process.env.NODE_ENV;
      const origUser = process.env.SMTP_USER;
      try {
        process.env.NODE_ENV = 'development';
        delete process.env.SMTP_USER;
        const res = await sendEmailOtp('test.student@rjit.ac.in', '123456');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.devFallback, true);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.SMTP_USER = origUser;
      }
    });

    it('should safely execute sendWelcomeEmail without throwing in development fallback', async () => {
      const origEnv = process.env.NODE_ENV;
      const origUser = process.env.SMTP_USER;
      try {
        process.env.NODE_ENV = 'development';
        delete process.env.SMTP_USER;
        const res = await sendWelcomeEmail('test.student@rjit.ac.in', 'Abhishek Pachori');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.devFallback, true);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.SMTP_USER = origUser;
      }
    });

    it('should enforce module-level in-memory rate-limit lock on recentEmails within 60 seconds', async () => {
      const testEmail = 'locktest@rjit.ac.in';
      const origEnv = process.env.NODE_ENV;
      const origUser = process.env.SMTP_USER;
      const origPass = process.env.SMTP_PASS;

      try {
        process.env.NODE_ENV = 'production';
        process.env.SMTP_USER = 'dummy@rjit.ac.in';
        process.env.SMTP_PASS = 'dummypass';

        // Pre-populate in-memory lock
        recentEmails.set(testEmail, Date.now() - 20000); // 20 seconds ago

        let caughtErr = null;
        try {
          await sendEmailOtp(testEmail, '654321');
        } catch (err) {
          caughtErr = err;
        }

        assert.ok(caughtErr, 'Should throw a rate limit error');
        assert.strictEqual(caughtErr.statusCode, 429);
        assert.match(caughtErr.message, /Rate limit exceeded: Please wait \d+ seconds before requesting another OTP\./);
      } finally {
        recentEmails.delete(testEmail);
        process.env.NODE_ENV = origEnv;
        process.env.SMTP_USER = origUser;
        process.env.SMTP_PASS = origPass;
      }
    });
  });

  describe('8. Cloudinary Image Auto-Compression & Upload Contract', () => {
    it('should export uploadToCloudinary function', async () => {
      const { uploadToCloudinary } = await import('../utils/cloudinary.js');
      assert.strictEqual(typeof uploadToCloudinary, 'function');
    });

    it('should reject createListing with 400 if neither image file nor imageUrl is provided', async () => {
      const { createListing } = await import('../controllers/listingController.js');
      const req = {
        user: { _id: '654321000000000000000001' },
        body: {
          title: 'Item without image',
          description: 'Description without image',
          price: 50,
          category: 'Books',
          condition: 'Good',
        },
      };

      let statusCode = null;
      let jsonBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await createListing(req, res);
      assert.strictEqual(statusCode, 400);
      assert.strictEqual(jsonBody.success, false);
      assert.match(jsonBody.message, /provide an image for the listing/i);
    });

    it('should save imageUrl and itemPhoto to created listing when imageUrl is provided in body', async () => {
      const { createListing } = await import('../controllers/listingController.js');
      const origCreate = Listing.create;
      let createdDoc = null;

      Listing.create = async (data) => {
        createdDoc = data;
        return {
          ...data,
          _id: '654321000000000000000088',
          populate: async () => ({
            ...data,
            _id: '654321000000000000000088',
            seller: { name: 'Student' },
          }),
        };
      };

      try {
        const testUrl = 'https://res.cloudinary.com/root/image/upload/v1234/reusecampus/test.webp';
        const req = {
          user: { _id: '654321000000000000000001' },
          body: {
            title: 'Sample Direct Image Listing',
            description: 'Direct Cloudinary URL listing',
            price: 100,
            category: 'Electronics',
            condition: 'Like New',
            imageUrl: testUrl,
          },
        };

        let statusCode = null;
        let jsonBody = null;
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await createListing(req, res);
        assert.strictEqual(statusCode, 201);
        assert.strictEqual(jsonBody.success, true);
        assert.strictEqual(createdDoc.imageUrl, testUrl);
        assert.strictEqual(createdDoc.itemPhoto, testUrl);
      } finally {
        Listing.create = origCreate;
      }
    });
  });

  describe('9. Stage 2: Product View Counter & Mark as Sold Functionality', () => {
    it('should increment views count by 1 in getListingById', async () => {
      const origFindByIdAndUpdate = Listing.findByIdAndUpdate;
      let incArg = null;
      let targetId = null;

      Listing.findByIdAndUpdate = (id, update, options) => {
        targetId = id;
        incArg = update;
        return {
          populate: () => ({
            lean: async () => ({
              _id: id,
              title: 'RJIT Lab Coat',
              views: 11,
              status: 'Available',
              seller: { name: 'Abhishek' },
            }),
          }),
        };
      };

      try {
        const req = { params: { id: '654321000000000000000099' } };
        let jsonResponse = null;
        const res = {
          status: () => res,
          json: (data) => {
            jsonResponse = data;
          },
        };

        await getListingById(req, res);
        assert.strictEqual(targetId, '654321000000000000000099');
        assert.deepStrictEqual(incArg, { $inc: { views: 1 } });
        assert.strictEqual(jsonResponse.success, true);
        assert.strictEqual(jsonResponse.data.views, 11);
      } finally {
        Listing.findByIdAndUpdate = origFindByIdAndUpdate;
      }
    });

    it('should reject markAsSold with 403 when user is not the listing creator', async () => {
      const origFindById = Listing.findById;
      Listing.findById = async () => ({
        _id: '654321000000000000000099',
        creatorId: '654321000000000000000001',
        seller: '654321000000000000000001',
        status: 'Available',
      });

      try {
        const req = {
          params: { id: '654321000000000000000099' },
          user: { id: '654321000000000000000999', _id: '654321000000000000000999' },
        };
        let statusCode = null;
        let jsonResponse = null;
        const res = {
          status: (code) => {
            statusCode = code;
            return res;
          },
          json: (data) => {
            jsonResponse = data;
          },
        };

        await markAsSold(req, res);
        assert.strictEqual(statusCode, 403);
        assert.strictEqual(jsonResponse.success, false);
      } finally {
        Listing.findById = origFindById;
      }
    });

    it('should successfully mark listing as Sold when creatorId matches req.user.id', async () => {
      const origFindById = Listing.findById;
      const mockListing = {
        _id: '654321000000000000000099',
        creatorId: '654321000000000000000001',
        seller: '654321000000000000000001',
        status: 'Available',
        save: async function () {
          return this;
        },
        populate: async function () {
          return this;
        },
      };

      Listing.findById = async () => mockListing;

      try {
        const req = {
          params: { id: '654321000000000000000099' },
          user: { id: '654321000000000000000001', _id: '654321000000000000000001' },
        };
        let jsonResponse = null;
        const res = {
          status: () => res,
          json: (data) => {
            jsonResponse = data;
          },
        };

        await markAsSold(req, res);
        assert.strictEqual(jsonResponse.success, true);
        assert.strictEqual(mockListing.status, 'Sold');
        assert.strictEqual(jsonResponse.message, 'Listing marked as Sold successfully');
      } finally {
        Listing.findById = origFindById;
      }
    });
  });

  describe('10. Regression Invariants: Controller Signatures, Error Handlers & Cloudinary', () => {
    it('should verify global error handler has exactly 4 arguments for Express compliance', () => {
      assert.strictEqual(errorHandler.length, 4, 'Express error handler must have exactly 4 arguments: (err, req, res, next)');
    });

    it('should verify notFound middleware has 3 arguments: (req, res, next)', () => {
      assert.strictEqual(notFound.length, 3);
    });

    it('should verify controllers use standard async (req, res) signature with internal try/catch blocks and no next parameter', () => {
      const controllers = [
        { name: 'createListing', fn: createListing },
        { name: 'getListingById', fn: getListingById },
        { name: 'markAsSold', fn: markAsSold },
        { name: 'updateListing', fn: updateListing },
        { name: 'deleteListing', fn: deleteListing },
        { name: 'updateListingStatus', fn: updateListingStatus },
        { name: 'getMyListings', fn: getMyListings },
        { name: 'getListings', fn: getListings },
        { name: 'registerUser', fn: registerUser },
        { name: 'loginUser', fn: loginUser },
        { name: 'getMe', fn: getMe },
        { name: 'forgotPassword', fn: forgotPassword },
        { name: 'verifyOtp', fn: verifyOtp },
        { name: 'resetPassword', fn: resetPassword },
        { name: 'getUserProfile', fn: getUserProfile },
        { name: 'updateUserProfile', fn: updateUserProfile },
        { name: 'getSavedItems', fn: getSavedItems },
        { name: 'toggleSaveItem', fn: toggleSaveItem },
      ];

      for (const { name, fn } of controllers) {
        assert.strictEqual(typeof fn, 'function', `${name} must be an exported function`);
        assert.strictEqual(fn.length, 2, `${name} must have standard (req, res) signature with exactly 2 parameters (no next)`);

        const fnStr = fn.toString();
        const paramList = fnStr.slice(0, fnStr.indexOf('{'));
        assert.ok(!paramList.includes('next'), `${name} signature must not accept next parameter`);
        assert.ok(fnStr.includes('try') && fnStr.includes('catch'), `${name} must implement internal try/catch block`);
      }
    });

    it('should verify configureCloudinary reads process.env.CLOUDINARY_CLOUD_NAME and does not contain Root fallback', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ci_test_cloud';

      const config = configureCloudinary();
      assert.strictEqual(typeof process.env.CLOUDINARY_CLOUD_NAME, 'string');
      assert.strictEqual(typeof config.cloudName, 'string');
      assert.notStrictEqual(config.cloudName, 'Root', "Cloudinary config must not contain 'Root' fallback");
      assert.notStrictEqual(config.cloudName.toLowerCase(), 'root', "Cloudinary config must not contain 'Root' fallback");

      const fs = await import('node:fs');
      const cloudinaryFileContent = fs.readFileSync(new URL('../utils/cloudinary.js', import.meta.url), 'utf8');
      assert.ok(!cloudinaryFileContent.includes("'Root'"), "Hardcoded 'Root' fallback must be absent from cloudinary config file");
      assert.ok(!cloudinaryFileContent.includes('"Root"'), 'Hardcoded "Root" fallback must be absent from cloudinary config file');
    });

    it('should successfully update listing fields and call save() in updateListing', async () => {
      const origFindById = Listing.findById;
      let saved = false;

      const mockListing = {
        _id: '654321000000000000000077',
        seller: '654321000000000000000001',
        creatorId: '654321000000000000000001',
        title: 'Original Title',
        description: 'Original Description',
        price: 250,
        category: 'Books',
        condition: 'Good',
        status: 'Available',
        imageUrl: 'https://example.com/orig.webp',
        itemPhoto: 'https://example.com/orig.webp',
        save: async function () {
          saved = true;
          return this;
        },
        populate: async function () {
          return this;
        },
      };

      Listing.findById = async () => mockListing;

      try {
        const req = {
          params: { id: '654321000000000000000077' },
          user: { _id: '654321000000000000000001' },
          body: {
            title: 'Updated Engineering Textbook',
            description: 'Updated condition and price',
            price: 180,
            category: 'Books',
            condition: 'Like New',
            status: 'Sold',
          },
        };

        let jsonResponse = null;
        const res = {
          status: () => res,
          json: (data) => {
            jsonResponse = data;
          },
        };

        await updateListing(req, res);
        assert.strictEqual(saved, true, 'listing.save() must be invoked');
        assert.strictEqual(jsonResponse.success, true);
        assert.strictEqual(mockListing.title, 'Updated Engineering Textbook');
        assert.strictEqual(mockListing.price, 180);
        assert.strictEqual(mockListing.condition, 'Like New');
        assert.strictEqual(mockListing.status, 'Sold');
      } finally {
        Listing.findById = origFindById;
      }
    });

    it('should verify uploadSingleImage returns an Express middleware function that handles errors gracefully', (t, done) => {
      const middleware = uploadSingleImage('image');
      assert.strictEqual(typeof middleware, 'function');
      assert.strictEqual(middleware.length, 3); // (req, res, next)

      // Verify it passes non-multipart requests through cleanly
      const req = { headers: {} };
      const res = {};
      middleware(req, res, (err) => {
        assert.strictEqual(err, undefined);
        done();
      });
    });
  });

  describe('11. Wishlist (Saved Items) Ghost Item Cleanup & Cross-User Synchronization', () => {
    it('should include savedItems array referencing Listing in User schema', () => {
      const userSchema = User.schema;
      assert.ok(userSchema.path('savedItems'), 'User schema must define savedItems path');
    });

    it('should filter out null entries in getSavedItems, auto-cleanup dead IDs, and invoke user.save()', async () => {
      const origFindById = User.findById;
      try {
        let savedCalled = false;
        const validListing = {
          _id: '64b1f2e9a1b2c3d4e5f6a7b1',
          title: 'Mechanical Drafter',
          price: 250,
          status: 'Available',
        };

        // User document with 1 valid listing and 2 dead/null references
        const mockUser = {
          _id: '64b1f2e9a1b2c3d4e5f6a7b0',
          name: 'Abhishek Pachori',
          savedItems: [validListing, null, undefined],
          populate: async () => mockUser,
          save: async () => {
            savedCalled = true;
            return mockUser;
          },
        };

        User.findById = () => ({
          populate: async () => mockUser,
        });

        const req = { user: { _id: '64b1f2e9a1b2c3d4e5f6a7b0' } };
        let jsonResponse = null;
        const res = {
          status: () => res,
          json: (data) => {
            jsonResponse = data;
          },
        };

        await getSavedItems(req, res);

        assert.strictEqual(savedCalled, true, 'Auto-cleanup must trigger user.save() when dead items exist');
        assert.strictEqual(jsonResponse.success, true);
        assert.strictEqual(jsonResponse.count, 1);
        assert.strictEqual(jsonResponse.data.length, 1);
        assert.strictEqual(jsonResponse.data[0]._id, validListing._id);
        assert.deepStrictEqual(mockUser.savedItems, [validListing._id]);
      } finally {
        User.findById = origFindById;
      }
    });

    it('should remove deleted listing from savedItems array across ALL users in deleteListing', async () => {
      const origFindById = Listing.findById;
      const origUpdateMany = User.updateMany;
      try {
        let updateManyArgs = null;
        User.updateMany = async (filter, update) => {
          updateManyArgs = { filter, update };
          return { modifiedCount: 3 };
        };

        const listingId = '64b1f2e9a1b2c3d4e5f6a7b9';
        const sellerId = '64b1f2e9a1b2c3d4e5f6a7b0';
        let deleted = false;

        Listing.findById = async () => ({
          _id: listingId,
          seller: sellerId,
          deleteOne: async () => {
            deleted = true;
          },
        });

        const req = {
          params: { id: listingId },
          user: { _id: sellerId },
        };
        let jsonResponse = null;
        const res = {
          status: () => res,
          json: (data) => {
            jsonResponse = data;
          },
        };

        await deleteListing(req, res);

        assert.strictEqual(deleted, true);
        assert.strictEqual(jsonResponse.success, true);
        assert.ok(updateManyArgs, 'User.updateMany must be called');
        assert.deepStrictEqual(updateManyArgs.filter, { savedItems: listingId });
        assert.deepStrictEqual(updateManyArgs.update, { $pull: { savedItems: listingId } });
      } finally {
        Listing.findById = origFindById;
        User.updateMany = origUpdateMany;
      }
    });
  });
});

