
export enum PetitionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  IN_REVIEW = 'in_review',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETE = 'complete'
}

export type PetitionError = {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'GENERIC';
  message: string;
};
