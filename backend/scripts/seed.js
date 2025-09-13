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
      datasetUrl: 'https://example.com/datasets/donations.csv',
      uiUrl: 'https://example.com/tools/csv-cleaner',
    },
    {
      name: 'Categorize Survey Responses',
      company: labB._id,
      description: 'Tag responses by theme.',
      requiredSkills: ['Tagging', 'Survey'],
      estimatedTime: '1 day',
      datasetUrl: 'https://example.com/datasets/survey.json',
      uiUrl: 'https://example.com/tools/survey-tagger',
    },
    {
      name: 'Fix JSON Formatting',
      company: startupC._id,
      description: 'Validate and pretty-print JSON.',
      requiredSkills: ['JSON', 'Formatting'],
      estimatedTime: '3 hours',
      datasetUrl: 'https://example.com/datasets/sample.json',
      uiUrl: 'https://example.com/tools/json-formatter',
    },
    {
      name: 'Label Housing Feedback',
      company: charityA._id,
      description: 'Label categories for housing feedback.',
      requiredSkills: ['Labeling', 'Housing'],
      estimatedTime: '8 hours',
      datasetUrl: 'https://example.com/datasets/housing.csv',
      uiUrl: 'https://example.com/tools/labeler',
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
