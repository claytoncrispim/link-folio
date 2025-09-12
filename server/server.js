// This line is good practice for running the server outside of Docker
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient to talk to our database
import bcrypt from 'bcrypt'; // Import bcrypt to handle passowrds

const prisma = new PrismaClient(); // Create an instance of the client


const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
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


// --- Test Route ---
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend server!' });
});


// --- Server Listener ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});