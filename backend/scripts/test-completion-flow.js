const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
const Submission = require('../models/Submission');

const API = process.env.API_URL || 'http://localhost:3000/api';
const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/hophacks';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');
  // wipe some collections
  await User.deleteMany({});
  await Company.deleteMany({});
  await Project.deleteMany({});
  await Submission.deleteMany({});

  const user = await User.create({ userId: 'testuser1', fullName: 'Test User', email: 'test@example.com' });
  const company = await Company.create({ companyId: 'testco1', name: 'Test Co' });
  const project = await Project.create({ name: 'Test Project', company: company._id, summary: 's', description: 'd', volunteerHours: 4 });
  const submission = await Submission.create({ project: project._id, userId: user.userId, user: user._id, submissionUrl: 'http://example.com' });

  // add submission to company and user currentProjects
  user.currentProjects = [{ projectId: project._id, submissionId: submission._id }];
  await user.save();

  // create tokens
  const userToken = jwt.sign({ userId: user.userId }, JWT_SECRET);
  const companyToken = jwt.sign({ company: company.name, companyId: company.companyId }, JWT_SECRET);

  console.log('User, Company, Project, Submission created');
  console.log('Requesting completion as user...');
  const reqRes = await axios.post(`${API}/submissions/${submission._id}/complete-request`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
  console.log('Complete-request response:', reqRes.data);

  // fetch company notifications
  const notifs = await axios.get(`${API}/company/completed-notifications`, { headers: { Authorization: `Bearer ${companyToken}` } });
  console.log('Company notifications:', notifs.data);
  const notifId = (notifs.data.data && notifs.data.data[0] && notifs.data.data[0].id);
  if (!notifId) {
    console.error('No notification found');
    process.exit(1);
  }

  console.log('Approving notification as company...');
  const appRes = await axios.patch(`${API}/company/completed-notifications/${notifId}`, { action: 'approve', reviewer: 'testco' }, { headers: { Authorization: `Bearer ${companyToken}` } });
  console.log('Approve response:', appRes.data);

  const finalUser = await User.findOne({ userId: user.userId }).lean();
  console.log('Final user doc:', JSON.stringify(finalUser, null, 2));

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
