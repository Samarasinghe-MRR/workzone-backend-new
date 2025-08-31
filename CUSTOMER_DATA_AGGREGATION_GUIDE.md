# Customer Data Aggregation - Testing Guide

## Problem Solved ✅
Previously, `GET /users/:id` only returned basic user profile data from the User Service. Now we have comprehensive customer data aggregation that fetches information from all microservices.

## New API Endpoints

### 1. Basic User Data (Original)
```bash
GET http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d
```
**Returns:** Only user profile data from User Service

### 2. Comprehensive Customer Data (NEW) ⭐
```bash
GET http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d/customer-data
```
**Returns:** Complete customer profile with data from all services

### 3. Comprehensive Provider Data (NEW) ⭐
```bash
GET http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d/provider-data
```
**Returns:** Complete provider profile with data from all services

## Example Response Structure

### Customer Data Response
```json
{
  "user": {
    "id": "49979cb5-31ae-46fc-8892-e7972259c40d",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": {
      "id": "customer-role-id",
      "name": "CUSTOMER"
    },
    "customerProfile": {
      "address": "123 Main St, City, State"
    },
    "isActive": true,
    "isVerified": true,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "jobs": {
    "total": 5,
    "posted": [
      {
        "id": "job-1",
        "title": "House Cleaning",
        "description": "Deep cleaning required",
        "status": "OPEN",
        "price": 150.00,
        "location": "New York, NY",
        "createdAt": "2024-01-20T09:00:00Z"
      }
    ],
    "assigned": [
      {
        "id": "job-2", 
        "title": "Garden Maintenance",
        "status": "ASSIGNED",
        "providerId": "provider-123",
        "price": 200.00
      }
    ],
    "completed": [
      {
        "id": "job-3",
        "title": "Plumbing Repair", 
        "status": "COMPLETED",
        "price": 300.00
      }
    ]
  },
  "quotations": {
    "total": 12,
    "received": [
      {
        "id": "quote-1",
        "jobId": "job-1", 
        "providerId": "provider-456",
        "price": 140.00,
        "status": "PENDING",
        "message": "I can do this job professionally",
        "estimatedTime": "2 hours"
      }
    ],
    "accepted": [
      {
        "id": "quote-2",
        "jobId": "job-2",
        "providerId": "provider-123", 
        "price": 200.00,
        "status": "ACCEPTED"
      }
    ],
    "pending": [
      {
        "id": "quote-3",
        "jobId": "job-1",
        "providerId": "provider-789",
        "price": 160.00,
        "status": "PENDING"
      }
    ]
  },
  "statistics": {
    "totalSpent": 500.00,
    "averageJobPrice": 200.00,
    "completionRate": 60.00,
    "responseTime": "4 hours"
  }
}
```

## Testing Steps

### Prerequisites
Make sure all services are running:
```bash
# Terminal 1: Auth Service
cd auth-service && npm run start:dev

# Terminal 2: User Service  
cd user-service && npm run start:dev

# Terminal 3: Job Service
cd job-service && npm run start:dev

# Terminal 4: Quotation Service
cd quotation-service && npm run start:dev
```

### Step 1: Test Basic User Data
```bash
curl -X GET "http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d" \
  -H "Content-Type: application/json"
```

### Step 2: Test Customer Data Aggregation
```bash
curl -X GET "http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d/customer-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Test Provider Data Aggregation
```bash
curl -X GET "http://localhost:3001/users/49979cb5-31ae-46fc-8892-e7972259c40d/provider-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

### Graceful Degradation
If any microservice is down, the system will:
- ✅ Still return user profile data
- ✅ Return empty arrays for unavailable service data
- ✅ Log warnings but not fail completely
- ✅ Include available data from working services

### Example Partial Response (Job Service Down)
```json
{
  "user": { /* full user data */ },
  "jobs": {
    "total": 0,
    "posted": [],
    "assigned": [], 
    "completed": []
  },
  "quotations": {
    "total": 3,
    "received": [ /* quotation data from working service */ ]
  },
  "statistics": {
    "totalSpent": 0,
    "averageJobPrice": 0,
    "completionRate": 0,
    "responseTime": "N/A"
  }
}
```

## Integration Points

### Job Service Integration
- `GET /jobs/customer/:customerId` - Fetch customer's jobs
- `GET /jobs/provider/:providerId` - Fetch provider's assigned jobs

### Quotation Service Integration  
- `GET /quotation/customer/jobs/:jobId/quotes` - Fetch quotes for job
- `GET /quotation/provider/quotes` - Fetch provider's submitted quotes
- `GET /quotation/provider/metrics` - Fetch provider performance metrics

## Benefits

### 1. Single API Call
- **Before:** Multiple API calls to different services
- **After:** One call gets everything

### 2. Frontend Efficiency
```javascript
// Before: Multiple requests
const user = await fetch('/users/123');
const jobs = await fetch('/jobs/customer/123'); 
const quotes = await fetch('/quotations/customer/jobs/job1/quotes');

// After: Single request
const customerData = await fetch('/users/123/customer-data');
```

### 3. Consistent Data Structure
- Standardized response format across all user types
- Predictable error handling
- Clean separation of concerns

### 4. Performance Optimization
- Parallel fetching from all services
- Timeout handling (5 seconds per service)
- Graceful degradation if services are down

## Monitoring

### Service Health Check
Test if all required services are accessible:
```bash
# Check User Service
curl http://localhost:3001/health

# Check Job Service  
curl http://localhost:3002/health

# Check Quotation Service
curl http://localhost:3004/health
```

### Response Time Monitoring
The aggregation service includes timing for performance monitoring:
- Each service call has a 5-second timeout
- Failed calls are logged with error details
- Response times can be tracked for optimization

## Future Enhancements

### 1. Caching Layer
```typescript
// Add Redis caching for frequently accessed customer data
@Injectable()
export class CustomerDataAggregationService {
  async getCustomerAggregatedData(userId: string) {
    const cached = await this.redis.get(`customer:${userId}`);
    if (cached) return JSON.parse(cached);
    
    const data = await this.fetchFromServices(userId);
    await this.redis.setex(`customer:${userId}`, 300, JSON.stringify(data)); // 5 min cache
    return data;
  }
}
```

### 2. Real-time Updates
```typescript
// WebSocket notifications when customer data changes
@Injectable()
export class CustomerDataEventHandler {
  @EventPattern('job.created')
  async handleJobCreated(data: any) {
    // Invalidate cache for customer
    await this.invalidateCustomerCache(data.customerId);
    // Emit real-time update to frontend
    this.websocketGateway.emitToUser(data.customerId, 'customer-data-updated');
  }
}
```

### 3. Analytics Dashboard
```typescript
// Add analytics endpoints
@Get(':id/analytics')
async getCustomerAnalytics(@Param('id') id: string) {
  return {
    spendingTrends: await this.getSpendingTrends(id),
    preferredServices: await this.getPreferredServices(id), 
    responseTimeAnalytics: await this.getResponseTimeAnalytics(id),
    providerRatings: await this.getProviderRatings(id)
  };
}
```

## Security Considerations

### Authentication
- JWT token validation for sensitive endpoints
- Service-to-service communication security
- Rate limiting for aggregation endpoints

### Data Privacy
- Only return data that the requesting user is authorized to see
- Mask sensitive information in cross-service calls
- Audit logging for data access

---

## ✅ Solution Complete

Your customer data aggregation system is now ready! The endpoint `http://localhost:3001/users/:id/customer-data` will return comprehensive customer information from all microservices in a single API call.
