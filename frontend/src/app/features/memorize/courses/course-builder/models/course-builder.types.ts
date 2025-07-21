import { LessonContent } from '../../../../core/models/course.model';

export interface Lesson {
  id?: number;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'external_link' | 'quiz' | '';
  /**
   * Lessons retrieved from the API include a content_data object which holds
   * the actual lesson content. When building a new lesson we flatten these
   * values onto the lesson itself, but keeping this optional property allows
   * us to easily map existing lessons returned by the backend.
   */
  content_data?: LessonContent;
  youtube_url?: string;
  article_text?: string;
  external_url?: string;
  external_title?: string;
  // Quiz specific fields
  quiz_verse_count?: number;
  quiz_pass_threshold?: number;
  quiz_randomize?: boolean;
  quiz_cards?: { verseCodes: string[]; reference: string }[];
  position: number;
}
