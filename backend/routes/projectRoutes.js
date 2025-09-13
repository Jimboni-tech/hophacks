const express = require('express');
const Project = require('../models/Project');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// GET /api/projects/:id/completed-users
// Returns: { completedUsers: [userId], applicants: [userId] }
router.get('/projects/:id/completed-users', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Get completed users
    const completedUsers = project.completedUsers || [];
    // Get recent applicants (appliedUsers)
    const applicants = project.appliedUsers || [];
    res.json({ completedUsers, applicants });
  } catch (err) {
    console.error('Failed to get completed users/applicants for project', err);
    res.status(500).json({ error: 'Failed to get completed users/applicants for project' });
  }
});

// GET /api/projects
// Query: q, page=1, limit=10, sort=newest|oldest|name|relevance
// Returns: { data: Project[], page, pageSize, total, totalPages }
router.get('/projects', async (req, res) => {
  const { q = '', page = '1', limit = '10', sort = 'newest' } = req.query;
  try {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const hasQuery = q && String(q).trim().length > 0;

    // Build filter and base query
    let filter = {};
    if (hasQuery) {
      // Use a regex-based search across name, description and requiredSkills.
      // Avoid mixing $text and regex in the same $or to prevent Mongo planner failures.
      const regex = { $regex: String(q), $options: 'i' };
      filter = {
        $or: [
          { name: regex },
          { description: regex },
          { requiredSkills: { $elemMatch: regex } },
        ],
      };
    }

    // Sorting logic
    let sortSpec = { createdAt: -1 };
    if (sort === 'oldest') sortSpec = { createdAt: 1 };
    else if (sort === 'name') sortSpec = { name: 1 };
    // Note: textScore-based relevance requires $text; since we use regex search to avoid
    // planner issues, we don't provide a textScore sort here. 'relevance' will fall back
    // to default newest sort when using regex search.

    // Base query
    const queryExec = Project.find(filter).populate('company', 'name');

    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const data = await queryExec
      .sort(sortSpec)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // If requester is a user, reveal githubUrl only for projects in their currentProjects.
    try {
      const auth = req.headers.authorization || '';
      let payload = null;
      if (auth.startsWith('Bearer ')) {
        const token = auth.slice('Bearer '.length);
        try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { payload = null; }
      }
      // build set of allowed project ids for this requester
      const allowed = new Set();
      let isCompany = false;
      let companyId = null;
      if (payload) {
        if (payload.company && payload.companyId) {
          isCompany = true;
          companyId = payload.companyId;
        } else if (payload.userId) {
          try {
            const user = await User.findOne({ userId: payload.userId }).select('currentProjects').lean();
            if (user && Array.isArray(user.currentProjects)) {
              for (const c of user.currentProjects) {
                const pid = String(c.projectId || c._id || c);
                allowed.add(pid);
              }
            }
          } catch (e) {
            // ignore user lookup errors
          }
        }
      }

      let ownerCompanyObjectId = null;
      if (isCompany && companyId) {
        try {
          const comp = await Company.findOne({ companyId }).select('_id').lean();
          if (comp) ownerCompanyObjectId = String(comp._id);
        } catch (e) {
          // ignore
        }
      }

      const sanitized = data.map((proj) => {
        // allow company owner to see their repos
        if (ownerCompanyObjectId && proj.company && String(proj.company._id || proj.company) === ownerCompanyObjectId) {
          return proj;
        }
        // allow if project id is in allowed set
        if (allowed.has(String(proj._id))) return proj;
        // otherwise hide githubUrl
        const copy = { ...proj };
        delete copy.githubUrl;
        return copy;
      });
      return res.json({ data: sanitized, page: pageNum, pageSize, total, totalPages });
    } catch (e) {
      console.error('Failed to sanitize project list based on user permissions', e);
      // fallback: strip githubUrl from all projects for safety
      const stripped = data.map(p => { const c = { ...p }; delete c.githubUrl; return c; });
      return res.json({ data: stripped, page: pageNum, pageSize, total, totalPages });
    }
  } catch (err) {
    console.error('Failed to fetch projects', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - get single project by Mongo _id
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('company').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    try {
      const auth = req.headers.authorization || '';
      let payload = null;
      if (auth.startsWith('Bearer ')) {
        const token = auth.slice('Bearer '.length);
        try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { payload = null; }
      }
      // company owner can see their own project's repo
      if (payload && payload.company && payload.companyId) {
        const company = await Company.findOne({ companyId: payload.companyId }).select('_id').lean();
        if (company && String(project.company?._id || project.company) === String(company._id)) {
          return res.json(project);
        }
      }
      // user must have this project in their currentProjects to see githubUrl
      if (payload && payload.userId) {
        const user = await User.findOne({ userId: payload.userId }).select('currentProjects').lean();
        if (user && Array.isArray(user.currentProjects) && user.currentProjects.some(c => String(c.projectId || c._id || c) === String(project._id))) {
          return res.json(project);
        }
      }
      // otherwise, hide the githubUrl field
      const copy = { ...project };
      delete copy.githubUrl;
      return res.json(copy);
    } catch (e) {
      console.error('Failed to sanitize project detail based on permissions', e);
      const copy = { ...project };
      delete copy.githubUrl;
      return res.json(copy);
    }
  } catch (err) {
    console.error('Failed to fetch project by id', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - create a new project (company only)
router.post('/projects', async (req, res) => {
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
    if (!payload.company || !payload.companyId) return res.status(403).json({ error: 'Only companies can create projects' });

    // find company
    const company = await Company.findOne({ companyId: payload.companyId });
    if (!company) return res.status(404).json({ error: 'Company not found' });

  const { name, description, summary, requiredSkills = [], estimatedTime, githubUrl, estimatedMinutes, volunteerHours, imageUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    if (!summary || String(summary).trim().length < 10) return res.status(400).json({ error: 'Project summary is required (one or two sentences)' });
  if (!githubUrl || !String(githubUrl).includes('github.com')) return res.status(400).json({ error: 'A valid GitHub repository URL is required' });
  if (!imageUrl || !/^https?:\/\//i.test(String(imageUrl))) return res.status(400).json({ error: 'A valid imageUrl (http/https) is required' });

  const project = new Project({ name, description, summary, requiredSkills, estimatedTime, estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null, volunteerHours: volunteerHours ? Number(volunteerHours) : 0, company: company._id, githubUrl, imageUrl });
    await project.save();

    // attach to company.projects
    company.projects = company.projects || [];
    company.projects.push(project._id);
    await company.save();

    res.status(201).json({ message: 'Project created', project });
  } catch (err) {
    console.error('Failed to create project', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/company/projects - list projects for the authenticated company
router.get('/company/projects', async (req, res) => {
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

    const projects = await Project.find({ company: company._id }).sort({ createdAt: -1 }).lean();
    res.json({ data: projects });
  } catch (err) {
    console.error('Failed to list company projects', err);
    res.status(500).json({ error: 'Failed to list company projects' });
  }
});

module.exports = router;
