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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'flashcard', component: DeckListComponent },
  { path: 'flashcards', component: DeckListComponent },
  { path: 'flashcards/study/:deckId', component: DeckStudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorComponent },
  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' }
];