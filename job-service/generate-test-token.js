const jwt = require('jsonwebtoken');

// Use the same secret as your services
const secret = process.env.JWT_SECRET || 'workzone-super-secret-key-2025-production-ready';

// Create a test user payload
const payload = {
  sub: '49979cb5-31ae-46fc-8892-e7972259c40d', // User ID
  email: 'test@example.com',
  role: 'customer',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
};

const token = jwt.sign(payload, secret);

console.log('Generated JWT Token:');
console.log(token);
console.log('\nTest with cURL:');
console.log(`curl -X POST "http://localhost:3002/jobs" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Fix water leakage",
    "description": "There's a leaking pipe in the kitchen.",
    "category": "Plumbing",
    "location": "Colombo",
    "location_lat": 6.9271,
    "location_lng": 79.8612,
    "budget_min": 1000,
    "budget_max": 2500,
    "currency": "LKR",
    "priority": "HIGH"
  }'`);
