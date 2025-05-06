// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';


export const routes: Routes = [
  { path: '', component: BibleTrackerComponent }, // Home page
  { path: 'tracker', component: BibleTrackerComponent }, // Bible tracker page
  // { path: 'profile', component: ProfileComp }, // Profile page
  // { path: 'flow', component: FlowMemorizationComponent }, // FLOW memorization tool route (protected)
  // { path: 'flashcard', component: FlashcardComponent }, // Flashcard memorization tool (protected)

  // Catch-all route (404)
  { path: '**', redirectTo: '' },
];