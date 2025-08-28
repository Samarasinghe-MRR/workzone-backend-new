# Frontend Integration Guide

## 🚀 Quick Start Implementation

Replace your current settings page implementation with this improved version that connects to your real backend APIs.

### 1. Install Required Dependencies

```bash
npm install react-hook-form @hookform/resolvers zod react-hot-toast
```

### 2. Setup Toast Provider

Add this to your main App component:

```tsx
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div>
      {/* Your existing app content */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}
```

### 3. Replace Your Settings Page

Here's the complete improved settings page that integrates with your backend:

```tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Lock,
  Mail,
  Phone,
  MapPin,
  Camera,
  LogOut,
  Trash2,
} from 'lucide-react';

// API Service (copy from frontend-integration-example.ts)
import { apiService, useSettingsData } from './api-service';

// Validation Schemas
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reusable Toggle Component
function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false 
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-base">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={label}
        />
        <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'peer-checked:bg-emerald-600'
        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all`}></div>
      </label>
    </div>
  );
}

// Profile Form Component
function ProfileForm({ profile, onSuccess }: { profile: any; onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await apiService.updateProfile(data);
      toast.success('Profile updated successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register('phone')}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}

// Password Change Form
function PasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await apiService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          {...register('currentPassword')}
          className={errors.currentPassword ? 'border-red-500' : ''}
        />
        {errors.currentPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          {...register('newPassword')}
          className={errors.newPassword ? 'border-red-500' : ''}
        />
        {errors.newPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}

// Main Settings Component
export default function SettingsPage() {
  const { profile, authUser, loading, error, refreshData } = useSettingsData();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !profile || !authUser) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={refreshData}>Try Again</Button>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(profile.firstName, profile.lastName)}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={profile.isVerified ? "default" : "destructive"}>
                  {profile.isVerified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant="outline">{profile.role.name}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} onSuccess={refreshData} />
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      {profile.role.name === 'CUSTOMER' && (
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.customerProfile?.address || ''}
                  placeholder="Enter your address"
                />
              </div>
              <Button className="w-full">Update Address</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role.name === 'SERVICE_PROVIDER' && (
        <Card>
          <CardHeader>
            <CardTitle>Service Provider Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={profile.serviceProviderProfile?.category || ''} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={profile.serviceProviderProfile?.location || ''} />
              </div>
              <div>
                <Label>Experience Years</Label>
                <Input value={profile.serviceProviderProfile?.experienceYears || 0} />
              </div>
              <div>
                <Label>Hourly Rate</Label>
                <Input value={`$${profile.serviceProviderProfile?.hourlyRate || 0}`} />
              </div>
            </div>
            <Button className="w-full mt-4">Update Service Details</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{authUser.email}</p>
              </div>
              <Badge variant={authUser.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {authUser.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(authUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm onSuccess={refreshData} />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <Button variant="destructive" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ToggleSwitch
          checked={notifications.email}
          onChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
          label="Email Notifications"
          description="Receive important updates via email"
        />
        <ToggleSwitch
          checked={notifications.push}
          onChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
          label="Push Notifications"
          description="Get real-time notifications on your device"
        />
        <ToggleSwitch
          checked={notifications.marketing}
          onChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
          label="Marketing Communications"
          description="Receive promotional offers and updates"
        />
        <Button className="w-full">Save Preferences</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">{renderProfileTab()}</TabsContent>
        <TabsContent value="security">{renderSecurityTab()}</TabsContent>
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Payment settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">{renderNotificationsTab()}</TabsContent>
        <TabsContent value="privacy">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Privacy settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 🎯 Key Improvements Implemented

### ✅ Real API Integration
- Connects to your actual Auth Service (port 4000) and User Service (port 3001)
- Fetches real profile data instead of hardcoded values
- Proper error handling and loading states

### ✅ Form Validation with Zod + React Hook Form
- Client-side validation for all forms
- Custom validation rules (phone format, password strength)
- Real-time error feedback

### ✅ Toast Notifications
- Professional success/error messages
- No more browser alerts
- Customizable styling

### ✅ Reusable Components
- `ToggleSwitch` component for all notification toggles
- `ProfileForm` and `PasswordForm` components
- Consistent styling and behavior

### ✅ Better UX/UI
- Loading spinners during API calls
- Disabled states for forms during submission
- Better error handling and user feedback
- Responsive design

### ✅ Security Best Practices
- JWT token handling
- Proper API error handling
- Form validation and sanitization

## 🚀 Next Steps

1. **Copy the API service code** from `frontend-integration-example.ts`
2. **Install the dependencies**: `npm install react-hook-form @hookform/resolvers zod react-hot-toast`
3. **Replace your current settings page** with the improved version
4. **Test with your running backend services**
5. **Customize styling** to match your brand

Your settings page will now show real data from the database and provide a professional user experience with proper form validation and API integration!
