const connectDB = require('../db/connect');
const mongoose = require('mongoose');
require('dotenv').config();

(async function() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hophacks';
  await connectDB(MONGODB_URI);
  const Submission = require('../models/Submission');
  const User = require('../models/User');
  const CompletedNotification = require('../models/CompletedNotification');

  // Link Submission.user to User._id where possible
  const subs = await Submission.find({ user: { $exists: false } }).lean();
  console.log('Found', subs.length, 'submissions without user ref');
  for (const s of subs) {
    if (!s.userId) continue;
    const user = await User.findOne({ userId: s.userId }).select('_id').lean();
    if (user) {
      await Submission.updateOne({ _id: s._id }, { $set: { user: user._id } });
      console.log('Linked submission', s._id, 'to user', user._id);
    }
  }

  // Link CompletedNotification.user to User._id
  const notes = await CompletedNotification.find({ user: { $exists: false } }).lean();
  console.log('Found', notes.length, 'notifications without user ref');
  for (const n of notes) {
    if (!n.userId) continue;
    const user = await User.findOne({ userId: n.userId }).select('_id').lean();
    if (user) {
      await CompletedNotification.updateOne({ _id: n._id }, { $set: { user: user._id } });
      console.log('Linked notification', n._id, 'to user', user._id);
    }
  }

  console.log('Migration complete');
  process.exit(0);
})();
