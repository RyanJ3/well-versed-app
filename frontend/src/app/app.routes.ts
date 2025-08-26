// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './features/profile/profile.component';

import { VerseWorkspaceComponent } from './features/verse-workspace/verse-workspace.component';
import { StatsComponent } from './features/stats/stats.component';
import { DeckEditorPageComponent } from './features/decks/pages/deck-editor-page/deck-editor-page.component';
import { DeckStudyComponent } from './features/decks/deck-study/deck-study.component';
import { DeckListPageComponent } from './features/decks/pages/deck-list-page/deck-list-page.component';
import { FeatureRequestComponent } from './features/feature-request/feature-request.component';
import { CourseListComponent } from './features/courses/course-list.component';
import { CourseDetailComponent } from './features/courses/detail/course-detail.component';
import { LessonViewComponent } from './features/courses/lesson/lesson-view.component';
import { CourseBuilderComponent } from './features/courses/course-builder/course-builder.component';
import { LessonPracticeComponent } from './features/courses/lesson-practice/lesson-practice.component';
import { QuizPracticeComponent } from './features/courses/quiz-practice/quiz-practice.component';
import { ScriptureAtlasComponent } from './features/scripture-atlas/scripture-atlas.component';
import { BibleTrackerComponent } from './features/bible-tracker/bible-tracker.component';
import { TranslationGuard } from './guards/translation.guard';
import { AuthGuard } from './guards/auth.guard';

// Routing configuration
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'copyright',
    loadComponent: () => import('./pages/copyright/copyright.component').then(m => m.CopyrightComponent),
    title: 'Bible Copyright Information',
    canActivate: [AuthGuard]
  },
  { path: 'tracker', component: BibleTrackerComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'deck', component: DeckListPageComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'decks', component: DeckListPageComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'decks/study/:deckId', component: DeckStudyComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'deck-editor/:deckId', component: DeckEditorPageComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/create', component: CourseBuilderComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/:courseId/edit', component: CourseBuilderComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/:courseId/lessons/:lessonId/practice', component: LessonPracticeComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/:courseId/lessons/:lessonId/quiz', component: QuizPracticeComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/:courseId/lessons/:lessonId', component: LessonViewComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: 'courses/:id', component: CourseDetailComponent, canActivate: [AuthGuard, TranslationGuard] },
  {
    path: 'feature-requests',
    component: FeatureRequestComponent,
    title: 'Feature Requests & Bug Reports',
    canActivate: [AuthGuard]
  },
  { path: 'courses', component: CourseListComponent, canActivate: [AuthGuard, TranslationGuard] },
  {
    path: 'atlas',
    loadChildren: () =>
      import('./features/scripture-atlas/scripture-atlas.routes').then(
        m => m.SCRIPTURE_ATLAS_ROUTES
      ),
    canActivate: [AuthGuard, TranslationGuard],
  },
  { path: 'verse-workspace', component: VerseWorkspaceComponent, canActivate: [AuthGuard, TranslationGuard] },
  { path: '**', redirectTo: '' },
];
