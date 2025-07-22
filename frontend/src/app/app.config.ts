import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { metaReducers } from './state/core/helpers/dev.helpers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideClientHydration(),
    // NgRx Store Configuration
    provideStore(
      {
        router: routerReducer,
        // Feature reducers will be added here
      },
      {
        metaReducers: isDevMode() ? metaReducers : [],
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: true,
          strictActionWithinNgZone: true,
          strictActionTypeUniqueness: true,
        },
      }
    ),

    // NgRx Effects
    provideEffects([
      // Global effects will be added here
    ]),

    // Router Store
    provideRouterStore(),

    // Dev Tools - only in development
    provideStoreDevtools({
      maxAge: 25, // Retains last 25 states
      logOnly: !isDevMode(), // Restrict features in production
      autoPause: true, // Pause recording when window is not focused
      trace: false, // Include stack trace for every action
      traceLimit: 75, // Maximum stack trace frames
      connectInZone: true, // Connect within Angular zone
    }),
  ],
};
