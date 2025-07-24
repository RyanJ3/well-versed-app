import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';

@Injectable()
export class BibleTrackerEffects {
  constructor(private actions$: Actions) {}
}
