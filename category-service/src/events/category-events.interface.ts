export interface CategoryCreatedEvent {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface CategoryUpdatedEvent {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  updatedBy?: string;
  updatedAt: Date;
}

export interface CategoryDeletedEvent {
  id: string;
  name: string;
  deletedBy?: string;
  deletedAt: Date;
}
