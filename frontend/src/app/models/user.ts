// frontend/src/app/models/user.ts
export interface User {
  id: number;
  name: string; // Full name (computed or stored)
  email: string;
  createdAt: Date;
  
  // Separate name fields
  firstName: string;
  lastName: string;
  
  // Profile fields
  denomination?: string;
  preferredBible?: string;
  preferredLanguage?: string;
  includeApocrypha: boolean;
  useEsvApi: boolean;  // Make this non-optional with default
  esvApiToken?: string;
  
  // Statistics
  versesMemorized?: number;
  streakDays?: number;
  booksStarted?: number;
  currentlyMemorizing?: string[];
}

// API Response interface (snake_case from backend)
export interface UserApiResponse {
  id: number;
  email: string;
  name: string;
  created_at: string;
  
  // Name fields from backend
  first_name?: string;
  last_name?: string;
  
  // Profile fields from backend
  denomination?: string;
  preferred_bible?: string;
  preferred_language?: string;
  include_apocrypha?: boolean;
  use_esv_api?: boolean;
  esv_api_token?: string;
  
  // Statistics from backend
  verses_memorized?: number;
  streak_days?: number;
  books_started?: number;
}

// Profile Update Request (snake_case for backend)
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
