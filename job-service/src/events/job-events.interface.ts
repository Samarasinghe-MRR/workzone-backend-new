export interface JobCreatedEvent {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  maxRadius?: number; // For provider search radius
  createdAt: Date;
}

export interface JobStatusChangedEvent {
  jobId: string;
  customerId: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: Date;
}

export interface JobAssignedEvent {
  jobId: string;
  customerId: string;
  providerId: string;
  quoteAmount: number | null;
  assignedAt: Date;
}

export interface JobCompletedEvent {
  jobId: string;
  customerId: string;
  providerId: string;
  completedAt: Date | null;
}

export interface QuoteAcceptedEvent {
  jobId: string;
  customerId: string;
  providerId: string;
  quoteAmount: number;
  acceptedAt: Date;
}

export interface QuoteRejectedEvent {
  jobId: string;
  customerId: string;
  providerId: string;
  rejectedAt: Date;
}
