# Microservices Authentication Architecture

## Current vs Recommended Approach

### Current Approach (Duplicated Auth Logic)
```
Client → [JWT Token] → Quotation Service → Local JWT Validation
```

### Recommended Approach (Centralized Auth Service)
```
Client → [JWT Token] → API Gateway → Auth Service (validate) → Quotation Service
```

## Better Architecture Options

### Option 1: API Gateway Pattern
```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│   Client    │───▶│ API Gateway │───▶│  Auth Service   │
└─────────────┘    │             │    │                 │
                   │             │    │ - JWT Validate  │
                   │             │    │ - User Context  │
                   │             │    └─────────────────┘
                   │             │              │
                   │             │              ▼
                   │             │    ┌─────────────────┐
                   │             │───▶│ Quotation Svc   │
                   │             │    │                 │
                   │             │    │ - No Auth Logic │
                   │             │    │ - Trust Gateway │
                   └─────────────┘    └─────────────────┘
```

### Option 2: Service-to-Service Auth Validation
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │───▶│ Quotation Svc   │───▶│  Auth Service   │
└─────────────┘    │                 │    │                 │
                   │ - Receive JWT   │    │ - Validate JWT  │
                   │ - Forward to    │    │ - Return User   │
                   │   Auth Service  │    │   Context       │
                   │ - Get User Info │    └─────────────────┘
                   └─────────────────┘
```

### Option 3: Shared JWT Validation Library
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Job Service   │    │ Quotation Svc   │    │   User Service  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Shared Auth  │ │    │ │Shared Auth  │ │    │ │Shared Auth  │ │
│ │Library/NPM  │ │    │ │Library/NPM  │ │    │ │Library/NPM  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Recommended Implementation

### Step 1: Create Shared Auth Client Service
```typescript
// shared-auth.service.ts
@Injectable()
export class SharedAuthService {
  constructor(private readonly httpService: HttpService) {}

  async validateToken(token: string): Promise<UserContext> {
    try {
      const response = await this.httpService.post(
        'http://auth-service:3001/auth/validate',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      ).toPromise();
      
      return response.data.user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### Step 2: Auth Service Validation Endpoint
```typescript
// auth-service/src/auth/auth.controller.ts
@Post('validate')
async validateToken(@Request() req): Promise<{ user: UserContext }> {
  const user = req.user; // Already validated by JWT strategy
  return { user };
}
```

### Step 3: Update Quotation Service Guard
```typescript
// quotation-service/src/auth/guards/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sharedAuthService: SharedAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const user = await this.sharedAuthService.validateToken(token);
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## Benefits of Centralized Auth

### ✅ Advantages
- **Single Source of Truth**: All authentication logic in one place
- **Consistency**: Same validation rules across all services
- **Security**: Centralized security updates and patches
- **Maintainability**: Update auth logic in one place
- **Compliance**: Easier to audit and ensure security standards
- **Token Management**: Centralized token revocation and refresh

### ⚠️ Considerations
- **Network Latency**: Additional service call for each request
- **Dependency**: Quotation service depends on Auth service availability
- **Complexity**: More moving parts in the system

## Implementation Options for Your Project

### Option A: Keep Current Approach (Simpler for Development)
- Good for development and testing
- Each service validates JWT independently
- No additional network calls

### Option B: Implement Centralized Auth (Production Ready)
- Better microservices architecture
- More scalable and maintainable
- Requires API Gateway or service mesh

### Option C: Hybrid Approach
- Use shared JWT validation library
- Validate tokens locally but with shared logic
- Best of both worlds
