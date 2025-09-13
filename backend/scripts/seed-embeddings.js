require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../db/connect');
const Project = require('../models/Project');
const { createEmbedding } = require('../lib/llm');

async function run() {
  await connectDB(process.env.MONGODB_URI);
  const projects = await Project.find();
  for (const p of projects) {
    const text = `${p.name}\n\n${p.description || ''}`.slice(0, 30000);
    try {
      const emb = await createEmbedding(text);
      if (emb) {
        p.embedding = emb;
        await p.save();
        console.log('Seeded', p._id.toString());
      } else {
        console.log('No embedding for', p._id.toString());
      }
    } catch (e) {
      console.error('Failed to seed', p._id.toString(), e && e.message);
    }
  }
  process.exit(0);
}

run();
