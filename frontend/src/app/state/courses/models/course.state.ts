import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Course, Lesson, UserCourseProgress, UserLessonProgress, LessonFlashcard } from '@models/course.model';

export interface CoursesState extends EntityState<Course> {
  selectedCourseId: number | null;
  enrolledCourseIds: number[];
  currentLesson: Lesson | null;
  lessonFlashcards: LessonFlashcard[];
  userProgress: { [courseId: number]: UserCourseProgress };
  lessonProgress: { [lessonId: number]: UserLessonProgress };
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    tags: string[];
    type: string | null;
  };
}

export const courseAdapter: EntityAdapter<Course> = createEntityAdapter<Course>({
  selectId: (course: Course) => course.id,
  sortComparer: (a: Course, b: Course) => a.title.localeCompare(b.title)
});

export const initialCoursesState: CoursesState = courseAdapter.getInitialState({
  selectedCourseId: null,
  enrolledCourseIds: [],
  currentLesson: null,
  lessonFlashcards: [],
  userProgress: {},
  lessonProgress: {},
  loading: false,
  error: null,
  searchQuery: '',
  filters: {
    tags: [],
    type: null
  }
});