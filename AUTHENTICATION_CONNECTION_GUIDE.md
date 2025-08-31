# Authentication Flow - Connecting Auth Service and User Service

## 🔑 Problem Solved: How Auth Service and User Service Connect

Your question about how Auth Service (login) and User Service (data) connect is **crucial for microservices architecture**. Here's the complete solution:

## 🏗️ Authentication Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth Service  │    │   User Service  │
│   (React/Next)  │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login Request      │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 2. JWT Token          │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 3. API Request + JWT  │                       │
         ├───────────────────────┼──────────────────────►│
         │                       │                       │
         │                       │ 4. Decode JWT         │
         │                       │                       │◄─┐
         │                       │                       │  │
         │ 5. User-Specific Data │                       │  │
         │◄──────────────────────┼───────────────────────┤  │
         │                       │                       │  │
```

## 🔐 JWT Token Structure

When a user logs in through Auth Service, they receive a JWT token containing:

```json
{
  "sub": "49979cb5-31ae-46fc-8892-e7972259c40d",  // User ID
  "role": "CUSTOMER",                              // User Role
  "iat": 1703875200,                              // Issued At
  "exp": 1703878800                               // Expires At
}
```

## 🎯 New Authentication-Aware Endpoints

### 1. Get Current User Profile
```bash
GET /users/me
Authorization: Bearer <JWT_TOKEN>
```

**How it works:**
1. Extract JWT token from Authorization header
2. Decode token to get user ID and role
3. Return user's profile data

### 2. Get Role-Specific Dashboard
```bash
GET /users/me/dashboard
Authorization: Bearer <JWT_TOKEN>
```

**Returns different data based on user role:**
- **CUSTOMER:** Job postings, received quotations, spending statistics
- **SERVICE_PROVIDER:** Assigned jobs, submitted quotes, earnings
- **ADMIN:** System-wide statistics and user management data

## 💡 Frontend Integration Examples

### React/Next.js Login Flow
```typescript
// 1. Login through Auth Service
const loginUser = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const { access_token } = await response.json();
  
  // Store token in localStorage or cookies
  localStorage.setItem('token', access_token);
  
  return access_token;
};

// 2. Get current user data from User Service
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};

// 3. Get role-specific dashboard data
const getDashboardData = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/users/me/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Angular Service Example
```typescript
@Injectable()
export class AuthService {
  private baseUrl = 'http://localhost:3000/auth';
  private userUrl = 'http://localhost:3001/users';
  
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap(response => localStorage.setItem('token', response.access_token))
      );
  }
  
  getCurrentUser(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    return this.http.get(`${this.userUrl}/me`, { headers });
  }
  
  getDashboard(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    return this.http.get(`${this.userUrl}/me/dashboard`, { headers });
  }
}
```

## 🛠️ Implementation Details

### JWT Utility Service
Created `JwtUtilService` in User Service that:
- Decodes JWT tokens to extract user information
- Validates token expiration
- Extracts user ID and role for authorization

### Enhanced User Controller
New endpoints that automatically:
- Extract user info from JWT token
- Return personalized data based on user identity
- Handle role-based access to different data

## 🚀 Testing the Authentication Flow

### Step 1: Login via Auth Service
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 2: Get Current User Data
```bash
curl -X GET "http://localhost:3001/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Get Dashboard Data
```bash
curl -X GET "http://localhost:3001/users/me/dashboard" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔒 Security Features

### Token Validation
- JWT signature verification
- Expiration checking
- Role-based access control

### Error Handling
```typescript
// Invalid token response
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}

// Missing authorization header
{
  "statusCode": 401,
  "message": "Authorization header is required",
  "error": "Unauthorized"
}
```

## 🎨 Frontend Dashboard Examples

### Customer Dashboard Component
```typescript
const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      const data = await getDashboardData();
      setDashboardData(data);
    };
    
    fetchDashboard();
  }, []);
  
  if (!dashboardData) return <Loading />;
  
  return (
    <div>
      <h1>Welcome, {dashboardData.user.firstName}!</h1>
      
      <div className="stats">
        <div>Total Jobs Posted: {dashboardData.jobs.total}</div>
        <div>Total Spent: ${dashboardData.statistics.totalSpent}</div>
        <div>Completion Rate: {dashboardData.statistics.completionRate}%</div>
      </div>
      
      <div className="recent-jobs">
        <h2>Recent Jobs</h2>
        {dashboardData.jobs.posted.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      
      <div className="recent-quotes">
        <h2>Recent Quotations</h2>
        {dashboardData.quotations.received.map(quote => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
};
```

### Service Provider Dashboard Component
```typescript
const ProviderDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      const data = await getDashboardData();
      setDashboardData(data);
    };
    
    fetchDashboard();
  }, []);
  
  return (
    <div>
      <h1>Provider Dashboard - {dashboardData?.user.firstName}</h1>
      
      <div className="provider-stats">
        <div>Jobs Completed: {dashboardData?.jobs.completed.length}</div>
        <div>Total Earnings: ${dashboardData?.statistics.totalEarned}</div>
        <div>Average Rating: {dashboardData?.statistics.averageRating}⭐</div>
      </div>
      
      <div className="assigned-jobs">
        <h2>Current Assignments</h2>
        {dashboardData?.jobs.assigned.map(job => (
          <AssignedJobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};
```

## ✅ Benefits of This Architecture

### 1. **Seamless User Experience**
- Single login provides access to all user data
- Role-based dashboards show relevant information
- No need for multiple authentication steps

### 2. **Security**
- JWT tokens contain user identity and permissions
- Each microservice can validate tokens independently
- Centralized authentication with distributed authorization

### 3. **Scalability**
- Auth Service handles authentication logic
- User Service handles user data and relationships
- Other services can follow the same pattern

### 4. **Frontend Simplicity**
```typescript
// Instead of complex user management:
const user = await getCurrentUser();        // Gets current user automatically
const dashboard = await getDashboard();     // Gets role-specific data

// No need to manually pass user IDs or handle role logic in frontend
```

## 🔄 Complete Flow Summary

1. **User logs in** → Auth Service validates credentials
2. **Auth Service returns JWT** → Contains user ID and role
3. **Frontend stores JWT** → In localStorage/cookies
4. **API requests include JWT** → In Authorization header
5. **User Service decodes JWT** → Extracts user identity
6. **Returns personalized data** → Based on user ID and role

This architecture ensures that **after login, all services know who the user is** and can provide personalized, role-specific data automatically! 🎯
