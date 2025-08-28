// Additional Components and Utilities for Settings Page

// ==========================================
// 1. Avatar Upload Component
// ==========================================

import React, { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface AvatarUploadProps {
  currentAvatar?: string;
  firstName: string;
  lastName: string;
  onAvatarChange: (file: File) => Promise<void>;
}

export function AvatarUpload({
  currentAvatar,
  firstName,
  lastName,
  onAvatarChange,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      await onAvatarChange(file);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error("Failed to update avatar");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const avatarSrc = preview || currentAvatar;

  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-xl font-semibold">
            {getInitials()}
          </span>
        )}
      </div>

      <div className="absolute -bottom-2 -right-2 flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </Button>

        {(preview || currentAvatar) && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 rounded-full p-0"
            onClick={handleRemoveAvatar}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

// ==========================================
// 2. Address Input with Geocoding
// ==========================================

import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressInputProps {
  address: string;
  latitude?: number;
  longitude?: number;
  onChange: (data: {
    address: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  label?: string;
  placeholder?: string;
}

export function AddressInput({
  address,
  latitude,
  longitude,
  onChange,
  label = "Address",
  placeholder = "Enter your address",
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(address);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Simple geocoding function (you can replace with Google Maps API or other service)
  const geocodeAddress = async (addressString: string) => {
    try {
      setIsGeocoding(true);

      // This is a mock implementation - replace with real geocoding
      // For Google Maps API:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${GOOGLE_MAPS_API_KEY}`);

      // Mock coordinates for demo
      const mockCoordinates = {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
      };

      onChange({
        address: addressString,
        latitude: mockCoordinates.latitude,
        longitude: mockCoordinates.longitude,
      });

      toast.success("Address coordinates updated");
    } catch (error) {
      toast.error("Failed to get address coordinates");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressBlur = () => {
    if (inputValue !== address && inputValue.trim()) {
      geocodeAddress(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address">{label}</Label>
      <div className="relative">
        <Input
          id="address"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleAddressBlur}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isGeocoding ? (
            <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
}

// ==========================================
// 3. Service Provider Profile Form
// ==========================================

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const serviceProviderSchema = z.object({
  category: z.string().min(2, "Category is required"),
  location: z.string().min(2, "Location is required"),
  experienceYears: z.number().min(0, "Experience years must be 0 or more"),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or more").optional(),
  availability: z.boolean().optional(),
});

interface ServiceProviderFormProps {
  profile: any;
  onSuccess: () => void;
}

export function ServiceProviderProfileForm({
  profile,
  onSuccess,
}: ServiceProviderFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      category: profile.serviceProviderProfile?.category || "",
      location: profile.serviceProviderProfile?.location || "",
      experienceYears: profile.serviceProviderProfile?.experienceYears || 0,
      hourlyRate: profile.serviceProviderProfile?.hourlyRate || 0,
      availability: profile.serviceProviderProfile?.availability ?? true,
    },
  });

  const onSubmit = async (data: z.infer<typeof serviceProviderSchema>) => {
    try {
      // Add mock coordinates for demo - replace with real geocoding
      const submitData = {
        ...data,
        latitude: 40.7128,
        longitude: -74.006,
      };

      await apiService.updateServiceProviderProfile(submitData);
      toast.success("Service provider profile updated successfully!");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Service Category</Label>
          <select
            id="category"
            {...register("category")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Handyman">Handyman</option>
            <option value="Gardening">Gardening</option>
            <option value="Moving">Moving</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="experienceYears">Years of Experience</Label>
          <Input
            id="experienceYears"
            type="number"
            min="0"
            {...register("experienceYears", { valueAsNumber: true })}
            className={errors.experienceYears ? "border-red-500" : ""}
          />
          {errors.experienceYears && (
            <p className="text-red-500 text-sm mt-1">
              {errors.experienceYears.message}
            </p>
          )}
        </div>
      </div>

      <AddressInput
        address={profile.serviceProviderProfile?.location || ""}
        latitude={profile.serviceProviderProfile?.latitude}
        longitude={profile.serviceProviderProfile?.longitude}
        onChange={(data) => setValue("location", data.address)}
        label="Service Location"
        placeholder="Enter your service area"
      />

      <div>
        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
        <Input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          {...register("hourlyRate", { valueAsNumber: true })}
          className={errors.hourlyRate ? "border-red-500" : ""}
        />
        {errors.hourlyRate && (
          <p className="text-red-500 text-sm mt-1">
            {errors.hourlyRate.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="availability"
          type="checkbox"
          {...register("availability")}
          className="rounded border-gray-300"
        />
        <Label htmlFor="availability">Currently available for bookings</Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Update Service Profile"}
      </Button>
    </form>
  );
}

// ==========================================
// 4. Customer Profile Form
// ==========================================

const customerProfileSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
});

interface CustomerProfileFormProps {
  profile: any;
  onSuccess: () => void;
}

export function CustomerProfileForm({
  profile,
  onSuccess,
}: CustomerProfileFormProps) {
  const [addressData, setAddressData] = useState({
    address: profile.customerProfile?.address || "",
    latitude: profile.customerProfile?.latitude,
    longitude: profile.customerProfile?.longitude,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(customerProfileSchema),
  });

  const onSubmit = async () => {
    if (!addressData.address.trim()) {
      toast.error("Address is required");
      return;
    }

    try {
      await apiService.updateCustomerProfile(addressData);
      toast.success("Customer profile updated successfully!");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AddressInput
        address={addressData.address}
        latitude={addressData.latitude}
        longitude={addressData.longitude}
        onChange={setAddressData}
        label="Home Address"
        placeholder="Enter your home address"
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Update Address"}
      </Button>
    </form>
  );
}

// ==========================================
// 5. Enhanced Settings Hook with Avatar Upload
// ==========================================

export function useSettingsWithAvatar() {
  const settingsData = useSettingsData();

  const uploadAvatar = async (file: File): Promise<string> => {
    // This would typically upload to your backend or cloud storage
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("http://localhost:3001/users/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const result = await response.json();
      return result.avatarUrl;
    } catch (error) {
      throw new Error("Avatar upload failed");
    }
  };

  return {
    ...settingsData,
    uploadAvatar,
  };
}

// ==========================================
// 6. Usage Example in Settings Page
// ==========================================

export function EnhancedSettingsPage() {
  const { profile, authUser, loading, error, refreshData, uploadAvatar } =
    useSettingsWithAvatar();

  const handleAvatarChange = async (file: File) => {
    try {
      await uploadAvatar(file);
      refreshData(); // Refresh to get new avatar URL
    } catch (error) {
      throw error; // Re-throw to let AvatarUpload component handle it
    }
  };

  // In your profile tab render function:
  const renderProfileTabWithAvatar = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <AvatarUpload
              currentAvatar={profile.avatarUrl}
              firstName={profile.firstName}
              lastName={profile.lastName}
              onAvatarChange={handleAvatarChange}
            />
            <div>
              <h2 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-muted-foreground">{profile.email}</p>
              {/* Rest of profile header */}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Rest of profile tab */}
    </div>
  );

  // Rest of component...
}

export {
  AvatarUpload,
  AddressInput,
  ServiceProviderProfileForm,
  CustomerProfileForm,
};
