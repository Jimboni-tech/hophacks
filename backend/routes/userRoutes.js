const express = require('express');

const router = express.Router();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const User = require('../models/User');
const Project = require('../models/Project');
const bcrypt = require('bcryptjs');

// POST /api/user/profile/skills - update authenticated user's skills
router.post('/user/profile/skills', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.skills = skills;
    await user.save();
    res.json({ message: 'Skills updated', skills: user.skills });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// POST /api/user/profile/resume - upload resume as base64 string
router.post('/user/profile/resume', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { filename, contentType, base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'No resume data' });
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const buffer = Buffer.from(base64, 'base64');
    user.resume = { data: buffer, contentType: contentType || 'application/pdf' };
    await user.save();
    res.json({ message: 'Resume uploaded', filename });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// GET /api/user/profile/resume - download authenticated user's resume
router.get('/user/profile/resume', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.resume || !user.resume.data) return res.status(404).json({ error: 'No resume uploaded' });
    res.setHeader('Content-Type', user.resume.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(user.resume.data);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// POST /api/user/change-password - change authenticated user's password
router.post('/user/change-password', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(currentPassword || '', user.password);
    if (!match) return res.status(401).json({ error: 'Current password incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// Protected route: get currently authenticated user's profile
router.get('/user/profile', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select('-password -__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// POST /api/user/interested/:projectId - add project to authenticated user's interestedProjects
router.post('/user/interested/:projectId', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.params.projectId;
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // add only if not already present
    if (!user.interestedProjects.some((p) => String(p) === String(projectId))) {
      user.interestedProjects.push(projectId);
      await user.save();
    }
    // also add user reference to Project.interestedUsers
    try {
      await Project.findByIdAndUpdate(projectId, { $addToSet: { interestedUsers: user._id } });
    } catch (e) {
      // ignore failure to update project side
      // eslint-disable-next-line no-console
      console.debug('Failed to update project.interestedUsers', e?.message || e);
    }

    res.json({ message: 'Project marked as interested', interestedProjects: user.interestedProjects });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// POST /api/user/apply/:projectId - mark user as applied for the project
router.post('/user/apply/:projectId', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.params.projectId;
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // add to user's appliedProjects
    if (!user.appliedProjects.some((p) => String(p) === String(projectId))) {
      user.appliedProjects.push(projectId);
      await user.save();
    }
    // add user to Project.appliedUsers
    try {
      await Project.findByIdAndUpdate(projectId, { $addToSet: { appliedUsers: user._id } });
    } catch (e) {
      // ignore project update failure
      // eslint-disable-next-line no-console
      console.debug('Failed to update project.appliedUsers', e?.message || e);
    }
    res.json({ message: 'Applied to project', appliedProjects: user.appliedProjects });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// Example route: Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by userId
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
