export interface UserCreatedEvent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string; // 'customer' | 'service_provider' | 'admin'
  isVerified: boolean;
  createdAt: Date;
}

export interface UserVerifiedEvent {
  id: string;
  email: string;
  verifiedAt: Date;
}

export interface UserUpdatedEvent {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  updatedAt: Date;
}

export interface UserDeletedEvent {
  id: string;
  email: string;
  deletedAt: Date;
}
