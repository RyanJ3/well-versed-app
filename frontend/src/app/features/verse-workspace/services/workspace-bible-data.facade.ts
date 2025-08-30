import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BibleBook, BibleData } from '@models/bible';
import { BibleService } from '@services/api/bible.service';

/**
 * Facade for Bible data management
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceBibleDataFacade {
  // State
  private bibleDataSubject = new BehaviorSubject<BibleData | null>(null);
  private allBooksSubject = new BehaviorSubject<BibleBook[]>([]);
  private hasApocryphaSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  bibleData$ = this.bibleDataSubject.asObservable();
  allBooks$ = this.allBooksSubject.asObservable();
  hasApocrypha$ = this.hasApocryphaSubject.asObservable();

  constructor(private bibleService: BibleService) {
    this.loadBibleData();
    
    // Subscribe to Bible preferences
    this.bibleService.preferences$.subscribe(prefs => {
      this.hasApocryphaSubject.next(prefs.includeApocrypha);
      this.loadBibleData(); // Reload when preferences change
    });
  }

  private loadBibleData(): void {
    const bibleData = this.bibleService.getBibleData();
    if (bibleData) {
      this.bibleDataSubject.next(bibleData);
      this.allBooksSubject.next(bibleData.books);
      console.log('Loaded Bible books:', bibleData.books.length);
    } else {
      console.error('Failed to load Bible data');
    }
  }

  getBookById(bookId: number): BibleBook | null {
    const bibleData = this.bibleDataSubject.value;
    return bibleData?.getBookById(bookId) || null;
  }

  updateUserPreferences(includeApocrypha: boolean): void {
    this.bibleService.updateUserPreferences(includeApocrypha);
    this.hasApocryphaSubject.next(includeApocrypha);
  }

  getAllBooks(): BibleBook[] {
    return this.allBooksSubject.value;
  }

  getBibleData(): BibleData | null {
    return this.bibleDataSubject.value;
  }
}