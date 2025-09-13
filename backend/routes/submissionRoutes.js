const express = require('express');
const crypto = require('crypto');
const Submission = require('../models/Submission');
const Project = require('../models/Project');

const router = express.Router();

// POST /api/projects/:projectId/submissions
// Body: { userId, submissionUrl, notes }
router.post('/projects/:projectId/submissions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, submissionUrl, notes } = req.body || {};
    if (!userId || !submissionUrl) {
      return res.status(400).json({ error: 'userId and submissionUrl are required' });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const hash = crypto.createHash('sha256').update(`${projectId}|${userId}|${submissionUrl}`).digest('hex');
    // Check for duplicate pending/approved submissions by same user and URL
    const dup = await Submission.findOne({ project: project._id, userId, hash, status: { $in: ['pending', 'approved'] } });
    if (dup) return res.status(409).json({ error: 'Duplicate submission detected' });

    const created = await Submission.create({ project: project._id, userId, submissionUrl, notes, hash });
    res.status(201).json(created);
  } catch (err) {
    console.error('Failed to create submission', err);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// GET /api/submissions?projectId=&status=pending|approved|rejected&page=&limit=
router.get('/submissions', async (req, res) => {
  try {
    const { projectId, status, page = '1', limit = '10' } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const total = await Submission.countDocuments(filter);
    const data = await Submission.find(filter)
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();
    res.json({ data, page: pageNum, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
  } catch (err) {
    console.error('Failed to fetch submissions', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PATCH /api/submissions/:id { action: 'approve' | 'reject', reviewer, rejectReason }
router.patch('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewer, rejectReason } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const update = { status, reviewedAt: new Date(), reviewer: reviewer || 'system' };
    if (status === 'rejected') update.rejectReason = rejectReason || 'Not specified';

    const updated = await Submission.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Submission not found' });
    res.json(updated);
  } catch (err) {
    console.error('Failed to review submission', err);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

// GET /api/leaderboard?limit=10
// Returns top userIds by approved submissions count
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const top = await Submission.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$userId', approvedCount: { $sum: 1 } } },
      { $sort: { approvedCount: -1 } },
      { $limit: Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100) },
    ]);
    res.json(top.map(row => ({ userId: row._id, approvedCount: row.approvedCount })));
  } catch (err) {
    console.error('Failed to fetch leaderboard', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
