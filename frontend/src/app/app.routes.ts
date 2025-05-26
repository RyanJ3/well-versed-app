// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { StatsComponent } from './stats/stats.component';
import { FlashcardComponent } from './flashcard/flashcard.component';
import { StudyComponent } from './study/study.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home page
  { path: 'tracker', component: BibleTrackerComponent }, // Bible tracker page
  { path: 'profile', component: ProfileComponent }, // Profile page
  { path: 'stats', component: StatsComponent }, // Stats page
  { path: 'flashcards', component: FlashcardComponent }, // Flashcard decks page
  { path: 'flashcards/study/:deckId', component: StudyComponent }, // Study interface
  // Other routes...
  { path: '**', redirectTo: '' },
];