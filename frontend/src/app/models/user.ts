// src/app/models/user.ts
export interface MemorizationProgress {
  reference: string;
  progress: number;
  lastPracticed?: Date;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  createdAt: Date;
  
  // Profile details
  denomination?: string;
  preferredBible?: string;
  includeApocrypha?: boolean;
  
  // Statistics
  versesMemorized?: number;
  streakDays?: number;
  booksStarted?: number;
  
  // Current progress
  currentlyMemorizing?: MemorizationProgress[];
}