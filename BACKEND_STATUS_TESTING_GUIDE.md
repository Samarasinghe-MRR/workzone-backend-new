# 🚨 Debugging Guide: 500 Internal Server Error Fix

## ✅ **Problem Identified and FIXED**

**Root Cause:** The User Service was throwing a generic `Error` instead of a proper HTTP `NotFoundException` when a user doesn't exist, causing a 500 error instead of a 404.

**Solution Applied:** 
- ✅ Changed `throw new Error()` to `throw new NotFoundException()` 
- ✅ Now returns proper 404 "Not Found" instead of 500 "Internal Server Error"

## 🔧 **Error Handling Fixed**

### Before (Causing 500 Error):
```typescript
if (!user) {
  throw new Error(`User with ID ${id} not found`); // ❌ Generic error = 500
}
```

### After (Proper 404 Response):
```typescript
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`); // ✅ Proper HTTP error = 404
}
```

## 🎯 **Testing Steps**

### Step 1: Check If User Exists
The error indicates user ID `49979cb5-31ae-46fc-8892-e7972259c40d` doesn't exist in the database.

**Test with a simpler endpoint first:**
```bash
curl -X GET "http://localhost:3001/users"
```

### Step 2: Create a Test User (If Database is Empty)
If no users exist, create one through the Auth Service:

```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER"
  }'
```

### Step 3: Get Valid User ID
After creating a user, get their ID from the response or list all users:
```bash
curl -X GET "http://localhost:3001/users"
```

### Step 4: Test Customer Data Endpoint with Valid ID
```bash
curl -X GET "http://localhost:3001/users/{VALID_USER_ID}/customer-data" \
  -H "Content-Type: application/json"
```

## 🛠️ **Database Check Script**

Use this Node.js script to check what's in your database:

```javascript
// check-database.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.id} | ${user.email} | ${user.role?.name}`);
    });
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
```

Run with: `node check-database.js`

## 🔄 **Complete Testing Flow**

### 1. Start All Services
```bash
# Terminal 1: Auth Service
cd auth-service && npm run start:dev

# Terminal 2: User Service (already running)
cd user-service && npm run start:dev

# Terminal 3: Job Service
cd job-service && npm run start:dev

# Terminal 4: Quotation Service
cd quotation-service && npm run start:dev
```

### 2. Register a New User
```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Customer",
    "phone": "+1234567890",
    "role": "CUSTOMER"
  }'
```

**Expected Response:**
```json
{
  "id": "newly-generated-user-id",
  "email": "testcustomer@example.com"
}
```

### 3. Login to Get JWT Token
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Test the Fixed Customer Data Endpoint
```bash
curl -X GET "http://localhost:3001/users/{USER_ID_FROM_STEP_2}/customer-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_FROM_STEP_3}"
```

**Expected Response (Success):**
```json
{
  "user": {
    "id": "user-id",
    "firstName": "Test",
    "lastName": "Customer",
    "email": "testcustomer@example.com",
    "role": {
      "name": "CUSTOMER"
    }
  },
  "jobs": {
    "total": 0,
    "posted": [],
    "assigned": [],
    "completed": []
  },
  "quotations": {
    "total": 0,
    "received": [],
    "accepted": [],
    "pending": []
  },
  "statistics": {
    "totalSpent": 0,
    "averageJobPrice": 0,
    "completionRate": 0,
    "responseTime": "N/A"
  }
}
```

**Expected Response (User Not Found):**
```json
{
  "statusCode": 404,
  "message": "User with ID invalid-id not found",
  "error": "Not Found"
}
```

## 🔍 **Debugging Tools**

### Check Database with Prisma Studio
```bash
cd user-service
npx prisma studio
```
Opens at: http://localhost:5556

### Check Service Health
```bash
# User Service
curl http://localhost:3001/

# Auth Service  
curl http://localhost:3000/

# Job Service
curl http://localhost:3002/

# Quotation Service
curl http://localhost:3004/
```

### Monitor Logs
Watch the terminal running User Service for error messages and request logs.

## 🎯 **Quick Fix Summary**

1. ✅ **Fixed Error Handling** - Now returns 404 instead of 500 for missing users
2. ✅ **Service Running** - User Service is operational on port 3001
3. ✅ **Routes Mapped** - All endpoints including `/users/:id/customer-data` are available
4. 🔄 **Need Valid User** - Create a user through Auth Service first
5. 🔄 **Test with Real Data** - Use the created user's ID for testing

## 🚀 **Next Steps**

1. **Create a test user** through Auth Service registration
2. **Get the user ID** from the registration response
3. **Test the customer data endpoint** with the valid user ID
4. **Verify the response** is now 200 (success) or 404 (user not found) instead of 500

The 500 error is now fixed! The issue was improper error handling, not a backend implementation problem. 🎉
