const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Resolve a fetch function: prefer global fetch (Node 18+), otherwise try to require node-fetch.
let fetchFn = null;
if (typeof globalThis.fetch === 'function') {
  fetchFn = globalThis.fetch.bind(globalThis);
} else {
  try {
    // try CommonJS require for environments where node-fetch is installed
    // (node-fetch v3 is ESM-only; require may fail in some setups)
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    fetchFn = require('node-fetch');
  } catch (e) {
    fetchFn = null;
  }
}

// In-memory map for OAuth state -> token mapping (dev only). Consider Redis for production.
const oauthStateMap = new Map();
const crypto = require('crypto');

// cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of oauthStateMap) {
    if (now - (v.createdAt || 0) > 1000 * 60 * 5) { // 5 minutes
      oauthStateMap.delete(k);
    }
  }
}, 60 * 1000);

// GitHub OAuth start route - redirects user to GitHub
router.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  // allow token to be provided so frontend can initiate connection; store token server-side keyed by state
  const providedToken = req.query.token || '';
  const stateProvided = req.query.state || '';
  const returnToProvided = req.query.returnTo || '';
  if (!clientId) return res.status(500).send('GitHub client id not configured');
  // create a random state if not provided
  const state = stateProvided || crypto.randomBytes(16).toString('hex');
  if (providedToken) {
    // store mapping short-term, include optional returnTo page
    oauthStateMap.set(state, { token: providedToken, createdAt: Date.now(), returnTo: returnToProvided });
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo%20read:user%20user:email&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

// GitHub OAuth callback - exchanges code for token and attaches github info to user
router.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state || '';
  // look up token from query or from our state map
  let token = req.query.token || '';
  if (!token && state && oauthStateMap.has(state)) {
    const entry = oauthStateMap.get(state);
    if (entry && entry.token) token = entry.token;
    // cleanup
    oauthStateMap.delete(state);
    console.log('GitHub callback: token resolved from state map for state=', state ? state.slice(0,8) : '');
  } else if (token) {
    console.log('GitHub callback: token provided in query');
  } else {
    console.log('GitHub callback: no token provided or found for state=', state ? state.slice(0,8) : '');
  }
  if (!code) return res.status(400).send('Code missing');
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!fetchFn) return res.status(500).send('Server missing fetch support; install node-fetch or use Node 18+');
    const tokenRes = await fetchFn('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.status(400).send('Failed to get access token');

    // fetch user profile from GitHub
    const profileRes = await fetchFn('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'hophacks-app' } });
    const profile = await profileRes.json();

    console.log('GitHub callback: profile.login=', profile.login, 'profile.id=', profile.id);
    console.log('GitHub callback: received token in query?', !!token);

    // if token (JWT) provided, attach Github to that user
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('GitHub callback: decoded JWT userId=', decoded.userId);
        const user = await User.findOne({ userId: decoded.userId });
        if (user) {
          console.log('GitHub callback: attaching github to user', user.userId);
          user.github = {
            id: profile.id,
            login: profile.login,
            accessToken,
            avatarUrl: profile.avatar_url,
            profileUrl: profile.html_url
          };
          await user.save();
          console.log('GitHub callback: user saved with github', user.github && user.github.login);
        } else {
          console.log('GitHub callback: no user found for decoded.userId=', decoded.userId);
        }
      } catch (e) {
        console.error('GitHub callback: failed to attach github to user', e && e.message);
        // ignore if token invalid
      }
    }

    // Redirect back to frontend with success and optionally github login
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    let returnTo = '/profile';
    if (state && oauthStateMap.has(state)) {
      const entry = oauthStateMap.get(state);
      if (entry && entry.returnTo) returnTo = entry.returnTo;
    }
    const qs = `?github=${encodeURIComponent(profile.login || '')}` + (state ? `&state=${encodeURIComponent(state)}` : '');
    res.redirect(`${frontendUrl}${returnTo}${qs}`);
  } catch (err) {
    console.error('GitHub callback error', err);
    res.status(500).send('GitHub auth failed');
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { userId, email, password, fullName, skills } = req.body;
  console.log('Register request body:', req.body);
  try {
    console.log('Checking for existing user...');
    // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
  console.log('Existing user:', existingUser);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
  // Hash password
  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = new User({
      userId,
      email,
      password: hashedPassword,
      fullName,
      skills,
      resume: {},
      completedProjects: [],
      interestedProjects: []
    });
    console.log('Saving new user:', user);
    await user.save();
  // Generate JWT token
  const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  console.log('Registration successful, token:', token);
  res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
