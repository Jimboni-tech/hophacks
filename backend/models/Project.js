const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  description: String,
  requiredSkills: [String],
  estimatedTime: String // e.g., '2 weeks', '40 hours', etc.
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
