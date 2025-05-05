// src/app/app.routes.ts
import { Routes } from '@angular/router';
// import { FlowMemorizationComponent } from './memorization/flow/flow-memorization.component';
// import { FlashcardComponent } from './memorization/flashcard/flashcard.component';
import { map } from 'rxjs/operators';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';

export const routes: Routes = [
  { path: '', component: BibleTrackerComponent }, // Home page
  { path: 'stats', component: BibleTrackerComponent }, // stats page (protected)
  // { path: 'flow', component: FlowMemorizationComponent }, // FLOW memorization tool route (protected)
  // { path: 'flashcard', component: FlashcardComponent }, // Flashcard memorization tool (protected)

  // Catch-all route (404)
  { path: '**', redirectTo: '' },
];
