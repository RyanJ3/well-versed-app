import { Lesson } from '@models/course-builder.types';

export function isLessonComplete(lesson: Lesson): boolean {
  if (!lesson.title || !lesson.content_type) return false;
  switch (lesson.content_type) {
    case 'video':
      return !!lesson.youtube_url;
    case 'article':
      return !!lesson.article_text && lesson.article_text.length >= 100;
    case 'external_link':
      return !!lesson.external_url;
    case 'quiz':
      return !!lesson.quiz_cards && lesson.quiz_cards.length > 0;
    default:
      return false;
  }
}

export function areAllLessonsComplete(lessons: Lesson[]): boolean {
  return lessons.every(l => isLessonComplete(l));
}
