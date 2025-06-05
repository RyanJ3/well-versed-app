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
import { WorkflowListComponent } from './features/workflows/workflow-list.component';
import { WorkflowBuilderComponent } from './features/workflows/workflow-builder.component';
import { WorkflowViewerComponent } from './features/workflows/workflow-viewer.component';
import { LessonViewerComponent } from './features/workflows/lesson-viewer.component';

//TODO move /flashcard paths to be /deck instead
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'flashcard', component: DeckListComponent },
  { path: 'flashcards', component: DeckListComponent },
  { path: 'flashcards/study/:deckId', component: DeckStudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorComponent },
  {
    path: 'feature-requests',
    component: FeatureRequestComponent,
    title: 'Feature Requests & Bug Reports',
  },
  { path: 'workflows/new', component: WorkflowBuilderComponent },
  { path: 'workflows/:workflowId/lesson/:lessonId', component: LessonViewerComponent },
  { path: 'workflows/:workflowId', component: WorkflowViewerComponent },
  { path: 'workflows', component: WorkflowListComponent },
  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' },
];
