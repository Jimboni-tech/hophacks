const express = require('express');
const Project = require('../models/Project');

const router = express.Router();

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

    res.json({ data, page: pageNum, pageSize, total, totalPages });
  } catch (err) {
    console.error('Failed to fetch projects', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - get single project by Mongo _id
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('company');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Failed to fetch project by id', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

module.exports = router;
