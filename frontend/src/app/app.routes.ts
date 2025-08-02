// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ProfileComponent } from './features/profile/profile.component';

import { FlowComponent } from './features/memorize/flow/flow.component';
import { StatsComponent } from './features/stats/stats.component';
import { DeckEditorPageComponent } from './features/memorize/decks/pages/deck-editor-page/deck-editor-page.component';
import { DeckStudyComponent } from './features/memorize/decks/deck-study/deck-study.component';
import { DeckListPageComponent } from './features/memorize/decks/pages/deck-list-page/deck-list-page.component';
import { FeatureRequestComponent } from './features/feature-request/feature-request.component';
import { CourseListComponent } from './features/memorize/courses/course-list.component';
import { CourseBuilderComponent } from './features/memorize/courses/course-builder/course-builder.component';
import { LessonPracticeComponent } from './features/memorize/courses/lesson-practice/lesson-practice.component';
import { ScriptureAtlasComponent } from './features/scripture-atlas/scripture-atlas.component';
import { BibleTrackerComponent } from './features/bible-tracker/bible-tracker.component';

// Routing configuration
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'copyright',
    loadComponent: () => import('./features/copyright/copyright.component').then(m => m.CopyrightComponent),
    title: 'Bible Copyright Information'
  },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'deck', component: DeckListPageComponent },
  { path: 'decks', component: DeckListPageComponent },
  { path: 'decks/study/:deckId', component: DeckStudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorPageComponent },
  { path: 'courses/:courseId/lessons/:lessonId/practice', component: LessonPracticeComponent },
  {
    path: 'feature-requests',
    component: FeatureRequestComponent,
    title: 'Feature Requests & Bug Reports',
  },
  { path: 'courses/create', component: CourseBuilderComponent },
  { path: 'courses', component: CourseListComponent },
{
  path: 'atlas',
  loadChildren: () => import('./features/scripture-atlas/scripture-atlas.routes')
    .then(m => m.SCRIPTURE_ATLAS_ROUTES)
},  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' },
];
