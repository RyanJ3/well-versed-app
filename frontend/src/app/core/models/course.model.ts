// frontend/src/app/core/models/course.model.ts

export interface Course {
  id: number;
  creator_id: number;
  creator_name: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  lesson_count: number;
  enrolled_count: number;
  tags: string[];
}

export interface Lesson {
  id?: number;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'external_link' | 'quiz' | '';
  /**
   * The API returns lesson content nested under a `content_data` field.
   * Including this optional property allows frontend code to map the
   * response directly while still supporting the flattened structure
   * used when creating new lessons.
   */
  content_data?: LessonContent;
  youtube_url?: string;
  article_text?: string;
  external_url?: string;
  external_title?: string;
  /** Estimated minutes to complete the lesson */
  expected_minutes?: number;
  flashcards_required: number;
  position: number;
}

export interface LessonContent {
  // For video lessons
  youtube_url?: string;
  video_duration?: number;

  // For article lessons
  article_text?: string;

  // For external link lessons
  external_url?: string;
  external_title?: string;

  // For quiz lessons
  quiz_config?: {
    source_lessons: number[]; // IDs of lessons to pull verses from
    verse_count: number; // 2-7
    pass_threshold: number; // 85
    randomize: boolean;
  };
}

export interface UserCourseProgress {
  user_id: number;
  course_id: number;
  current_lesson_id: number;
  current_lesson_position: number;
  lessons_completed: number;
  enrolled_at: string;
  last_accessed: string;
  completed_at?: string;
}

export interface UserLessonProgress {
  user_id: number;
  lesson_id: number;
  course_id: number;
  started_at: string;
  completed_at?: string;
  flashcards_required: number;
  flashcards_completed: number;
  is_unlocked: boolean;
  // Quiz specific
  quiz_attempts?: number;
  best_score?: number;
  last_attempt?: string;
}

export interface LessonFlashcard {
  id: number;
  lesson_id: number;
  card_type: 'verse' | 'custom';
  front_content: string;
  back_content: string;
  verse_codes?: string[]; // For verse-based cards
  position: number;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail_url?: string;
  is_public: boolean;
  tags: string[];
}

export interface CreateLessonRequest {
  course_id: number;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'external_link' | 'quiz';
  content_data: LessonContent;
  /** Estimated minutes to complete the lesson */
  expected_minutes?: number;
  position?: number;
}

export interface AddFlashcardsToQueueRequest {
  lesson_id: number;
  flashcard_ids: number[];
  verse_codes?: string[]; // For adding Bible verses as flashcards
}

export interface QuizAttempt {
  lesson_id: number;
  user_id: number;
  score: number;
  verse_scores: {
    verse_code: string;
    confidence: number;
  }[];
  completed_at: string;
}
