// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BibleTrackerComponent } from './bible-tracker/bible-tracker.component';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { ApiTestComponent } from './api-test/api-test.components';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Home page
  { path: 'tracker', component: BibleTrackerComponent }, // Bible tracker page
  { path: 'profile', component: ProfileComponent }, // Profile page
  { path: 'api-test', component: ApiTestComponent }, // API test page
  // Other routes...
  { path: '**', redirectTo: '' },
];