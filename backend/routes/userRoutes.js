const express = require('express');

const router = express.Router();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const User = require('../models/User');
const Project = require('../models/Project');

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
