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
  preferredLanguage?: string;
  includeApocrypha?: boolean;
  useEsvApi?: boolean;
  esvApiToken?: string;
  
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
  created_at: string;
  
  denomination?: string;
  preferred_bible?: string;
  preferred_language?: string;
  include_apocrypha?: boolean;
  use_esv_api?: boolean;
  esv_api_token?: string;
  
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
  preferred_language?: string;
  include_apocrypha?: boolean;
  use_esv_api?: boolean;
  esv_api_token?: string;
}