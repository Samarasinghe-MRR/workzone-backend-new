# WorkZone Job Service - cURL Testing Commands
# Base URL: http://localhost:3002

# 1. Health Check (No Auth Required)
curl -X GET "http://localhost:3002/health"

# 2. Get All Jobs (No Auth Required)
curl -X GET "http://localhost:3002/jobs?page=1&limit=10"

# 3. Create Job (Auth Required)
curl -X POST "http://localhost:3002/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Fix Kitchen Plumbing",
    "description": "Kitchen sink is leaking and needs urgent repair",
    "category": "Plumbing",
    "location": "Downtown Area",
    "location_lat": 40.7128,
    "location_lng": -74.0060,
    "budget_min": 100.00,
    "budget_max": 300.00,
    "priority": "HIGH",
    "job_type": "ONE_TIME",
    "deadline": "2025-09-01T10:00:00Z",
    "requirements": ["Licensed plumber", "Available weekends"]
  }'

# 4. Get Job by ID (No Auth Required)
curl -X GET "http://localhost:3002/jobs/JOB_ID_HERE"

# 5. Get My Jobs (Auth Required)
curl -X GET "http://localhost:3002/jobs/my-jobs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6. Get Assigned Jobs (Auth Required)
curl -X GET "http://localhost:3002/jobs/assigned-jobs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. Update Job (Auth Required)
curl -X PATCH "http://localhost:3002/jobs/JOB_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "OPEN",
    "budget_max": 350.00,
    "description": "Updated description with more details"
  }'

# 8. Assign Job to Provider (Auth Required)
curl -X POST "http://localhost:3002/jobs/JOB_ID_HERE/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceProviderId": "provider-user-id-123",
    "quoteAmount": 250.00,
    "estimatedDuration": "2 hours"
  }'

# 9. Complete Job (Auth Required)
curl -X POST "http://localhost:3002/jobs/JOB_ID_HERE/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 10. Delete Job (Auth Required)
curl -X DELETE "http://localhost:3002/jobs/JOB_ID_HERE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 11. Search Jobs by Location (No Auth Required)
curl -X GET "http://localhost:3002/jobs?lat=40.7128&lng=-74.0060&radius=10&category=Plumbing"

# 12. Filter Jobs by Budget (No Auth Required)
curl -X GET "http://localhost:3002/jobs?minBudget=100&maxBudget=500&status=OPEN"

# 13. Search with Pagination (No Auth Required)
curl -X GET "http://localhost:3002/jobs?page=2&limit=5&priority=HIGH"

# Note: Replace YOUR_JWT_TOKEN with actual JWT token from Auth Service
# Note: Replace JOB_ID_HERE with actual job ID from create job response
