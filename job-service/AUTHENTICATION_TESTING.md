# Authentication Testing Guide

## Option 1: Get JWT from Auth Service
```bash
# 1. Start Auth Service (port 3000)
# 2. Login to get JWT token
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Copy the "access_token" from response
```

## Option 2: Create Test JWT Token (Development Only)
```javascript
// Use this in Node.js to create a test token
const jwt = require('jsonwebtoken');

const payload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'customer'
};

const secret = 'your-jwt-secret'; // Same as in .env
const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log('Test JWT Token:', token);
```

## Option 3: Mock Auth for Testing
```bash
# For development testing, you can temporarily disable auth
# by commenting out @UseGuards(JwtAuthGuard) in job.controller.ts
```

## Using the JWT Token in Requests

### cURL:
```bash
curl -X POST "http://localhost:3002/jobs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Job", "description": "Test description"}'
```

### Postman:
1. Go to Authorization tab
2. Select "Bearer Token"
3. Paste your JWT token

### Browser (Swagger):
1. Click "Authorize" button in Swagger UI
2. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
3. Click "Authorize"
