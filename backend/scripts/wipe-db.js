#!/usr/bin/env node
// One-off script to wipe core collections: users, projects, companies, submissions
// Usage: node scripts/wipe-db.js <mongoUri>

const connectDB = require('../db/connect');
const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb+srv://jimmyzhou0818_db_user:eKnlaaeH5rQwze6s@hophacks.36fafro.mongodb.net/?retryWrites=true&w=majority&appName=hophacks';
  if (!uri) {
    console.error('Provide Mongo URI as argument or set MONGODB_URI env var');
    process.exit(2);
  }
  await connectDB(uri);
  try {
    const collections = ['users', 'projects', 'companies', 'submissions'];
    console.log('About to drop documents from collections:', collections.join(', '));
    // Confirm
    const confirm = process.env.CONFIRM || await (async () => {
      return new Promise((resolve) => {
        process.stdout.write('Type YES to confirm: ');
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', (d) => resolve(String(d).trim()));
      });
    })();
    if (confirm !== 'YES') {
      console.log('Aborting wipe. To bypass interactive prompt, set CONFIRM=YES in env.');
      process.exit(0);
    }

    for (const name of collections) {
      try {
        const col = mongoose.connection.collection(name);
        if (!col) {
          console.log('Collection not found:', name);
          continue;
        }
        const res = await col.deleteMany({});
        console.log(`Cleared ${res.deletedCount} documents from ${name}`);
      } catch (e) {
        console.error('Failed to clear', name, e.message || e);
      }
    }

    console.log('Wipe complete. Note: indexes remain; some collections may be recreated by the app.');
  } catch (err) {
    console.error('Wipe failed', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

main();
