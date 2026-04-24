import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateActivationToken, generateActivationLink, sendActivationLink } from '../utils/user.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role !== 'partner') {
      return res.status(403).json({ message: 'Access restricted to partners only' });
    }

    if (!user.isActiveByLink) {
      return res.status(403).json({ message: 'You should activate your account first. Please check your email for the activation link.' });
    }

    if(!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//conform activation link
router.get('/activate', async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ activationToken: token });
  if (!user) return res.status(404).json({ message: 'Invalid or expired activation link' });
  if (user.expirationTime < Date.now()) return res.status(400).json({ message: 'Activation link expired' });
  user.isActiveByLink = true;
  await user.save();
  return res.status(200).json({ message: 'Account activated successfully' });
});

//resend activation link
router.post('/resend-activation-link', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const activationToken = generateActivationToken();
    const activationLink = generateActivationLink(activationToken);
    await user.updateOne({ activationToken, expirationTime: Date.now() + 1000 * 60 * 60 * 24 }); // 24 hours
    
    // Send activation email
    await sendActivationLink(email, activationLink);
    
    return res.status(200).json({ message: 'Activation link sent successfully' });
  } catch (error) {
    console.error('Error resending activation link:', error);
    return res.status(500).json({ message: 'Failed to send activation link' });
  }
});

//set password
router.post('/set-password', async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({ activationToken: token });
  if (!user) return res.status(404).json({ message: 'Invalid or expired activation link' });
  if (user.expirationTime < Date.now()) return res.status(400).json({ message: 'Activation link expired' });
  if (user.password) return res.status(400).json({ message: 'Password already set' });
  user.password = password;
  user.activationToken = null;
  user.expirationTime = null;
  await user.save();
  return res.status(200).json({ message: 'Password set successfully' });
});

//reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    
    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired reset password link' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Reset password link has expired' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
