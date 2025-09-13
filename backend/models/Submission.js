const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: String, required: true }, // external user identifier
  submissionUrl: { type: String, required: true }, // link to file, gist, S3, etc.
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  // simple duplicate detection
  hash: { type: String, index: true },
  reviewedAt: { type: Date },
  reviewer: { type: String },
  rejectReason: { type: String },
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
