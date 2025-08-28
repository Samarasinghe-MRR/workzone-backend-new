export interface UserCreatedEvent {
  authUserId: any;
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
  authUserId: any;
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

export interface PasswordChangedEvent {
  authUserId: any;
  id: string; // user id from Auth Service
  email: string; // email of the user
  changedAt: Date; // timestamp of password change
}
