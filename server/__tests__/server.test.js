import request from 'supertest';
import app from '../server.js';

// --- TEST 1: Test the POST /api/links route ---
describe('POST /api/links', () => {

  // This is your winning test! We are keeping it.
  it('should return 401 Unauthorized if no auth token is provided', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ url: 'https://newlink.com', title: 'New Test Link' });
      
    expect(response.status).toBe(401); // Or 403, whatever your middleware returns
  });
});


// --- TEST 2: Test the GET /api/links route ---
describe('GET /api/links', () => {

  // Check for unauthorized access
  it('should return 401 Unauthorized if no auth token is provided', async () => {
    const response = await request(app).get('/api/links'); // Using your correct '/api/links' route
    
    expect(response.status).toBe(401); // We expect this to fail with 401, because it's a protected route
  });

  // Check for authorized access
  it('should return 200 OK and an array for a valid token', async () => {
    // --- PASTE YOUR REAL, NEWLY-GOTTEN TOKEN HERE ---
    const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkODllOGUyMS1kMWM5LTQzNjYtODVjNi0wNjNhYmEwNWNhNTkiLCJpYXQiOjE3NjEzMjI2MzQsImV4cCI6MTc2MTMyNjIzNH0.Xb_ITnShQHLndYE6YZjHug4uNwowprc3SxUMB0mB_TU';
    
    const response = await request(app)
      .get('/api/links')
      .set('Authorization', `Bearer ${REAL_TOKEN}`); // Set the real token
      
    // Check for success!
    expect(response.status).toBe(200); 
    // Check that it *actually* sent back an array of links
    expect(Array.isArray(response.body)).toBe(true); 
  });
});
