// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './profile/profile.component';
import { FlashcardComponent } from './flashcard/flashcard.component';
import { StudyComponent } from './study/study.component';
import { DeckEditorComponent } from './deck-editor/deck-editor.component';
import { FlowComponent } from './flow/flow.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tracker', component: BibleTrackerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'flashcard', component: FlashcardComponent },
  { path: 'flashcards', component: FlashcardComponent },
  { path: 'flashcards/study/:deckId', component: StudyComponent },
  { path: 'deck-editor/:deckId', component: DeckEditorComponent },
  { path: 'flow', component: FlowComponent },
  { path: '**', redirectTo: '' }
];