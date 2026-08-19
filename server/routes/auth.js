const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Generate verification token (store SHA-256 hash in DB, send raw token to user)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = hashToken(rawVerificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

    // Send verification email with raw token
    try {
      await sendVerificationEmail(user.email, user.name, rawVerificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      // Don't fail registration if email fails — user can request resend
    }

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
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
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
});

// ─── GET /api/auth/verify-email/:token ──────────────────────
router.get('/verify-email/:token', async (req, res) => {
  try {
    const rawToken = req.params.token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    const hashedToken = hashToken(rawToken);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification link.',
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
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
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = hashToken(rawVerificationToken);
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, rawVerificationToken);
    } catch (emailErr) {
      console.error('Failed to resend verification email:', emailErr.message);
    }

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
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, rawResetToken);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr.message);
    }

    res.json({ message: successMsg });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/auth/reset-password/:token ───────────────────
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const rawToken = req.params.token;

    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = hashToken(rawToken);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordTokenExpiry');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired password reset link.',
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
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
