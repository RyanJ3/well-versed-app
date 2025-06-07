// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './features/profile/profile.component';

import { FlowComponent } from './features/memorize/flow/flow.component';
import { StatsComponent } from './stats/stats.component';
import { DeckEditorComponent } from './features/memorize/decks/deck-editor/deck-editor.component';
import { DeckStudyComponent } from './features/memorize/decks/deck-study/deck-study.component';
import { DeckListComponent } from './features/memorize/decks/deck-list/deck-list.component';
import { FeatureRequestComponent } from './features/feature-request/feature-request.component';
import { CourseListComponent } from './features/memorize/courses/course-list.component';
import { CourseBuilderComponent } from './features/memorize/courses/course-builder.component';
import { LessonPracticeComponent } from './features/memorize/courses/lesson-practice/lesson-practice.component';

// Routing configuration
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'deck', component: DeckListComponent },
  { path: 'decks', component: DeckListComponent },
  { path: 'decks/study/:deckId', component: DeckStudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorComponent },
  { path: 'courses/:courseId/lessons/:lessonId/practice', component: LessonPracticeComponent },
  {
    path: 'feature-requests',
    component: FeatureRequestComponent,
    title: 'Feature Requests & Bug Reports',
  },
  { path: 'courses/create', component: CourseBuilderComponent },
  { path: 'courses', component: CourseListComponent },
  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' },
];
