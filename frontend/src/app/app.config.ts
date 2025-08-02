// app.config.ts
import { ApplicationConfig, isDevMode, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bibleMemorizationReducer } from "./state/bible-tracker/reducers/bible-memorization.reducer";
import { BibleMemorizationEffects } from "./state/bible-tracker/effects/bible-memorization.effects";
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { routes } from './app.routes';
import { metaReducers } from './state/core/helpers/dev.helpers';
import { decksReducer } from './state/decks/reducers/deck.reducer';
import { DeckEffects } from './state/decks/effects/deck.effects';
import { practiceSessionReducer } from './state/practice-session/reducers/practice-session.reducer';
import { PracticeSessionEffects } from './state/practice-session/effects/practice-session.effects';
import { uiReducer } from './state/ui/ui.reducer';
import { ConfigService } from './core/services/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideClientHydration(),
    
    // Add your app initializer
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    }),
    
    // NgRx Store Configuration
    provideStore(
      {
        router: routerReducer,
        bibleMemorization: bibleMemorizationReducer,
        decks: decksReducer,
        practiceSession: practiceSessionReducer,
        ui: uiReducer,
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
      DeckEffects,
      BibleMemorizationEffects,
      PracticeSessionEffects,
    ]),

    // Router Store
    provideRouterStore(),

    // Dev Tools
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
      connectInZone: true,
    }),
  ],
};