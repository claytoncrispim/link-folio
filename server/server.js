// This line is good practice for running the server outside of Docker
// import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient to talk to our database
import bcrypt from 'bcrypt'; // Import bcrypt to handle passowrds
import jwt from 'jsonwebtoken'; // Import JWT for authorization and authentication
import { protect } from './middleware/authMiddleware.js';


const prisma = new PrismaClient(); // Create an instance of the client

// --- SANITY CHECK ---
console.log('[SERVER STARTUP] JWT_SECRET:', process.env.JWT_SECRET);

const app = express();
const port = 3001;

// --- Middleware ---
// Configure CORS to allow requests only from our client's origin
const corsOptions = {
  // origin: process.env.CLIENT_ORIGIN_URL,
  origin: 'https://turbo-space-memory-4wj4v94j7v5cjx64-5173.app.github.dev',
  optionsSuccessStatus: 200, // For legacy browser support
  credentials: true
};

app.use(cors(corsOptions));

// This is a universal preflight handler.
// It ensures that ANY OPTIONS request gets a successful response with our CORS headers.
app.options('*', cors(corsOptions));

app.use(express.json());

// --- USER REGISTRATION ENDPOINT ---
app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation: Ensure we received an email and password.
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Check if the user already exists in the database.
    const existingUser = await prisma.user.findUnique({
      where: { email: email }, // Find a user where the email matches the one provided.
    });

    if (existingUser) {
      // If we found a user, return a 409 Conflict error.
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    // 3. Hash the password for security.
    const saltRounds = 10; // A standard value for the complexity of the hash.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Save the new user to the database using Prisma.
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword, // IMPORTANT: Store the HASHED password, not the original.
      },
    });

    // 5. Send a success response back to the client.
    // Crucially, we do NOT send the password hash back, only safe information.
    res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- USER LOGIN ENDPOINT ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Check if user exists AND if passwords match
    // We use bcrypt.compare to securely compare the plain-text password with the stored hash.
    const isPasswordMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isPasswordMatch) {
      // IMPORTANT: Use a generic error message for security.
      // Don't tell the attacker if the email was wrong or the password was wrong.
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 4. User is authenticated! Create a JWT.
    const payload = {
      userId: user.id, // Include non-sensitive user info in the token
    };

    // --- SANITY CHECK ---
    console.log('[LOGIN] Signing token with secret:', process.env.JWT_SECRET);

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // The token will be valid for 1 hour
    );

    // 5. Send the token back to the client
    res.status(200).json({
      message: 'Logged in successfully!',
      token: token,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- PROTECTED "VIP LOUNGE" ROUTE ---
// This route is protected by our 'protect' middleware.
// A request must pass the security check in 'protect' before this function will ever run.
app.get('/api/profile', protect, (req, res) => {
  // Because the 'protect' middleware ran successfully,
  // we now have access to the user's data on `req.user`.
  res.status(200).json({
    message: 'Welcome to the VIP lounge!',
    user: req.user,
  });
});

// --- Test Route ---
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend server!' });
});


// --- Server Listener ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});