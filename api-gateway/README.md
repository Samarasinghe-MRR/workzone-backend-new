# 🌐 WorkZone API Gateway

## 📋 Overview

The WorkZone API Gateway is a centralized entry point for all microservices in the WorkZone platform. It provides:

- **Single Entry Point**: All client requests go through port 8080
- **JWT Authentication**: Centralized token validation
- **Request Routing**: Automatic forwarding to appropriate microservices
- **Health Monitoring**: Check status of all services
- **CORS & Security**: Centralized security headers and CORS management
- **API Documentation**: Swagger docs at `/api/docs`

## 🏗️ Architecture

```
Frontend (React/Next.js)
        │
        ▼
API Gateway (Port 8080)
        │
        ├─── Auth Service (Port 3000)
        ├─── User Service (Port 3001) 
        ├─── Job Service (Port 3002)
        └─── Quotation Service (Port 3004)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd api-gateway
npm install
```

### 2. Environment Setup
Copy the `.env` file and adjust if needed:
```bash
# Environment Configuration for API Gateway
NODE_ENV=development
PORT=8080

# JWT Configuration (should match other services)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Microservice URLs
AUTH_SERVICE_URL=http://localhost:3000
USER_SERVICE_URL=http://localhost:3001
JOB_SERVICE_URL=http://localhost:3002
QUOTATION_SERVICE_URL=http://localhost:3004
```

### 3. Start the Gateway
```bash
npm run start:dev
```

The API Gateway will be available at: **http://localhost:8080**

## 📚 API Documentation

Access the Swagger documentation at: **http://localhost:8080/api/docs**

## 🔧 API Routes

### Authentication Routes
```bash
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
GET  /api/auth/verify      # Verify email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### User Routes (Protected)
```bash
GET  /api/users/me                           # Current user profile
GET  /api/users/me/dashboard                 # Role-specific dashboard
GET  /api/users/:id                          # Get user by ID
GET  /api/users/:id/customer-data           # Customer aggregated data
GET  /api/users/:id/provider-data           # Provider aggregated data
PATCH /api/users/:id                         # Update user
DELETE /api/users/:id                        # Delete user
```

### Job Routes (Protected)
```bash
GET  /api/jobs                    # List jobs
POST /api/jobs                    # Create job
GET  /api/jobs/:id                # Get job details
PUT  /api/jobs/:id                # Update job
DELETE /api/jobs/:id              # Delete job
GET  /api/jobs/customer/:id       # Jobs by customer
GET  /api/jobs/provider/:id       # Jobs by provider
```

### Quotation Routes (Protected)
```bash
GET  /api/quotations                          # List quotations
POST /api/quotations                          # Create quotation
GET  /api/quotations/:id                      # Get quotation details
PUT  /api/quotations/:id                      # Update quotation
DELETE /api/quotations/:id                    # Delete quotation
GET  /api/quotations/job/:jobId               # Quotations for job
GET  /api/quotations/provider/:providerId     # Provider quotations
```

### Special Dashboard Route
```bash
GET  /api/dashboard/me            # Get current user's dashboard (auto-detects role)
```

### Health Check Routes
```bash
GET  /api/health                  # Check all services health
GET  /api/health/:service         # Check specific service health
GET  /api/health/gateway          # Check gateway health
```

## 🔐 Authentication Flow

### 1. Login
```javascript
// Frontend login
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});

