require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./db/connect');
const userRoutes = require('./routes/userRoutes');
const userApplyRoutes = require('./routes/userApplyRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const companyRoutes = require('./routes/companyRoutes');

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Allow CORS from frontend origin if configured
const FRONTEND_URL = process.env.FRONTEND_URL;
if (FRONTEND_URL) {
  app.use(cors({ origin: FRONTEND_URL }));
} else {
  app.use(cors());
}
// increase body size limits to allow base64 resume uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to DB
connectDB(MONGODB_URI);

// Routes

app.use('/api', userRoutes);
app.use('/api', userApplyRoutes);
app.use('/api', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', companyRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// support OAuth redirects that point to frontend-style paths
app.get('/auth/github', (req, res) => {
  const qs = req.url.split('?')[1] || '';
  res.redirect(`/api/auth/github${qs ? `?${qs}` : ''}`);
});

app.get('/auth/github/callback', (req, res) => {
  const qs = req.url.split('?')[1] || '';
  res.redirect(`/api/auth/github/callback${qs ? `?${qs}` : ''}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});