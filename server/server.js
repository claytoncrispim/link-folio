// This line is good practice for running the server outside of Docker
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());


// --- Test Route ---
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend server!' });
});


// --- Server Listener ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});