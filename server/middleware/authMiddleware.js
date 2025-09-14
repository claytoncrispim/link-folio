import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  // --- SANITY CHECK ---
  console.log('--- PROTECT MIDDLEWARE ---');
  console.log('[PROTECT] Verifying with secret:', process.env.JWT_SECRET);
  console.log('[PROTECT] Auth Header:', req.headers.authorization);

  // 1. Check for the token (the "wristband") in the request headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (it's formatted as "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token's signature and that it's not expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Attach the user to the request object for future use
      // We find the user in the database to make sure they still exist
      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, createdAt: true }, // Select only non-sensitive data
      });
      
      // If user not found, something is wrong
      if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      // 4. Wave the request through to its destination
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

export { protect };