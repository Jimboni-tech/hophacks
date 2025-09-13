const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  description: String,
  requiredSkills: [String],
  estimatedTime: String, // e.g., '2 weeks', '40 hours', etc.
  datasetUrl: String,
  uiUrl: String,
  interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Optional: text index to speed up searches across fields
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
