const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Company = require('../models/Company');
const mongoose = require('mongoose');

const router = express.Router();

// ...existing user routes...

// Apply to a project for a company
router.post('/users/:userId/apply', async (req, res) => {
  const { projectId, companyId } = req.body;
  try {
    // Validate user, project, and company exist
    const user = await User.findOne({ userId: req.params.userId });
    const project = await Project.findById(projectId);
    const company = await Company.findById(companyId);
    if (!user || !project || !company) {
      return res.status(404).json({ error: 'User, Project, or Company not found' });
    }

    // Add project to user's interestedProjects if not already present
    if (!user.interestedProjects.includes(project._id)) {
      user.interestedProjects.push(project._id);
      await user.save();
    }

    // Optionally, you could add logic to notify the company or create an Application model
    res.json({ message: 'Applied to project successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply to project' });
  }
});

module.exports = router;
