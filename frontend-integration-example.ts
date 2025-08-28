// API Integration for Settings Page
// This file shows how to integrate your frontend with the backend services

// ==========================================
// 1. API Service Layer
// ==========================================

interface AuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  role: {
    id: string;
    name: string;
  };
  customerProfile?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  serviceProviderProfile?: {
    category: string;
    location: string;
    experienceYears: number;
    hourlyRate: number;
    availability: boolean;
  };
}

class ApiService {
  private baseUrl = {
    auth: 'http://localhost:4000',
    user: 'http://localhost:3001',
  };

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Auth Service APIs
  async getCurrentAuthUser(): Promise<AuthUser> {
    const response = await fetch(`${this.baseUrl.auth}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch auth user data');
    }
    
    return response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl.auth}/auth/change-password`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }

    return response.json();
  }

  async updateEmail(email: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl.auth}/auth/update-email`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update email');
    }

    return response.json();
  }

  // User Service APIs
  async getCurrentUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl.user}/users/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl.user}/users/me`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  async updateCustomerProfile(data: { address: string; latitude?: number; longitude?: number }): Promise<any> {
    const response = await fetch(`${this.baseUrl.user}/users/me/customer-profile`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update customer profile');
    }

    return response.json();
  }

  async updateServiceProviderProfile(data: {
    category: string;
    location: string;
    experienceYears: number;
    latitude: number;
    longitude: number;
    hourlyRate?: number;
    availability?: boolean;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl.user}/users/me/service-provider-profile`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service provider profile');
    }

    return response.json();
  }
}

export const apiService = new ApiService();

// ==========================================
// 2. Form Validation Schemas (with Zod)
// ==========================================

import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const customerProfileSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const serviceProviderProfileSchema = z.object({
  category: z.string().min(2, 'Category is required'),
  location: z.string().min(2, 'Location is required'),
  experienceYears: z.number().min(0, 'Experience years must be 0 or more'),
  latitude: z.number(),
  longitude: z.number(),
  hourlyRate: z.number().min(0, 'Hourly rate must be 0 or more').optional(),
  availability: z.boolean().optional(),
});

// ==========================================
// 3. React Hook Form Integration
// ==========================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

// Example Profile Form Component
export function ProfileForm({ profile, onSuccess }: { 
  profile: UserProfile; 
  onSuccess: () => void; 
}) {
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

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          {...register('phone')}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}

// ==========================================
// 4. Password Change Form
// ==========================================

export function PasswordForm({ onSuccess }: { onSuccess: () => void }) {
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}

// ==========================================
// 5. Reusable Toggle Component
// ==========================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false 
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={label} className="text-base">
          {label}
        </Label>
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

// ==========================================
// 6. Main Settings Page Hook
// ==========================================

import { useState, useEffect } from 'react';

export function useSettingsData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileData, authData] = await Promise.all([
        apiService.getCurrentUserProfile(),
        apiService.getCurrentAuthUser(),
      ]);

      setProfile(profileData);
      setAuthUser(authData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = () => {
    fetchData();
  };

  return {
    profile,
    authUser,
    loading,
    error,
    refreshData,
  };
}

// ==========================================
// 7. Usage in Your Settings Component
// ==========================================

export function SettingsPage() {
  const { profile, authUser, loading, error, refreshData } = useSettingsData();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error || !profile || !authUser) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  const renderProfileTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
      <ProfileForm profile={profile} onSuccess={refreshData} />
      
      {/* Role-specific profile forms */}
      {profile.role.name === 'CUSTOMER' && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-4">Address Information</h4>
          <CustomerProfileForm profile={profile} onSuccess={refreshData} />
        </div>
      )}

      {profile.role.name === 'SERVICE_PROVIDER' && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-4">Service Provider Details</h4>
          <ServiceProviderProfileForm profile={profile} onSuccess={refreshData} />
        </div>
      )}
    </Card>
  );

  const renderSecurityTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold mb-4">Change Password</h4>
          <PasswordForm onSuccess={refreshData} />
        </div>

        <div>
          <h4 className="text-md font-semibold mb-4">Account Information</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> {authUser.email}</p>
            <p><strong>Status:</strong> {authUser.status}</p>
            <p><strong>Verified:</strong> {profile.isVerified ? 'Yes' : 'No'}</p>
            <p><strong>Member since:</strong> {new Date(authUser.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </Card>
  );

  // Return your existing JSX with these improvements
  return (
    <div className="container mx-auto p-6">
      {/* Your existing tab navigation */}
      {/* Render content based on activeTab */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'security' && renderSecurityTab()}
      {/* Other tabs... */}
    </div>
  );
}

// ==========================================
// 8. Required Dependencies
// ==========================================

/*
npm install react-hook-form @hookform/resolvers zod react-hot-toast

// In your main App.tsx or _app.tsx:
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div>
      {/* Your app content */}
      <Toaster position="top-right" />
    </div>
  );
}
*/
