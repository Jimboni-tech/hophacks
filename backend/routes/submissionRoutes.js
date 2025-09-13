const express = require('express');
const crypto = require('crypto');
const Submission = require('../models/Submission');
const Project = require('../models/Project');

const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const { sendMail } = require('../lib/email');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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

// GET /api/submissions/:id - returns a specific submission with project info
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id)
      .populate({ path: 'project', select: 'name summary description estimatedMinutes volunteerHours imageUrl company' })
      .lean();
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    console.error('Failed to fetch submission', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to fetch submission' });
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

// POST /api/submissions/:id/complete-request - user requests completion verification
router.post('/submissions/:id/complete-request', async (req, res) => {
  try {
    const { id } = req.params;
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization' });
    const token = auth.slice('Bearer '.length);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // only users (not companies) can request completion
    if (payload.company) return res.status(403).json({ error: 'Companies cannot request completion' });

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    // verify the submission belongs to this user
    if (submission.userId !== payload.userId) return res.status(403).json({ error: 'Not your submission' });

    submission.completionRequested = true;
    submission.completionRequestedAt = new Date();
    // generate a one-time confirmation token
    try {
      submission.confirmationToken = crypto.randomBytes(20).toString('hex');
      submission.confirmationTokenAt = new Date();
    } catch (e) {
      submission.confirmationToken = null;
      submission.confirmationTokenAt = null;
    }
    await submission.save();
    // notify the company that owns the project
    try {
      const project = await Project.findById(submission.project).populate('company', 'name email').lean();
      const user = await User.findOne({ userId: payload.userId }).select('fullName userId').lean();
      const userName = (user && user.fullName) || payload.userId;
      if (project && project.company && project.company.email) {
        const companyEmail = project.company.email;
        const subject = `Completion requested: ${project.name}`;
        const projectLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/projects/${String(project._id)}`;
        const submissionLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/submissions/${String(submission._id)}`;
  const confirmLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm/${String(submission._id)}?token=${submission.confirmationToken}`;
        const html = `
          <h2>Completion Requested</h2>
          <p>The user <strong>${userName}</strong> has requested verification that they completed the project <strong>${project.name}</strong>.</p>
          <h3>Project Summary</h3>
          <p><strong>${project.name}</strong></p>
          <p>${project.summary || project.description || 'No description provided.'}</p>
          <p>Project page: <a href="${projectLink}">${projectLink}</a></p>
          <h3>Submission</h3>
          <p>View submission: <a href="${submissionLink}">Submission details</a></p>
          <p><a href="${confirmLink}">Confirm completion</a> — clicking this will mark the submission as verified and move the project to the user's completed list.</p>
        `;
        // send email (best-effort)
        const sent = await sendMail({ to: companyEmail, subject, html });
        if (sent && sent.previewUrl) console.log('Preview email URL:', sent.previewUrl);
      }
    } catch (e) {
      console.error('Failed to notify company about completion request', e);
    }

    return res.json({ success: true, submission });
  } catch (err) {
    console.error('Failed to request completion', err);
    return res.status(500).json({ error: 'Failed to request completion' });
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

// GET /api/company/submissions - recent submissions for company-owned projects
router.get('/company/submissions', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization' });
    const token = auth.slice('Bearer '.length);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!payload.company || !payload.companyId) return res.status(403).json({ error: 'Only companies can access this endpoint' });

    const company = await Company.findOne({ companyId: payload.companyId });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // find submissions for projects owned by this company
    const projects = await Project.find({ company: company._id }).select('_id name').lean();
    const projectIds = projects.map(p => p._id);
    const submissions = await Submission.find({ project: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // fetch user full names for the submission userIds
    const userIds = [...new Set(submissions.map(s => s.userId))];
    const users = await User.find({ userId: { $in: userIds } }).select('userId fullName').lean();
    const userMap = Object.fromEntries(users.map(u => [u.userId, u.fullName]));
    const projectMap = Object.fromEntries(projects.map(p => [String(p._id), p.name]));

    const data = submissions.map(s => ({
      id: s._id,
      projectId: s.project,
      projectName: projectMap[String(s.project)] || 'Unknown project',
      userId: s.userId,
      userFullName: userMap[s.userId] || s.userId,
      createdAt: s.createdAt,
      status: s.status,
      submissionUrl: s.submissionUrl,
      notes: s.notes
    }));

    res.json({ data });
  } catch (err) {
    console.error('Failed to list company submissions', err);
    res.status(500).json({ error: 'Failed to list company submissions' });
  }
});

// GET /api/company/applicant/:userId - company can fetch applicant profile (name, email, skills, github)
router.get('/company/applicant/:userId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization' });
    const token = auth.slice('Bearer '.length);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!payload.company || !payload.companyId) return res.status(403).json({ error: 'Only companies can access this endpoint' });

    const { userId } = req.params;
  const user = await User.findOne({ userId }).select('userId fullName email skills github resume').lean();
  if (!user) return res.status(404).json({ error: 'Applicant not found' });
  // don't return the binary resume data here; provide a separate resume endpoint
  const { resume, ...rest } = user;
  const hasResume = !!(resume && (resume.data || resume.filename));
  return res.json({ data: { ...rest, hasResume } });
  } catch (err) {
    console.error('Failed to fetch applicant profile', err);
    return res.status(500).json({ error: 'Failed to fetch applicant profile' });
  }
});

// GET /api/company/applicant/:userId/resume - company can download applicant resume (if present)
router.get('/company/applicant/:userId/resume', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization' });
    const token = auth.slice('Bearer '.length);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!payload.company || !payload.companyId) return res.status(403).json({ error: 'Only companies can access this endpoint' });

    const { userId } = req.params;
    const user = await User.findOne({ userId }).select('resume').lean();
    if (!user || !user.resume || !user.resume.data) return res.status(404).json({ error: 'No resume available' });
    const filename = (user.resume.filename || 'resume.pdf').replace(/"/g, '');
    res.setHeader('Content-Type', user.resume.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    return res.send(user.resume.data);
  } catch (err) {
    console.error('Failed to fetch applicant resume', err);
    return res.status(500).json({ error: 'Failed to fetch applicant resume' });
  }
});

// PATCH /api/submissions/:id/verify - company confirms completion of a submission
router.patch('/submissions/:id/verify', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization' });
    const token = auth.slice('Bearer '.length);
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
    if (!payload.company || !payload.companyId) return res.status(403).json({ error: 'Only companies can verify completions' });

    const { id } = req.params;
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // ensure the company owns the project
    const project = await Project.findById(submission.project).populate('company').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const company = await Company.findOne({ companyId: payload.companyId });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (String(project.company?._id || project.company) !== String(company._id)) return res.status(403).json({ error: 'Not authorized for this project' });

    // mark submission verified
    submission.completionVerified = true;
    submission.completionVerifiedAt = new Date();
    submission.completionVerifier = payload.companyId || 'company';
    await submission.save();

    // update the user: add project to completedProjects and increment totals
    const user = await User.findOne({ userId: submission.userId });
    if (user) {
      // remove from currentProjects if present
      if (Array.isArray(user.currentProjects) && user.currentProjects.length) {
        user.currentProjects = user.currentProjects.filter(c => String(c.projectId || c._id || c) !== String(project._id));
      }
      const has = (user.completedProjects || []).some(p => String(p) === String(project._id));
      if (!has) {
        user.completedProjects = user.completedProjects || [];
        user.completedProjects.push(project._id);
        user.totalCompletedProjects = (user.totalCompletedProjects || 0) + 1;
        const minutes = project.estimatedMinutes ? Number(project.estimatedMinutes) : 0;
        const hours = minutes ? (minutes / 60) : (project.volunteerHours || 0);
        user.totalVolunteerHours = (user.totalVolunteerHours || 0) + (hours || 0);
      }
      await user.save();
    }

    return res.json({ success: true, submission });
  } catch (err) {
    console.error('Failed to verify submission completion', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Failed to verify submission completion' });
  }
});

// POST /api/submissions/:id/confirm - public one-time confirmation via token
router.post('/submissions/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Confirmation token required' });

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (!submission.confirmationToken || submission.confirmationToken !== token) return res.status(403).json({ error: 'Invalid confirmation token' });

    // optional: token expiry (e.g., 7 days)
    const expiryDays = 30;
    if (submission.confirmationTokenAt && ((Date.now() - new Date(submission.confirmationTokenAt).getTime()) > (expiryDays * 24 * 60 * 60 * 1000))) {
      return res.status(410).json({ error: 'Confirmation token expired' });
    }

    // perform verification (mark submission and update user)
    submission.completionVerified = true;
    submission.completionVerifiedAt = new Date();
    submission.completionVerifier = 'public-link';
    // consume the token
    submission.confirmationToken = null;
    submission.confirmationTokenAt = null;
    await submission.save();

    // update user record
    const project = await Project.findById(submission.project).lean();
    const user = await User.findOne({ userId: submission.userId });
    if (user && project) {
      // remove from currentProjects if present
      if (Array.isArray(user.currentProjects) && user.currentProjects.length) {
        user.currentProjects = user.currentProjects.filter(c => String(c.projectId || c._id || c) !== String(project._id));
      }
      const has = (user.completedProjects || []).some(p => String(p) === String(project._id));
      if (!has) {
        user.completedProjects = user.completedProjects || [];
        user.completedProjects.push(project._id);
        user.totalCompletedProjects = (user.totalCompletedProjects || 0) + 1;
        const minutes = project.estimatedMinutes ? Number(project.estimatedMinutes) : 0;
        const hours = minutes ? (minutes / 60) : (project.volunteerHours || 0);
        user.totalVolunteerHours = (user.totalVolunteerHours || 0) + (hours || 0);
      }
      await user.save();
    }

    return res.json({ success: true, submission });
  } catch (err) {
    console.error('Failed to confirm submission via token', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Failed to confirm submission' });
  }
});

module.exports = router;


