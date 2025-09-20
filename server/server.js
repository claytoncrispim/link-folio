import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { protect } from './middleware/authMiddleware.js';

const prisma = new PrismaClient();
const app = express();
const port = 3001;

// --- Middleware ---
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN_URL, // Use the variable for our local client
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());


// --- Auth & User Routes ---
app.post('/api/users', async (req, res) => {
  // ... (Your existing user registration code is perfect)
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.status(201).json({
      message: 'User created successfully!',
      user: { id: newUser.id, email: newUser.email, createdAt: newUser.createdAt },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  // ... (Your existing login code is perfect)
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    const isPasswordMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Logged in successfully!', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.get('/api/profile', protect, (req, res) => {
  // ... (Your existing profile route is perfect)
  res.status(200).json({ message: 'Welcome to the VIP lounge!', user: req.user });
});


// --- LINKS API ENDPOINTS ---

app.post('/api/links', protect, async (req, res) => {
  // ... (Your existing create link code is perfect)
  try {
    const { title, url } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required.' });
    }
    const newLink = await prisma.link.create({
      data: { title, url, ownerId: req.user.id },
    });
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- ADD THIS MISSING ENDPOINT ---
// @desc    Get all links for the logged-in user
// @route   GET /api/links
// @access  Private
app.get('/api/links', protect, async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- AND ADD THIS MISSING ENDPOINT ---
// @desc    Delete a specific link
// @route   DELETE /api/links/:id
// @access  Private
app.delete('/api/links/:id', protect, async (req, res) => {
  try {
    const linkId = req.params.id;
    const userId = req.user.id;
    const link = await prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      return res.status(404).json({ error: 'Link not found.' });
    }
    if (link.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this link.' });
    }
    await prisma.link.delete({ where: { id: linkId } });
    res.status(200).json({ message: 'Link deleted successfully.' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});


// --- Server Listener ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});