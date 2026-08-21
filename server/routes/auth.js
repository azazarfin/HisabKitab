const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const RecurringExpense = require('../models/RecurringExpense');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { sendVerificationEmail, sendPasswordResetEmail, sendBindOtpEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Multer config for avatar uploads ───────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

// ─── Helpers ────────────────────────────────────────────────
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

// ─── POST /api/auth/register ────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({ message: 'Valid name is required (max 100 characters).' });
    }
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email address is required.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'An account with this email already exists.',
        requiresBinding: true,
        provider: existingUser.provider
      });
    }

    // Generate verification token (store SHA-256 hash in DB, send raw token to user)
    const rawVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedVerificationToken = hashToken(rawVerificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      provider: 'local',
      isEmailVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry,
    });

    await user.save();

    // Send verification email in the background
    sendVerificationEmail(user.email, user.name, rawVerificationToken).catch(emailErr => {
      console.error('Failed to send verification email:', emailErr.message);
    });

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ─── POST /api/auth/request-bind ────────────────────────────
router.post('/request-bind', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return generic success to avoid email enumeration
      return res.json({ message: 'If an account exists, a verification code has been sent.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashToken(otp);

    user.bindOtp = hashedOtp;
    user.bindOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send OTP email in the background
    sendBindOtpEmail(user.email, user.name, otp).catch(emailErr => {
      console.error('Failed to send OTP email:', emailErr.message);
    });

    res.json({ message: 'A 6-digit verification code has been sent to your email.' });
  } catch (error) {
    console.error('Request bind error:', error);
    res.status(500).json({ message: 'Server error during request.' });
  }
});

// ─── POST /api/auth/verify-bind ─────────────────────────────
router.post('/verify-bind', authLimiter, async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, code, and new password are required.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedOtp = hashToken(otp);

    const user = await User.findOne({
      email: normalizedEmail,
      bindOtp: hashedOtp,
      bindOtpExpiry: { $gt: new Date() },
    }).select('+bindOtp +bindOtpExpiry +password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Update password, mark as verified, clear OTP
    user.password = password;
    user.isEmailVerified = true;
    user.bindOtp = undefined;
    user.bindOtpExpiry = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    
    // If it was google-only, now it's local as well (we can just leave provider as google or set to local. Actually let's just ensure it has local capability)
    // If we want to mark it 'local' to ensure they can login with password, we can do that, but since it has a password now, login will work regardless if we just check for password.
    // Wait, in login: if (user.provider === 'google' && !user.password) it blocks. Now they have a password, so it won't block.
    if (user.provider === 'google') {
      user.provider = 'local';
    }

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Account bound successfully. You are now logged in.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Verify bind error:', error);
    res.status(500).json({ message: 'Server error during binding.' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if user signed up with Google
    if (user.provider === 'google' && !user.password) {
      return res.status(401).json({
        message: 'This account uses Google Sign-In. Please log in with Google.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ─── POST /api/auth/google ──────────────────────────────────
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google authentication is not configured on the server.' });
    }

    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!payload.email_verified) {
      return res.status(401).json({ message: 'Google email is not verified.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      // If existing local user logs in with Google, link accounts
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.isEmailVerified = true;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name: name || 'Google User',
        email: normalizedEmail,
        provider: 'google',
        googleId,
        avatar: picture || '',
        isEmailVerified: true,
      });
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
});

// ─── POST /api/auth/verify-email ────────────────────────────
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedToken = hashToken(otp);

    const user = await User.findOne({
      email: normalizedEmail,
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification code.',
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Generate tokens to log the user in immediately
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Email verified successfully! You are now logged in.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
});

// ─── POST /api/auth/resend-verification ─────────────────────
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration
    const genericSuccess = {
      message: 'If your email is registered and unverified, a verification link has been sent.',
    };

    if (!user || user.isEmailVerified) {
      return res.json(genericSuccess);
    }

    // Generate new token (hash before saving)
    const rawVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = hashToken(rawVerificationToken);
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send verification email in the background
    sendVerificationEmail(user.email, user.name, rawVerificationToken).catch(emailErr => {
      console.error('Failed to resend verification email:', emailErr.message);
    });

    res.json(genericSuccess);
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Always return same response to prevent email enumeration
    const successMsg = 'If an account with that email exists, a password reset link has been sent.';

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || (!user.password && user.provider === 'google')) {
      return res.json({ message: successMsg });
    }

    // Generate reset token (store SHA-256 hash in DB, send raw token)
    const rawResetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send password reset email in the background
    sendPasswordResetEmail(user.email, user.name, rawResetToken).catch(emailErr => {
      console.error('Failed to send password reset email:', emailErr.message);
    });

    res.json({ message: successMsg });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/auth/reset-password ──────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Email and reset code are required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedToken = hashToken(otp);

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordTokenExpiry');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired password reset code.',
      });
    }

    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

