# 🎯 Enhanced Quotation Service: Geolocation-Based Provider Matching

## 📋 Schema Changes Overview

### ✅ **New Models Added**

#### 1. `JobQuotationInvite` - Track Provider Invitations
```prisma
- Tracks which providers were invited to quote on specific jobs
- Includes distance from job location to provider
- Manages invitation lifecycle (invited → responded/ignored/expired)
- One invitation per provider per job (unique constraint)
```

#### 2. `JobEligibilityCriteria` - Job-Specific Requirements
```prisma
- Stores criteria for provider matching per job
- Geographic constraints (lat/lng, max distance)
- Special requirements (tools, eco-friendly, emergency)
- Controls invitation behavior (max providers, expiry time)
```

### 🔄 **Enhanced Models**

#### `Quotation` Model Updates:
- ✅ Added `invite_id` to link quotes back to invitations
- ✅ Added `response_time_hours` for analytics
- ✅ Added relation to `JobQuotationInvite`

#### `QuoteEvent` Model Updates:
- ✅ Structured event types with enum (`EventType`)
- ✅ Added `invite_id` field for invitation events
- ✅ Support for new event types: `QUOTE_INVITED`, `INVITE_EXPIRED`, `PROVIDER_IGNORED`

#### `QuotationMetrics` Model Updates:
- ✅ Invitation tracking metrics (`total_invites`, `response_rate`)
- ✅ Geographic metrics (`average_distance_km`)
- ✅ Enhanced performance tracking
- ✅ Unique constraint per provider

---

## 🔄 **Updated Event Flow**

### **1. Job Posted → Provider Matching**
```typescript
// When job is created
1. Customer posts job → `job.created` event
2. Quotation Service receives event
3. Creates JobEligibilityCriteria record
4. Queries User Service: GET /providers?category=plumbing&lat=6.9271&lng=79.8612&radius=5km
5. Filters eligible providers based on criteria
6. Creates JobQuotationInvite records for each eligible provider
7. Emits QUOTE_INVITED events
```

### **2. Provider Response Flow**
```typescript
// Provider submits quote
1. Provider sees invitation → submits quote
2. Creates Quotation record with invite_id
3. Updates JobQuotationInvite (responded=true, status=RESPONDED)
4. Updates QuotationMetrics for provider
5. Emits QUOTE_SUBMITTED event
```

### **3. Invitation Expiry Handling**
```typescript
// Background job checks for expired invitations
1. Find invitations where expires_at < now() AND status = INVITED
2. Update status to EXPIRED
3. Update QuotationMetrics (ignored_invites++)
4. Emit INVITE_EXPIRED events
```

---

## 🎯 **Benefits of New Schema**

### **1. Precise Provider Targeting**
- Only nearby providers get invitations
- Reduces noise for providers outside service area
- Improves customer response times

### **2. Rich Analytics & Insights**
```sql
-- Provider performance metrics
SELECT 
  provider_id,
  response_rate,
  success_rate,
  average_response_time_hours,
  average_distance_km
FROM quotation_metrics;

-- Job invitation effectiveness
SELECT 
  job_id,
  COUNT(*) as providers_invited,
  COUNT(CASE WHEN responded = true THEN 1 END) as responses_received,
  AVG(distance_km) as avg_distance
FROM job_quotation_invites
GROUP BY job_id;
```

### **3. Better User Experience**
- Customers get faster responses from nearby providers
- Providers only see relevant jobs they can actually service
- System learns provider behavior for better matching

### **4. Scalable Architecture**
- Event-driven design supports growth
- Clear separation of concerns
- Rich data for ML/AI improvements

---

## 🛠️ **API Endpoints Needed**

### **User Service Integration**
```typescript
// Get nearby providers
GET /api/providers/nearby?category={category}&lat={lat}&lng={lng}&radius={km}&limit={n}

// Get provider details
GET /api/providers/{providerId}/profile
```

### **Quotation Service New Endpoints**
```typescript
// Provider sees their invitations
GET /api/quotations/invitations?providerId={id}&status=INVITED

// Provider responds to invitation
POST /api/quotations/invitations/{inviteId}/respond

// Customer sees invitation results
GET /api/quotations/jobs/{jobId}/invitations

// Analytics
GET /api/quotations/metrics/providers/{providerId}
GET /api/quotations/metrics/jobs/{jobId}
```

---

## 📊 **Sample Event Payloads**

### `QUOTE_INVITED` Event:
```json
{
  "event_type": "QUOTE_INVITED",
  "invite_id": "inv-123",
  "job_id": "job-456",
  "provider_id": "prov-789",
  "customer_id": "cust-101",
  "payload": {
    "job_title": "Kitchen Plumbing Repair",
    "job_category": "plumbing",
    "distance_km": 2.5,
    "expires_at": "2025-08-31T07:00:00Z",
    "job_location": "Colombo 07",
    "estimated_budget": 5000
  }
}
```

### `QUOTE_SUBMITTED` Event:
```json
{
  "event_type": "QUOTE_SUBMITTED",
  "quote_id": "quote-111",
  "invite_id": "inv-123",
  "job_id": "job-456",
  "provider_id": "prov-789",
  "customer_id": "cust-101",
  "payload": {
    "price": 4500,
    "estimated_time": "2 hours",
    "proposed_start": "2025-08-30T14:00:00Z",
    "response_time_hours": 3
  }
}
```

---

✅ **Next Steps:**
1. Run `prisma generate` to update the client
2. Create migration: `prisma migrate dev --name add-invitation-system`
3. Update Quotation Service logic to implement the new flow
4. Add API endpoints for invitation management
5. Implement background jobs for invitation expiry
