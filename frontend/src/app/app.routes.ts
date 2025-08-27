// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './features/profile/profile.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

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

// Routing configuration with layout-based structure
export const routes: Routes = [
  // Auth Layout - for login, register, password reset, etc.
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: LoginComponent },
    ]
  },
  {
    path: 'register',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: RegisterComponent },
    ]
  },
  // Future auth pages will go here with AuthLayout:
  // { path: 'forgot-password', component: AuthLayoutComponent, children: [{ path: '', component: ForgotPasswordComponent }] },
  // { path: 'reset-password', component: AuthLayoutComponent, children: [{ path: '', component: ResetPasswordComponent }] },
  
  // Main Layout - for the main application
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'tracker', component: BibleTrackerComponent, canActivate: [TranslationGuard] },
      { path: 'profile', component: ProfileComponent },
      { path: 'stats', component: StatsComponent, canActivate: [TranslationGuard] },
      { path: 'deck', component: DeckListPageComponent, canActivate: [TranslationGuard] },
      { path: 'decks', component: DeckListPageComponent, canActivate: [TranslationGuard] },
      { path: 'decks/study/:deckId', component: DeckStudyComponent, canActivate: [TranslationGuard] },
      { path: 'deck-editor/:deckId', component: DeckEditorPageComponent, canActivate: [TranslationGuard] },
      { path: 'courses/create', component: CourseBuilderComponent, canActivate: [TranslationGuard] },
      { path: 'courses/:courseId/edit', component: CourseBuilderComponent, canActivate: [TranslationGuard] },
      { path: 'courses/:courseId/lessons/:lessonId/practice', component: LessonPracticeComponent, canActivate: [TranslationGuard] },
      { path: 'courses/:courseId/lessons/:lessonId/quiz', component: QuizPracticeComponent, canActivate: [TranslationGuard] },
      { path: 'courses/:courseId/lessons/:lessonId', component: LessonViewComponent, canActivate: [TranslationGuard] },
      { path: 'courses/:id', component: CourseDetailComponent, canActivate: [TranslationGuard] },
      {
        path: 'feature-requests',
        component: FeatureRequestComponent,
        title: 'Feature Requests & Bug Reports',
      },
      { path: 'courses', component: CourseListComponent, canActivate: [TranslationGuard] },
      {
        path: 'atlas',
        loadChildren: () =>
          import('./features/scripture-atlas/scripture-atlas.routes').then(
            m => m.SCRIPTURE_ATLAS_ROUTES
          ),
        canActivate: [TranslationGuard],
      },
      { path: 'verse-workspace', component: VerseWorkspaceComponent, canActivate: [TranslationGuard] },
      {
        path: 'copyright',
        loadComponent: () => import('./pages/copyright/copyright.component').then(m => m.CopyrightComponent),
        title: 'Bible Copyright Information'
      },
    ]
  },
  
  // Fallback route - redirect to home (auth guard will redirect to login if needed)
  { path: '**', redirectTo: '' },
];
