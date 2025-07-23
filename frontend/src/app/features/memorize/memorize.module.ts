import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { decksReducer } from '@app/state/decks/reducers/deck.reducer';
import { practiceSessionReducer } from '@app/state/practice-session/reducers/practice-session.reducer';
import { DeckEffects } from '@app/state/decks/effects/deck.effects';
import { PracticeSessionEffects } from '@app/state/practice-session/effects/practice-session.effects';

import { memorizeRoutes } from './memorize.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(memorizeRoutes),
    StoreModule.forFeature('decks', decksReducer),
    StoreModule.forFeature('practiceSession', practiceSessionReducer),
    EffectsModule.forFeature([DeckEffects, PracticeSessionEffects])
  ]
})
export class MemorizeModule {}
