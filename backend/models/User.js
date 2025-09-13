const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  skills: [String],
  resume: {
    data: Buffer, // PDF file data
    filename: { type: String },
    contentType: { type: String, default: 'application/pdf' }
  },
  github: {
    id: { type: Number },
    login: { type: String },
    accessToken: { type: String },
    avatarUrl: { type: String },
    profileUrl: { type: String }
  },
  completedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  interestedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  appliedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  currentProjects: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    movedAt: { type: Date },
    completionRequested: { type: Boolean, default: false },
    completionRequestedAt: { type: Date }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
