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

// Interface for API responses
export interface UserApiResponse {
  id: string | number;
  name: string;
  email: string;
  created_at: string; // API returns dates as strings
  
  denomination?: string;
  preferred_bible?: string;
  include_apocrypha?: boolean;
  
  verses_memorized?: number;
  streak_days?: number;
  books_started?: number;
}

// Interface for API requests
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  denomination?: string;
  preferred_bible?: string;
  include_apocrypha?: boolean;
}