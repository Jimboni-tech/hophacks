const mongoose = require('mongoose');

const completedNotificationSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  // reference to User document (if available)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // legacy userId for compatibility and quick indexing
  userId: { type: String, required: true },
  // snapshot of user info for display without extra joins
  userInfo: {
    userId: String,
    fullName: String,
    email: String,
    skills: [String],
    github: {
      id: Number,
      login: String,
      avatarUrl: String,
      profileUrl: String
    }
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  // snapshot of project info for display
  projectInfo: {
    name: String,
    summary: String,
    description: String,
    estimatedTime: String,
    volunteerHours: Number,
    githubUrl: String,
    imageUrl: String,
    requiredSkills: [String]
  },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: { type: Date },
  reviewer: { type: String },
  rejectReason: { type: String }
});

module.exports = mongoose.model('CompletedNotification', completedNotificationSchema);
