// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './features/profile/profile.component';
import { FlashcardComponent } from './features/memorize/flashcard/flashcard.component';
import { StudyComponent } from './features/memorize/study/study.component';
import { DeckEditorComponent } from './features/memorize/deck-editor/deck-editor.component';
import { FlowComponent } from './features/memorize/flow/flow.component';
import { StatsComponent } from './stats/stats.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'flashcard', component: FlashcardComponent },
  { path: 'flashcards', component: FlashcardComponent },
  { path: 'flashcards/study/:deckId', component: StudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorComponent },
  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' }
];