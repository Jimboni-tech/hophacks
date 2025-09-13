require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Project = require('../models/Project');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);

  console.log('Seeding sample data...');

  await Company.deleteMany({});
  await Project.deleteMany({});

  const companies = await Company.insertMany([
    { name: 'Charity A', description: 'Helping communities.' },
    { name: 'Research Lab B', description: 'Insights and analytics.' },
    { name: 'Startup C', description: 'Building the future.' },
  ]);

  const [charityA, labB, startupC] = companies;

  await Project.insertMany([
    {
      name: 'Clean Donation Logs',
      company: charityA._id,
      description: 'Normalize and dedupe CSV donations.',
      requiredSkills: ['CSV', 'Cleaning'],
      estimatedTime: '6 hours',
  githubUrl: 'https://github.com/example/donations-dataset',
  githubUrl: 'https://github.com/example/csv-cleaner',
    },
    {
      name: 'Categorize Survey Responses',
      company: labB._id,
      description: 'Tag responses by theme.',
      requiredSkills: ['Tagging', 'Survey'],
      estimatedTime: '1 day',
  githubUrl: 'https://github.com/example/survey-dataset',
  githubUrl: 'https://github.com/example/survey-tagger',
    },
    {
      name: 'Fix JSON Formatting',
      company: startupC._id,
      description: 'Validate and pretty-print JSON.',
      requiredSkills: ['JSON', 'Formatting'],
      estimatedTime: '3 hours',
  githubUrl: 'https://github.com/example/sample-dataset',
  githubUrl: 'https://github.com/example/json-formatter',
    },
    {
      name: 'Label Housing Feedback',
      company: charityA._id,
      description: 'Label categories for housing feedback.',
      requiredSkills: ['Labeling', 'Housing'],
      estimatedTime: '8 hours',
  githubUrl: 'https://github.com/example/housing-dataset',
  githubUrl: 'https://github.com/example/labeler',
    },
  ]);

  console.log('Seed complete.');
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
