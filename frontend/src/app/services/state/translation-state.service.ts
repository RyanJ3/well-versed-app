import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationStateService {
  private needsTranslationSubject = new BehaviorSubject<boolean>(false);
  needsTranslation$ = this.needsTranslationSubject.asObservable();

  setNeedsTranslationSelection(needs: boolean) {
    this.needsTranslationSubject.next(needs);
  }
}
