import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@app/state';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-state-inspector',
  template: `
    <div class="state-inspector" *ngIf="!production">
      <button (click)="showState = !showState">
        {{ showState ? 'Hide' : 'Show' }} State
      </button>
      <pre *ngIf="showState">{{ state$ | async | json }}</pre>
    </div>
  `,
  styles: [
    `
      .state-inspector {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        max-width: 400px;
        max-height: 300px;
        overflow: auto;
        z-index: 9999;
      }
    `,
  ],
})
export class StateInspectorComponent {
  production = environment.production;
  showState = false;
  state$ = this.store.select((state) => state);

  private store = inject(Store<AppState>);
}
