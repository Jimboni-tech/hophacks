const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Company = require('../models/Company');
const mongoose = require('mongoose');

const router = express.Router();

// Mark a project as completed for a user
router.post('/users/:userId/complete', async (req, res) => {
  const { projectId } = req.body;
  try {
    const user = await User.findOne({ userId: req.params.userId });
    const project = await Project.findById(projectId);
    if (!user || !project) {
      return res.status(404).json({ error: 'User or Project not found' });
    }

    // Remove project from interestedProjects if present
    user.interestedProjects = user.interestedProjects.filter(
      pid => pid.toString() !== project._id.toString()
    );

    // Add project to completedProjects if not already present
    if (!user.completedProjects.includes(project._id)) {
      user.completedProjects.push(project._id);
    }
    await user.save();

    res.json({ message: 'Project marked as completed for user.', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark project as completed' });
  }
});

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

// Pick a user for a project (assign)
router.post('/projects/:projectId/pick', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ userId });
    const project = await Project.findById(req.params.projectId);
    if (!user || !project) {
      return res.status(404).json({ error: 'User or Project not found' });
    }

    // Remove project from DB
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'User picked and project removed from database.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pick user for project' });
  }
});

// Reject a user for a project (remove from interested lists)
router.post('/projects/:projectId/reject', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ userId });
    const project = await Project.findById(req.params.projectId);
    if (!user || !project) {
      return res.status(404).json({ error: 'User or Project not found' });
    }

    // Remove project from user's interestedProjects
    user.interestedProjects = user.interestedProjects.filter(
      pid => pid.toString() !== project._id.toString()
    );
    await user.save();

    // Remove user from project's interestedUsers
    project.interestedUsers = project.interestedUsers.filter(
      uid => uid.toString() !== user._id.toString()
    );
    await project.save();

    res.json({ message: 'User rejected and removed from interested lists.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject user for project' });
  }
});

module.exports = router;
