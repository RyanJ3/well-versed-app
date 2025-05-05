// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { map } from 'rxjs/operators';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: '', component: BibleTrackerComponent }, // Home page
  { path: 'tracker', component: BibleTrackerComponent }, // Bible tracker page
  { path: 'profile', component: ProfileComponent }, // Profile page
  // { path: 'flow', component: FlowMemorizationComponent }, // FLOW memorization tool route (protected)
  // { path: 'flashcard', component: FlashcardComponent }, // Flashcard memorization tool (protected)

  // Catch-all route (404)
  { path: '**', redirectTo: '' },
];