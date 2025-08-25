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
import { verseWorkspaceReducer } from './features/verse-workspace/state/verse-workspace.reducer';
import { VerseWorkspaceEffects } from './features/verse-workspace/state/verse-workspace.effects';
import { authReducer } from './state/auth/reducers/auth.reducer';
import { courseReducer } from './state/courses/reducers/course.reducer';
import { CourseEffects } from './state/courses/effects/course.effects';
import { featureRequestReducer } from './state/feature-requests/reducers/feature-request.reducer';
import { FeatureRequestEffects } from './state/feature-requests/effects/feature-request.effects';
import { atlasReducer } from './state/atlas/reducers/atlas.reducer';
import { AtlasEffects } from './state/atlas/effects/atlas.effects';
import { ConfigService } from '@services/config/config.service';
import { UserService } from '@services/api/user.service';

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
    
    // Initialize user data on app startup
    provideAppInitializer(() => {
      const userService = inject(UserService);
      // Ensure user data (including ESV API token) is loaded from DB
      return userService.fetchCurrentUser().toPromise();
    }),
    
    // NgRx Store Configuration
    provideStore(
      {
        router: routerReducer,
        auth: authReducer,
        bibleMemorization: bibleMemorizationReducer,
        decks: decksReducer,
        practiceSession: practiceSessionReducer,
        courses: courseReducer,
        featureRequests: featureRequestReducer,
        atlas: atlasReducer,
        ui: uiReducer,
        verseWorkspace: verseWorkspaceReducer,
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
      CourseEffects,
      FeatureRequestEffects,
      AtlasEffects,
      VerseWorkspaceEffects,
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