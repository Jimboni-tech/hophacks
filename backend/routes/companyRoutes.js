const express = require('express');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Project = require('../models/Project');

const router = express.Router();

// lightweight middleware to verify company JWT token from Authorization header
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function requireCompanyAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (!auth) return res.status(401).json({ error: 'Missing authorization' });
    const parts = auth.split(' ');
    const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : parts[0];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.companyId) return res.status(401).json({ error: 'Invalid token' });
    req.companyPayload = decoded;
    return next();
  } catch (err) {
    console.error('Company auth failed', err && err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/companies - list companies
// Response: { data: [ { _id, name, description } ] }
router.get('/companies', async (req, res) => {
  try {
    // Aggregate company list with project counts to return projectCount per company
    const companies = await Company.aggregate([
      {
        $project: {
          name: 1,
          description: 1,
          logo: 1,
          imageUrl: 1,
          summary: 1,
          website: 1
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'company',
          as: 'projects'
        }
      },
      {
        $addFields: {
          projectCount: { $size: '$projects' }
        }
      },
      {
        $project: {
          projects: 0
        }
      }
    ]).exec();

    return res.json({ data: companies });
  } catch (err) {
    console.error('Failed to fetch companies', err);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id - company details (no projects)
// Response: { data: { _id, name, description, website, logo } }
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid company id' });

  const company = await Company.findById(id).select('name description website logo imageUrl summary credentials').lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });

    return res.json({ data: company });
  } catch (err) {
    console.error('Failed to fetch company', err);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// GET /api/companies/:id/projects - paginated projects for a company
// Query: page, limit
// Response: { data: projects[], page, pageSize, total, totalPages }
router.get('/companies/:id/projects', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid company id' });

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const filter = { company: id };
    const total = await Project.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const data = await Project.find(filter)
      .select('name description requiredSkills duration location stipend createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.json({ data, page: pageNum, pageSize, total, totalPages });
  } catch (err) {
    console.error('Failed to fetch company projects', err);
    return res.status(500).json({ error: 'Failed to fetch company projects' });
  }
});

// GET /api/company/me - return the currently authenticated company (requires company JWT)
router.get('/company/me', requireCompanyAuth, async (req, res) => {
  try {
    const { companyId } = req.companyPayload || {};
    if (!companyId) return res.status(400).json({ error: 'Invalid token payload' });
    const company = await Company.findOne({ companyId }).select('-password').lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    return res.json({ data: company });
  } catch (err) {
    console.error('Failed to fetch company me', err);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
});

module.exports = router;