// ─── POST /api/auth/refresh ─────────────────────────────────
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.tokenVersion !== (decoded.tokenVersion || 0)) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ message: 'Invalid or revoked refresh token.' });
    }

    // Issue new tokens (token rotation)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    // Clear the invalid cookie
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully.' });
});

// ─── GET /api/auth/me ───────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      googleId: !!user.googleId,
      hasCompletedTour: user.hasCompletedTour || false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/auth/tour-completed ────────────────────────
router.patch('/tour-completed', authMiddleware, async (req, res) => {
  try {
    const { completed = true } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { hasCompletedTour: !!completed },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Tour status updated.',
      hasCompletedTour: user.hasCompletedTour,
    });
  } catch (error) {
    console.error('Tour completed update error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/auth/profile ────────────────────────────────
router.patch('/profile', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { name, removeAvatar } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
        return res.status(400).json({ message: 'Valid name is required (max 100 characters).' });
      }
      updates.name = name.trim();
    }

    // If a file was uploaded, use its path as avatar
    if (req.file) {
      // Delete old avatar file if it was a local upload
      const user = await User.findById(req.user.id);
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '..', user.avatar);
        fs.unlink(oldPath, () => {}); // best-effort cleanup
      }
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    } else if (removeAvatar === 'true' || removeAvatar === true) {
      // Remove avatar
      const user = await User.findById(req.user.id);
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '..', user.avatar);
        fs.unlink(oldPath, () => {});
      }
      updates.avatar = '';
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Profile updated.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.message && error.message.includes('Only')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});

// ─── PATCH /api/auth/change-password ────────────────────────
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If user has a password (local or linked), verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    // If Google-only user sets a password, also mark as local provider
    if (user.provider === 'google' && !user.password) {
      user.provider = 'local';
    }
    await user.save();

    // Issue new tokens so user stays logged in
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Password changed successfully.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change.' });
  }
});

// ─── POST /api/auth/link-google ─────────────────────────────
router.post('/link-google', authMiddleware, async (req, res) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google authentication is not configured.' });
    }
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, picture } = payload;

    // Check if this Google account is already linked to another user
    const existingGoogle = await User.findOne({ googleId });
    if (existingGoogle && existingGoogle._id.toString() !== req.user.id) {
      return res.status(409).json({ message: 'This Google account is already linked to another user.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.googleId = googleId;
    if (picture && !user.avatar) {
      user.avatar = picture;
    }
    await user.save();

    res.json({
      message: 'Google account linked successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: !!user.googleId,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Link Google error:', error);
    res.status(500).json({ message: 'Failed to link Google account.' });
  }
});

// ─── POST /api/auth/unlink-google ───────────────────────────
router.post('/unlink-google', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.googleId) {
      return res.status(400).json({ message: 'No Google account is linked.' });
    }

    // Must have a password to unlink Google (otherwise they can't log in)
    if (!user.password) {
      return res.status(400).json({
        message: 'You must set a password before unlinking Google. Use "Change Password" first.',
      });
    }

    user.googleId = undefined;
    if (user.provider === 'google') {
      user.provider = 'local';
    }
    await user.save();

    res.json({
      message: 'Google account unlinked successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        googleId: false,
        hasCompletedTour: user.hasCompletedTour || false,
      },
    });
  } catch (error) {
    console.error('Unlink Google error:', error);
    res.status(500).json({ message: 'Failed to unlink Google account.' });
  }
});

// ─── DELETE /api/auth/account ───────────────────────────────
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { confirmText } = req.body;

    if (confirmText !== 'I am sure to delete my account') {
      return res.status(400).json({
        message: 'Please type the confirmation text exactly: "I am sure to delete my account"',
      });
    }

    const userId = req.user.id;

    // Cascading delete of all user data
    const chapters = await Chapter.find({ userId });
    const chapterIds = chapters.map((c) => c._id);

    await Promise.all([
      Transaction.deleteMany({ chapterId: { $in: chapterIds } }),
      Chapter.deleteMany({ userId }),
      Category.deleteMany({ userId }),
      PaymentMethod.deleteMany({ userId }),
      RecurringExpense.deleteMany({ userId }),
    ]);

    // Delete avatar file if local
    const user = await User.findById(userId);
    if (user && user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      fs.unlink(avatarPath, () => {});
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error during account deletion.' });
  }
});

module.exports = router;