const { access_token } = await response.json();
localStorage.setItem('token', access_token);
```

### 2. Authenticated Requests
```javascript
// All subsequent requests
const response = await fetch('http://localhost:8080/api/users/me/dashboard', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## 🎯 Key Features

### Automatic Request Routing
- **Auth requests** (`/api/auth/*`) → Auth Service (Port 3000)
- **User requests** (`/api/users/*`) → User Service (Port 3001)
- **Job requests** (`/api/jobs/*`) → Job Service (Port 3002)
- **Quotation requests** (`/api/quotations/*`) → Quotation Service (Port 3004)

### JWT Authentication
- Validates JWT tokens for protected routes
- Extracts user information from tokens
- Forwards authorization headers to microservices

### Error Handling
- Proper HTTP status codes (404, 401, 500, etc.)
- Detailed error messages
- Service unavailability detection

### Health Monitoring
```bash
# Check if all services are running
GET /api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-08-29T10:30:00Z",
  "services": [
    { "service": "auth", "status": "healthy", "url": "http://localhost:3000" },
    { "service": "users", "status": "healthy", "url": "http://localhost:3001" },
    { "service": "jobs", "status": "healthy", "url": "http://localhost:3002" },
    { "service": "quotations", "status": "healthy", "url": "http://localhost:3004" }
  ]
}
```

## 🛠️ Development

### Start All Services
```bash
# Terminal 1: Auth Service
cd auth-service && npm run start:dev

# Terminal 2: User Service
cd user-service && npm run start:dev

# Terminal 3: Job Service
cd job-service && npm run start:dev

# Terminal 4: Quotation Service
cd quotation-service && npm run start:dev

# Terminal 5: API Gateway
cd api-gateway && npm run start:dev
```

### Frontend Integration
Update your frontend to use the API Gateway:

```javascript
// Before (multiple service URLs)
const authResponse = await fetch('http://localhost:3000/auth/login', ...);
const userResponse = await fetch('http://localhost:3001/users/me', ...);
const jobsResponse = await fetch('http://localhost:3002/jobs', ...);

// After (single gateway URL)
const authResponse = await fetch('http://localhost:8080/api/auth/login', ...);
const userResponse = await fetch('http://localhost:8080/api/users/me', ...);
const jobsResponse = await fetch('http://localhost:8080/api/jobs', ...);
```

## 🔒 Security Features

### CORS Configuration
- Configurable allowed origins
- Credential support
- Preflight request handling

### Rate Limiting
- 100 requests per minute by default
- Configurable per environment

### Security Headers
- Helmet.js integration
- XSS protection
- Content Security Policy

### JWT Validation
- Token signature verification
- Expiration checking
- Automatic token extraction

## 📊 Monitoring & Logging

### Request Logging
All requests are logged with:
- HTTP method and URL
- Response status and time
- User agent information
- Response time in milliseconds

### Health Checks
- Automatic service health monitoring
- Timeout handling (5 seconds default)
- Service availability status

## 🚦 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-production-secret-key

# Production service URLs
AUTH_SERVICE_URL=https://auth-service.workzone.com
USER_SERVICE_URL=https://user-service.workzone.com
JOB_SERVICE_URL=https://job-service.workzone.com
QUOTATION_SERVICE_URL=https://quotation-service.workzone.com

# CORS for production
CORS_ORIGIN=https://app.workzone.com
CORS_CREDENTIALS=true

# Rate limiting for production
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=1000
```

### Build and Start
```bash
npm run build
npm run start:prod
```

## 🎉 Benefits

### For Frontend Developers
- **Single API endpoint** - No need to manage multiple service URLs
- **Simplified authentication** - One login flow for all services
- **Consistent error handling** - Standardized error responses
- **Auto-documentation** - Swagger docs for all endpoints

### for Backend Developers
- **Centralized security** - Authentication logic in one place
- **Request logging** - Monitor all API traffic
- **Service health monitoring** - Know when services are down
- **Easy service addition** - Add new microservices easily

### For DevOps
- **Single entry point** - Easier load balancing and SSL termination
- **Centralized monitoring** - One place to monitor API health
- **Simplified deployment** - Gateway handles service discovery
- **Better security** - Hide internal service URLs from public

## 🔄 Next Steps

1. **Start the API Gateway** with `npm run start:dev`
2. **Update your frontend** to use the gateway URLs
3. **Test all endpoints** using the Swagger documentation
4. **Monitor health** using the health check endpoints
5. **Add rate limiting** and other security features as needed

The API Gateway is now your **single source of truth** for all API interactions! 🎯
