const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Submission = require('../models/Submission');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// GET /api/stats/contributions - return daily counts of approved submissions for the authenticated user
router.get('/stats/contributions', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Accept either explicit start/end (ISO YYYY-MM-DD) or days fallback
    const days = parseInt(req.query.days, 10) || 90;
    let since;
    let end = new Date();
    if (req.query.start) {
      // parse start (YYYY-MM-DD)
      since = new Date(req.query.start + 'T00:00:00.000Z');
    } else {
      since = new Date();
      since.setDate(since.getDate() - days + 1);
    }
    if (req.query.end) {
      end = new Date(req.query.end + 'T23:59:59.999Z');
    }

    // Aggregate approved submissions by date (based on createdAt)
    const pipeline = [
      { $match: { userId: userId, status: 'approved', createdAt: { $gte: since, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Submission.aggregate(pipeline).allowDiskUse(true);

    // convert to map of ISO date -> count
    const counts = {};
    results.forEach((r) => {
      const { year, month, day } = r._id;
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`;
      counts[iso] = r.count;
    });

  res.json({ since: since.toISOString(), end: end.toISOString(), days, counts });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

// GET /api/stats/completions - return daily counts of completion requests or verified completions
// query param: type=requested|verified (default=requested)
router.get('/stats/completions', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const type = (req.query.type || 'requested');
    const days = parseInt(req.query.days, 10) || 90;
    let since;
    let end = new Date();
    if (req.query.start) {
      since = new Date(req.query.start + 'T00:00:00.000Z');
    } else {
      since = new Date();
      since.setDate(since.getDate() - days + 1);
    }
    if (req.query.end) {
      end = new Date(req.query.end + 'T23:59:59.999Z');
    }

    // choose the field to aggregate by
    const dateField = type === 'verified' ? '$completionVerifiedAt' : '$completionRequestedAt';

    const pipeline = [
      { $match: { userId: userId, [type === 'verified' ? 'completionVerified' : 'completionRequested']: true, [type === 'verified' ? 'completionVerifiedAt' : 'completionRequestedAt']: { $gte: since, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: dateField },
            month: { $month: dateField },
            day: { $dayOfMonth: dateField }
          },
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Submission.aggregate(pipeline).allowDiskUse(true);
    const counts = {};
    results.forEach((r) => {
      const { year, month, day } = r._id;
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`;
      counts[iso] = r.count;
    });

    res.json({ since: since.toISOString(), end: end.toISOString(), days, type, counts });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

module.exports = router;
