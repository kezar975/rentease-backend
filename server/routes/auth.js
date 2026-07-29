const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../utils/brevoEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], validate, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, phone, role: role || 'user' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
  console.error('Register Error Details:', err); 
  res.status(500).json({ 
    message: 'Server error', 
    error: err.message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
}
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    await sendResetPasswordEmail(user.email, user.name, resetLink);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! Redirecting to login...' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});
module.exports = router;