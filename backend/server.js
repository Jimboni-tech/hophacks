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

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});