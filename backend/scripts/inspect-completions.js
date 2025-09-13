#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hophacks';

async function main() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const idArg = process.argv[2];
  if (idArg) {
    const s = await Submission.findById(idArg).lean();
    if (!s) {
      console.error('Submission not found', idArg);
      process.exit(2);
    }
    console.log('Submission:', s);
    const u = await User.findOne({ userId: s.userId }).lean();
    console.log('Lookup User by userId:', s.userId, u ? u._id : 'not found');
    if (u) console.log('User completedProjects length:', (u.completedProjects || []).length, 'totalCompletedProjects:', u.totalCompletedProjects, 'totalVolunteerHours:', u.totalVolunteerHours);
  } else {
    console.log('Recent verified submissions:');
    const subs = await Submission.find({ completionVerified: true }).sort({ completionVerifiedAt: -1 }).limit(10).lean();
    for (const s of subs) {
      console.log('---');
      console.log('submissionId:', s._id.toString(), 'userId:', s.userId, 'project:', String(s.project), 'verifiedAt:', s.completionVerifiedAt);
      const u = await User.findOne({ userId: s.userId }).lean();
      console.log(' user found:', !!u, u ? `user._id=${u._id} totalCompleted=${u.totalCompletedProjects}` : '');
    }
  }
  await mongoose.disconnect();
}

main().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
