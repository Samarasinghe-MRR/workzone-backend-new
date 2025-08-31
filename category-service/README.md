# Category Service - WorkZone Platform

The Category Service manages service categories that are used across the WorkZone platform. It provides a centralized way to manage, organize, and distribute category data to other microservices.

## 🎯 Purpose

**Why we DON'T need a complex Auth Module:**
- ✅ We have a **separate Auth Service** that handles authentication logic
- ✅ Category Service only needs **JWT token validation** for admin endpoints
- ✅ Simple approach: Extract token, validate, check admin role

**What Category Service provides:**
- 📂 Centralized category management
- 🏗️ Hierarchical category structure (parent/child)
- 🔒 Admin-only category modifications
- 📡 Event-driven notifications to other services
- 🔍 Search and filtering capabilities

## 🏗️ Architecture

### Database Schema
```prisma
model Category {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  parentId    String?
  isActive    Boolean    @default(true)
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### JWT Validation (Simple Approach)
```typescript
// No complex Auth Module needed - just simple token validation
@Injectable()
export class JwtUtilService {
  validateAdminToken(token: string): TokenPayload {
    const userInfo = this.validateTokenAndGetUser(token);
    if (userInfo.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return userInfo;
  }
}
```

## 📡 API Endpoints

### Public Endpoints (No Authentication)
```
GET /categories              # Get all active categories
GET /categories/tree         # Get categories in tree structure  
GET /categories/search?q=    # Search categories
GET /categories/:id          # Get category by ID
```

### Admin Endpoints (JWT Required)
```
POST /categories             # Create category
PATCH /categories/:id        # Update category
DELETE /categories/:id       # Delete (soft delete)
```

## 🔄 Integration with Other Services

### User Service Integration
```typescript
// User Service stores provider specializations
model UserCategory {
  userId     String
  categoryId String  // References Category Service
}
```

### Job Service Integration  
```typescript
// Job Service links jobs to categories
model Job {
  categoryId String  // References Category Service
  // ... other fields
}
```

### Event Flow
```
Category Created/Updated/Deleted
        ↓
RabbitMQ (category_events)
        ↓
User Service, Job Service (consume events)
        ↓
Update cached category data or UI
```

## 🚀 Getting Started

1. **Install Dependencies**
```bash
cd category-service
npm install
```

2. **Setup Database**
```bash
# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env
# Run migrations
npm run prisma:generate
npm run migrate

# Seed default categories
npm run db:seed
```

3. **Start Service**
```bash
npm run start:dev
```

Service will run on port 3005 with Swagger docs at `/api/docs`

## 🔐 Security Approach

**Simple JWT Validation (No Auth Module):**
- ✅ Extract token from Authorization header
- ✅ Validate token using same secret as Auth Service  
- ✅ Check user role for admin operations
- ✅ No duplicate authentication logic

**Benefits:**
- 🎯 **Single Responsibility**: Category Service focuses on categories
- 🔄 **Loose Coupling**: No tight coupling with Auth Service implementation
- 🚀 **Simple Maintenance**: Easy to understand and modify
- 📈 **Scalable**: Can easily add more validation rules

## 📊 Default Categories Seeded

The service comes with pre-seeded categories:
- 🔧 **Home Services**: Plumbing, Electrical, Carpentry, Painting
- 💻 **Technology**: Computer Repair, Network Setup, Software Installation
- 🧹 **Cleaning**: House Cleaning, Deep Cleaning, Carpet Cleaning
- 🌿 **Landscaping**: Lawn Mowing, Garden Design, Tree Services
- 👥 **Personal Care**: Elderly Care, Childcare, Pet Care, Tutoring
- 📦 **Moving & Delivery**: Local Moving, Furniture Delivery, Package Delivery

Each category includes relevant subcategories for better organization.

## 🎉 Summary

**No Auth Module needed!** 
- We have a dedicated Auth Service for authentication
- Category Service only needs simple JWT validation for admin endpoints
- Clean separation of concerns
- Easy to maintain and scale
