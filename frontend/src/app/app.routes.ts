// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './features/profile/profile.component';

import { FlowComponent } from './features/flow-memorization/flow.component';
import { StatsComponent } from './features/stats/stats.component';
import { DeckEditorPageComponent } from './features/decks/pages/deck-editor-page/deck-editor-page.component';
import { DeckStudyComponent } from './features/decks/deck-study/deck-study.component';
import { DeckListPageComponent } from './features/decks/pages/deck-list-page/deck-list-page.component';
import { FeatureRequestComponent } from './features/feature-request/feature-request.component';
import { CourseListComponent } from './features/courses/course-list.component';
import { CourseBuilderComponent } from './features/courses/course-builder/course-builder.component';
import { LessonPracticeComponent } from './features/courses/lesson-practice/lesson-practice.component';
import { ScriptureAtlasComponent } from './features/scripture-atlas/scripture-atlas.component';
import { BibleTrackerComponent } from './features/bible-tracker/bible-tracker.component';
import { TranslationGuard } from './guards/translation.guard';

// Routing configuration
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'copyright',
    loadComponent: () => import('./pages/copyright/copyright.component').then(m => m.CopyrightComponent),
    title: 'Bible Copyright Information'
  },
  { path: 'tracker', component: BibleTrackerComponent, canActivate: [TranslationGuard] },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent, canActivate: [TranslationGuard] },
  { path: 'deck', component: DeckListPageComponent, canActivate: [TranslationGuard] },
  { path: 'decks', component: DeckListPageComponent, canActivate: [TranslationGuard] },
  { path: 'decks/study/:deckId', component: DeckStudyComponent, canActivate: [TranslationGuard] },
  { path: 'deck-editor/:deckId', component: DeckEditorPageComponent, canActivate: [TranslationGuard] },
  { path: 'courses/:courseId/lessons/:lessonId/practice', component: LessonPracticeComponent, canActivate: [TranslationGuard] },
  {
    path: 'feature-requests',
    component: FeatureRequestComponent,
    title: 'Feature Requests & Bug Reports',
  },
  { path: 'courses/create', component: CourseBuilderComponent, canActivate: [TranslationGuard] },
  { path: 'courses', component: CourseListComponent, canActivate: [TranslationGuard] },
  {
    path: 'atlas',
    loadChildren: () =>
      import('./features/scripture-atlas/scripture-atlas.routes').then(
        m => m.SCRIPTURE_ATLAS_ROUTES
      ),
    canActivate: [TranslationGuard],
  },
  { path: 'flow', component: FlowComponent, canActivate: [TranslationGuard] },
  { path: '**', redirectTo: '' },
];
