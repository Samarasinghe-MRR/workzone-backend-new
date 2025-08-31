# Quotation Service API Testing Guide

## Overview
The Quotation Service handles provider quote submissions and customer quote acceptance/rejection. It communicates with the Job Service through RabbitMQ events.

## Service Configuration
- **Port**: 3004
- **Database**: PostgreSQL (quotation_db)
- **Authentication**: JWT Bearer tokens

## Test JWT Token
Use the same JWT token from Job Service or generate new ones:

```javascript
// For testing, you can use this sample JWT payload:
{
  "userId": "user123",
  "email": "test@example.com", 
  "userType": "provider", // or "customer"
  "role": "user"
}
```

## API Endpoints

### 1. Provider Endpoints

#### Submit Quote (POST /quotation/provider/quotes)
```bash
curl -X POST http://localhost:3004/quotation/provider/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "job_id": "job123",
    "price": 150.00,
    "estimated_duration": "2-3 hours",
    "description": "I can complete this cleaning job professionally",
    "proposed_start": "2024-01-15T09:00:00Z",
    "valid_until": "2024-01-20T23:59:59Z",
    "materials_included": true,
    "eco_friendly": true,
    "notes": "Will bring eco-friendly supplies"
  }'
```

#### Get Provider's Quotes (GET /quotation/provider/quotes)
```bash
curl -X GET "http://localhost:3004/quotation/provider/quotes?status=PENDING" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Quote (PUT /quotation/provider/quotes/:id)
```bash
curl -X PUT http://localhost:3004/quotation/provider/quotes/quote123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price": 140.00,
    "description": "Updated quote with better pricing",
    "notes": "Reduced price to be more competitive"
  }'
```

#### Cancel Quote (DELETE /quotation/provider/quotes/:id)
```bash
curl -X DELETE http://localhost:3004/quotation/provider/quotes/quote123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Provider Metrics (GET /quotation/provider/metrics)
```bash
curl -X GET http://localhost:3004/quotation/provider/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Customer Endpoints

#### Get Quotes for Job (GET /quotation/customer/jobs/:jobId/quotes)
```bash
curl -X GET http://localhost:3004/quotation/customer/jobs/job123/quotes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Accept Quote (POST /quotation/customer/quotes/:id/accept)
```bash
curl -X POST http://localhost:3004/quotation/customer/quotes/quote123/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_notes": "Looks good, please proceed as quoted"
  }'
```

#### Reject Quote (POST /quotation/customer/quotes/:id/reject)
```bash
curl -X POST http://localhost:3004/quotation/customer/quotes/quote123/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_notes": "Price is too high, looking for better options"
  }'
```

#### Get Quote Details (GET /quotation/customer/quotes/:id)
```bash
curl -X GET http://localhost:3004/quotation/customer/quotes/quote123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Scenarios

### Scenario 1: Complete Quote Workflow
1. **Provider submits quote** → Creates quote with PENDING status
2. **Customer reviews quotes** → Gets all quotes for job
3. **Customer accepts quote** → Triggers job assignment in Job Service
4. **Other quotes auto-rejected** → All other pending quotes for job become REJECTED

### Scenario 2: Quote Competition
1. **Multiple providers submit quotes** for same job
2. **Customer compares quotes** by price, timeline, eco-friendly options
3. **Customer accepts best quote** → Winner gets job, others rejected

### Scenario 3: Quote Expiration
1. **Provider sets valid_until date** on quote
2. **Quote expires** → Status automatically changes to EXPIRED
3. **Customer cannot accept expired quotes**

### Scenario 4: Job Cancellation
1. **Job gets cancelled** in Job Service
2. **Event triggers quote cancellation** → All pending quotes become CANCELLED
3. **Providers receive notification** via event system

## RabbitMQ Events

### Events Published by Quotation Service:
- `quote.submitted` - When provider submits new quote
- `quote.accepted` - When customer accepts quote (triggers job assignment)
- `quote.rejected` - When customer rejects quote
- `quote.cancelled` - When quote is cancelled

### Events Consumed by Quotation Service:
- `job.created` - New job available for quotes
- `job.cancelled` - Cancel all pending quotes for job
- `job.updated` - Job details changed

## Database Schema Validation

### Check if quotations table exists:
```sql
-- Connect to quotation_db
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'quotations';
```

### Sample data insertion:
```sql
INSERT INTO quotations (
  id, job_id, provider_id, provider_email, price, 
  estimated_duration, description, status, created_at
) VALUES (
  'quote123', 'job123', 'provider456', 'provider@example.com', 
  150.00, '2-3 hours', 'Professional cleaning service', 'PENDING', NOW()
);
```

## Error Cases to Test

### 1. Duplicate Quote Submission
```bash
# Submit same quote twice - should return 400 error
curl -X POST http://localhost:3004/quotation/provider/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"job_id": "job123", "price": 150.00, "description": "Duplicate quote"}'
```

### 2. Accept Expired Quote
```bash
# Try to accept quote past valid_until date - should return 400 error
curl -X POST http://localhost:3004/quotation/customer/quotes/expired_quote_id/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Unauthorized Access
```bash
# Try to update another provider's quote - should return 403 error
curl -X PUT http://localhost:3004/quotation/provider/quotes/other_provider_quote \
  -H "Authorization: Bearer DIFFERENT_PROVIDER_TOKEN" \
  -d '{"price": 100.00}'
```

## Integration Testing with Job Service

### 1. Verify Event Communication
1. **Start both services** (Job Service on 3002, Quotation Service on 3004)
2. **Create job** in Job Service
3. **Submit quote** in Quotation Service  
4. **Accept quote** in Quotation Service
5. **Check job status** in Job Service → should show assigned provider

### 2. Cross-Service Data Consistency
1. **Job cancellation** should cancel all quotes
2. **Quote acceptance** should update job assignment
3. **Provider metrics** should reflect quote activity

## Monitoring and Debugging

### Check Service Health
```bash
curl -X GET http://localhost:3004/health
```

### Database Connection Test
```bash
# Check if Prisma can connect to database
npx prisma db push --preview-feature
```

### Event Queue Monitoring
- Check RabbitMQ management interface
- Monitor quote-related queues and exchanges
- Verify event message delivery

## Next Steps
1. **Set up automated tests** using Jest
2. **Create Postman collection** for easier testing
3. **Add performance testing** for high quote volumes
4. **Implement quote analytics** dashboard
5. **Add real-time notifications** for quote updates
