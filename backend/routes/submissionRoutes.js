const express = require('express');
const crypto = require('crypto');
const Submission = require('../models/Submission');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const CompletedNotification = require('../models/CompletedNotification');
const router = express.Router();

// PATCH /api/company/completed-notifications/:id { action: 'approve' | 'reject', reviewer, rejectReason }
router.patch('/company/completed-notifications/:id', async (req, res) => {
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
    const { action, reviewer, rejectReason } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const notification = await require('../models/CompletedNotification').findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date(), reviewer: reviewer || 'company', rejectReason: status === 'rejected' ? (rejectReason || 'Not specified') : undefined },
      { new: true }
    ).populate('submission').populate('user').populate('project');
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    // If approved, mark submission as completionVerified
    if (status === 'approved') {
      const Submission = require('../models/Submission');
      await Submission.findByIdAndUpdate(notification.submission._id || notification.submission, {
        completionVerified: true,
        completionVerifiedAt: new Date(),
        completionVerifier: reviewer || 'company',
        status: 'approved'
      });
    } else if (status === 'rejected') {
      const Submission = require('../models/Submission');
      await Submission.findByIdAndUpdate(notification.submission._id || notification.submission, {
        completionVerified: false,
        completionVerifiedAt: new Date(),
        completionVerifier: reviewer || 'company',
        status: 'rejected',
        rejectReason: rejectReason || 'Not specified'
      });
    }
    res.json(notification);
  } catch (err) {
    console.error('Failed to review completed notification', err);
    res.status(500).json({ error: 'Failed to review completed notification' });
  }
});
// GET /api/company/completed-notifications - recent completion requests for company-owned projects
router.get('/company/completed-notifications', async (req, res) => {
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

    // load company and its notifications, populating submission, user, and project refs
    const company = await Company.findOne({ companyId: payload.companyId }).populate({
      path: 'completedNotifications',
      populate: [
        { path: 'submission' },
        { path: 'user', select: 'userId fullName email skills github' },
        { path: 'project', select: 'name summary description estimatedTime volunteerHours githubUrl imageUrl requiredSkills' }
      ]
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    // Fetch user details for all notifications
    // Format notifications for frontend. Use populated user/project when available, otherwise fall back to snapshots
    const data = (company.completedNotifications || []).map(n => ({
      id: n._id,
      submissionId: n.submission?._id || (n.submission && n.submission),
      userId: n.userId,
      user: n.user ? { userId: n.user.userId, fullName: n.user.fullName, email: n.user.email, skills: n.user.skills, github: n.user.github } : (n.userInfo || {}),
      project: n.project ? { id: n.project._id, name: n.project.name, summary: n.project.summary, description: n.project.description, estimatedTime: n.project.estimatedTime, volunteerHours: n.project.volunteerHours, githubUrl: n.project.githubUrl, imageUrl: n.project.imageUrl, requiredSkills: n.project.requiredSkills } : (n.projectInfo || {}),
      requestedAt: n.requestedAt,
      status: n.status,
      reviewedAt: n.reviewedAt,
      reviewer: n.reviewer,
      rejectReason: n.rejectReason
    }));
    res.json({ data });
  } catch (err) {
    console.error('Failed to list company completed notifications', err);
    res.status(500).json({ error: 'Failed to list company completed notifications' });
  }
});


// GET /api/leaderboard/users?limit=10
// Returns top users by volunteer hours, completions, and applications
router.get('/leaderboard/users', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    // Get top users by volunteer hours
    const topHours = await require('../models/User').find({})
      .select('userId fullName totalVolunteerHours totalCompletedProjects totalApplications')
      .sort({ totalVolunteerHours: -1 })
      .limit(lim)
      .lean();
    // Get top users by completions
    const topCompletions = await require('../models/User').find({})
      .select('userId fullName totalVolunteerHours totalCompletedProjects totalApplications')
      .sort({ totalCompletedProjects: -1 })
      .limit(lim)
      .lean();
    // Get top users by applications
    const topApplications = await require('../models/User').find({})
      .select('userId fullName totalVolunteerHours totalCompletedProjects totalApplications')
      .sort({ totalApplications: -1 })
      .limit(lim)
      .lean();
    res.json({
      topVolunteerHours: topHours,
      topCompletions: topCompletions,
      topApplications: topApplications
    });
  } catch (err) {
    console.error('Failed to fetch user leaderboard', err);
    res.status(500).json({ error: 'Failed to fetch user leaderboard' });
  }
});
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

  // optionally link to an existing User document
  let userDoc = null;
  try { userDoc = await require('../models/User').findOne({ userId }); } catch (e) { /* ignore */ }
  const created = await Submission.create({ project: project._id, user: userDoc?._id, userId, submissionUrl, notes, hash });
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
      .populate('user', 'userId fullName')
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
      .populate({ path: 'user', select: 'userId fullName email skills github' })
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

  const submission = await Submission.findById(id).populate('user');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    // verify the submission belongs to this user
    if (submission.userId !== payload.userId) return res.status(403).json({ error: 'Not your submission' });

    submission.completionRequested = true;
    submission.completionRequestedAt = new Date();
    await submission.save();
    // Add a completed notification to the company, with references and snapshot info
    const project = await Project.findById(submission.project).populate('company', '_id').lean();
    const user = await require('../models/User').findOne({ userId: submission.userId }).lean();
    const CompletedNotification = require('../models/CompletedNotification');
    const notification = await CompletedNotification.create({
      submission: submission._id,
      user: user ? user._id : undefined,
      userId: submission.userId,
      userInfo: user ? {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        skills: user.skills,
        github: user.github
      } : {},
      project: submission.project,
      projectInfo: project ? {
        name: project.name,
        summary: project.summary,
        description: project.description,
        estimatedTime: project.estimatedTime,
        volunteerHours: project.volunteerHours,
        githubUrl: project.githubUrl,
        imageUrl: project.imageUrl,
        requiredSkills: project.requiredSkills
      } : {},
      requestedAt: new Date(),
      status: 'pending'
    });
    // Add notification to company
    if (project && project.company && project.company._id) {
      await require('../models/Company').findByIdAndUpdate(project.company._id, {
        $push: { completedNotifications: notification._id }
      });
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
      .populate('user', 'userId fullName email skills github')
      .populate('project', 'name summary description estimatedTime volunteerHours githubUrl imageUrl requiredSkills')
      .lean();

    const projectMap = Object.fromEntries(projects.map(p => [String(p._id), p.name]));

    const data = submissions.map(s => ({
      id: s._id,
      projectId: s.project?._id || s.project,
      projectName: s.project?.name || projectMap[String(s.project)] || 'Unknown project',
      projectSummary: s.project?.summary,
      projectDescription: s.project?.description,
      projectEstimatedTime: s.project?.estimatedTime,
      projectVolunteerHours: s.project?.volunteerHours,
      projectGithubUrl: s.project?.githubUrl,
      projectImageUrl: s.project?.imageUrl,
      projectRequiredSkills: s.project?.requiredSkills || [],
      userId: s.userId,
      user: s.user ? { userId: s.user.userId, fullName: s.user.fullName, email: s.user.email, skills: s.user.skills, github: s.user.github } : undefined,
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
  const user = submission.user ? await User.findById(submission.user._id) : await User.findOne({ userId: submission.userId });
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
      // Add userId to project's completedUsers array if not already present
      await Project.findByIdAndUpdate(project._id, { $addToSet: { completedUsers: user.userId } });
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
  const user = submission.user ? await User.findById(submission.user) : await User.findOne({ userId: submission.userId });
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


