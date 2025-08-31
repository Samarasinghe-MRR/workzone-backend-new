export interface QuoteSubmittedEvent {
  quoteId: string;
  jobId: string;
  providerId: string;
  price: number;
  submittedAt: Date;
}

export interface QuoteAcceptedEvent {
  quoteId: string;
  jobId: string;
  providerId: string;
  customerId: string;
  price: number;
  acceptedAt: Date;
}

export interface QuoteRejectedEvent {
  quoteId: string;
  jobId: string;
  providerId: string;
  customerId: string;
  rejectedAt: Date;
}

export interface QuoteCancelledEvent {
  quoteId: string;
  jobId: string;
  providerId: string;
  cancelledAt: Date;
}

// Enhanced job event with location data
export interface JobCreatedEvent {
  jobId: string;
  customerId: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  maxRadius: number; // Search radius in kilometers
  createdAt: Date;
}

export interface JobCancelledEvent {
  jobId: string;
  customerId: string;
  cancelledAt: Date;
}

// New events for geolocation-based invitation system
export interface QuotationInviteSentEvent {
  invitationId: string;
  jobId: string;
  providerId: string;
  customerId: string;
  distance: number; // Distance in kilometers
  estimatedResponseTime: number; // Hours
  invitedAt: Date;
  expiresAt: Date;
}

export interface InvitationResponseEvent {
  invitationId: string;
  jobId: string;
  providerId: string;
  response: "ACCEPTED" | "DECLINED";
  respondedAt: Date;
  quoteId?: string; // If accepted and quote submitted
}

export interface ProvidersMatchedEvent {
  jobId: string;
  matchedProviders: Array<{
    providerId: string;
    distance: number;
    estimatedResponseTime: number;
  }>;
  totalInvitesSent: number;
  searchRadius: number;
  createdAt: Date;
}
