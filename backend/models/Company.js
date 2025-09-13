const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  // human-friendly URL slug (generated at registration)
  slug: { type: String },
  email: { type: String, required: false, lowercase: true, unique: true, sparse: true },
  password: { type: String, required: false },
  credentials: String,
  description: String,
  imageUrl: String,
  summary: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  completedNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CompletedNotification' }]
});

// ensure slug is unique when present
companySchema.index({ slug: 1 }, { unique: true, sparse: true });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
