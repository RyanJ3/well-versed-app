// bible-tracker.service.ts - Service for managing Bible memorization data with backend integration
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, catchError, map, tap } from 'rxjs/operators';
import {
  BIBLE_DATA,
  BibleBook,
  BookProgress,
  BookStats,
  GroupStats,
  ChapterProgress,
  TestamentStats,
} from './models';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BibleTrackerService {
// Add this method to the BibleTrackerService class
public getTestaments(): string[] {
  return BIBLE_DATA.getTestaments();
}
  getBooksInGroup(selectedGroup: string): BibleBook[] {
    return BIBLE_DATA.getBooksByGroup(selectedGroup);
  }

  private progressSubject = new BehaviorSubject<BookProgress>({});
  public progress$ = this.progressSubject.asObservable();

  // API configuration
  private apiUrl = 'http://localhost:8000/api';
  private userId = 1; // Default user ID - replace with auth user ID in production

  constructor(private http: HttpClient) {
    this.loadProgress();
  }

  // Update method to use boolean array tracking
  public updateMemorizedVerses(
    bookName: string,
    chapterIndex: number,
    selectedVerses: number[],
  ): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const maxVerses = book.getVerseCount(chapterIndex);
    const currentProgress = { ...this.progressSubject.value };

    // Ensure the book entry exists
    if (!currentProgress[bookName]) {
      currentProgress[bookName] =
        this.initializeEmptyProgress()[bookName] || [];
    }

    // Create versesMemorized array from selected verses
    const versesMemorized = Array(maxVerses).fill(false);
    selectedVerses.forEach((verseNum) => {
      if (verseNum >= 1 && verseNum <= maxVerses) {
        versesMemorized[verseNum - 1] = true;
      }
    });

    // Ensure chapter entry exists or update existing one
    currentProgress[bookName][chapterIndex] = new ChapterProgress(
      chapterIndex + 1,
      maxVerses,
      selectedVerses.length,
      selectedVerses.length > 0,
      selectedVerses.length === maxVerses,
      versesMemorized,
    );

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  // Load progress data from API or fallback to localStorage
  private loadProgress(): void {
    this.fetchProgressFromAPI().subscribe(progress => {
      this.progressSubject.next(progress);
    });
  }

  // Initialize empty progress structure
  public initializeEmptyProgress(): BookProgress {
    const progress: BookProgress = {};

    BIBLE_DATA.books.forEach((book) => {
      const chapterCount = book.chapters.length;
      progress[book.name] = Array(chapterCount);

      for (let i = 0; i < chapterCount; i++) {
        const verseCount = book.getVerseCount(i);
        progress[book.name][i] = new ChapterProgress(
          i + 1,
          verseCount,
          0,
          false,
          false,
          Array(verseCount).fill(false)
        );
      }
    });

    return progress;
  }

  // Calculate stats for a specific book
  public calculateBookStats(bookName: string): BookStats {
    const currentProgress = this.progressSubject.value;
    const bookProgress = currentProgress[bookName];

    if (!bookProgress) {
      return new BookStats(0, 0, 0, 0, 0);
    }

    let memorizedChapters = 0;
    let inProgressChapters = 0;
    let totalVerses = 0;
    let memorizedVerses = 0;

    bookProgress.forEach((chapter) => {
      if (chapter && chapter.versesMemorized) {
        // Count total verses from the versesMemorized array length
        const chapterTotalVerses = chapter.versesMemorized.length;
        totalVerses += chapterTotalVerses;

        // Count memorized verses by filtering the boolean array
        const chapterMemorizedVerses = chapter.versesMemorized.filter(v => v).length;
        memorizedVerses += chapterMemorizedVerses;

        // Determine chapter status based on memorized verses
        if (chapterMemorizedVerses === chapterTotalVerses && chapterTotalVerses > 0) {
          memorizedChapters++;
        } else if (chapterMemorizedVerses > 0) {
          inProgressChapters++;
        }
      }
    });

    const percentComplete = totalVerses > 0 ? (memorizedVerses / totalVerses) * 100 : 0;

    return new BookStats(
      bookProgress.length,
      memorizedChapters,
      inProgressChapters,
      percentComplete,
      totalVerses
    );
  }

  // Calculate stats for a testament or group
  public getTestamentStats(testament: string): TestamentStats {
    const books = BIBLE_DATA.getTestamentBooks(testament);
    let totalVerses = 0;
    let memorizedVerses = 0;
    let totalChapters = 0;
    let memorizedChapters = 0;
    let inProgressChapters = 0;

    books.forEach((book) => {
      const stats = this.calculateBookStats(book.name);
      totalVerses += stats.totalVerses;
      memorizedVerses += stats.memorizedVerses;
      totalChapters += stats.totalChapters;
      memorizedChapters += stats.memorizedChapters;
      inProgressChapters += stats.inProgressChapters;
    });

    const percentComplete = totalVerses > 0 ? (memorizedVerses / totalVerses) * 100 : 0;

    return new TestamentStats(
      testament,
      books.map(book => this.calculateBookStats(book.name)),
      memorizedChapters,
      totalVerses,
      memorizedVerses
    );
  }

  // Calculate stats for a specific group of books
  public calculateGroupStats(groupName: string): GroupStats {
    const books = BIBLE_DATA.getGroupBooks(groupName);
    let totalVerses = 0;
    let memorizedVerses = 0;
    let totalChapters = 0;
    let memorizedChapters = 0;
    let inProgressChapters = 0;

    // Track book completion status to calculate metrics
    const bookStats = books.map(book => this.calculateBookStats(book.name));

    // Aggregate statistics across all books
    bookStats.forEach(stats => {
      totalVerses += stats.totalVerses;
      memorizedVerses += stats.memorizedVerses;
      totalChapters += stats.totalChapters;
      memorizedChapters += stats.memorizedChapters;
      inProgressChapters += stats.inProgressChapters;
    });

    // Create the GroupStats object with base values
    // Let the derived properties be calculated via getters
    return new GroupStats(
      groupName,
      books,
      totalChapters,
      memorizedChapters,
      inProgressChapters,
      totalVerses,
      memorizedVerses
    );
  }

  // Get all verses for a specific chapter
  public getChapterVerses(bookName: string, chapterIndex: number): number[] {
    const currentProgress = this.progressSubject.value;
    const book = currentProgress[bookName];

    if (!book || !book[chapterIndex] || !book[chapterIndex].versesMemorized) {
      return [];
    }

    const memorizedVerses: number[] = [];
    book[chapterIndex].versesMemorized.forEach((isMemorized, index) => {
      if (isMemorized) {
        memorizedVerses.push(index + 1);
      }
    });

    return memorizedVerses;
  }

  // API INTEGRATION METHODS

  /**
   * Fetches user progress from the backend
   */
  private fetchProgressFromAPI(): Observable<BookProgress> {
    // Get user verses from the API
    return this.getUserVerses().pipe(
      map(userVerses => {
        // Initialize empty progress
        const progress = this.initializeEmptyProgress();

        // Populate progress with user's verses from API
        userVerses.forEach(userVerse => {
          // Extract book and chapter from verse_id (format: "Book.Chapter.Verse")
          const parts = userVerse.verse.verse_id.split('.');
          if (parts.length >= 3) {
            const bookName = parts[0];
            const chapterNum = parseInt(parts[1]) - 1; // 0-based index
            const verseNum = parseInt(parts[2]) - 1;   // 0-based index

            // Ensure book exists in our data
            const book = BIBLE_DATA.getBookByName(bookName);
            if (book && progress[bookName] && progress[bookName][chapterNum]) {
              // Mark verse as memorized based on confidence level
              if (progress[bookName][chapterNum].versesMemorized &&
                verseNum < progress[bookName][chapterNum].versesMemorized.length) {
                progress[bookName][chapterNum].versesMemorized[verseNum] = true;

                // Update memorized count
                const versesMemorized = progress[bookName][chapterNum].versesMemorized;
                const memorizedCount = versesMemorized.filter(v => v).length;
                progress[bookName][chapterNum].memorizedVerses = memorizedCount;
                progress[bookName][chapterNum].inProgress = memorizedCount > 0;
                progress[bookName][chapterNum].completed =
                  memorizedCount === progress[bookName][chapterNum].totalVerses;
              }
            }
          }
        });

        return progress;
      }),
      catchError(error => {
        console.error('Error fetching progress data:', error);
        return of(this.initializeEmptyProgress());
      })
    );
  }

  /**
   * Saves user progress to the backend
   */
  private saveProgressToAPI(progress: BookProgress): Observable<boolean> {
    // For each memorized verse, ensure it's saved to the backend
    const saveOperations: Observable<any>[] = [];

    Object.entries(progress).forEach(([bookName, chapters]) => {
      if (chapters) {
        chapters.forEach((chapter, chapterIndex) => {
          if (chapter && chapter.versesMemorized) {
            chapter.versesMemorized.forEach((isMemorized, verseIndex) => {
              if (isMemorized) {
                // Create verse ID in format "Book.Chapter.Verse"
                const verseId = `${bookName}.${chapterIndex + 1}.${verseIndex + 1}`;

                // Calculate confidence level (simplified for now - could be more complex)
                const confidenceLevel = 500; // Mid-range confidence by default

                // Add verse if not already added, or update confidence level
                saveOperations.push(
                  this.updateOrAddVerse(verseId, confidenceLevel)
                );
              }
            });
          }
        });
      }
    });

    // If no operations, return success
    if (saveOperations.length === 0) {
      return of(true);
    }

    // Return combined result
    return of(true);
  }

  private updateOrAddVerse(verseId: string, confidenceLevel: number): Observable<any> {
    // First check if verse exists for user
    return this.http.get<any[]>(`${this.apiUrl}/user-verses/${this.userId}`).pipe(
      map(verses => verses.find(v => v.verse && v.verse.verse_id === verseId)),
      tap(existingVerse => {
        if (existingVerse) {
          // Update existing verse
          this.http.put(`${this.apiUrl}/user-verses/${this.userId}/${verseId}`, {
            confidence: confidenceLevel
          }).subscribe();
        } else {
          // Add new verse
          this.http.post(`${this.apiUrl}/user-verses/`, {
            user_id: this.userId,
            verse_id: verseId,
            confidence: confidenceLevel
          }).subscribe();
        }
      }),
      catchError(error => {
        console.error('Error saving verse:', error);
        return of(null);
      })
    );
  }

  /**
   * Gets user's verses from the database through the Python backend
   */
  getUserVerses(userId: number = this.userId): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user-verses/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching verses:', error);
        return of([]);
      })
    );
  }

  /**
   * Adds a verse to the user's collection
   */
  addVerse(verseId: string, userId: number = this.userId): Observable<any> {
    return this.http.post(`${this.apiUrl}/user-verses/`, {
      user_id: userId,
      verse_id: verseId,
      confidence: 1 // Starting confidence level
    }).pipe(
      catchError(error => {
        console.error('Error adding verse:', error);
        return throwError(() => new Error('Failed to add verse. Please try again.'));
      })
    );
  }

  /**
   * Updates a verse's confidence level (1-1000)
   */
  updateVerseConfidence(verseId: string, confidence: number, userId: number = this.userId): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/user-verses/${userId}/${verseId}`,
      { confidence: confidence }
    ).pipe(
      catchError(error => {
        console.error('Error updating verse confidence:', error);
        return throwError(() => new Error('Failed to update confidence. Please try again.'));
      })
    );
  }

  /**
   * Gets verse content
   */
  getVerseContent(verseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verses/${verseId}`).pipe(
      catchError(error => {
        console.error('Error fetching verse content:', error);
        return throwError(() => new Error('Failed to load verse content. Please try again.'));
      })
    );
  }

  /**
   * Get user settings
   */
  getUserSettings(userId: number = this.userId): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching user settings:', error);
        return of({});
      })
    );
  }

  /**
   * Update user settings
   */
  updateUserSettings(settings: any, userId: number = this.userId): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/${userId}`, settings).pipe(
      catchError(error => {
        console.error('Error updating settings:', error);
        return throwError(() => new Error('Failed to update settings. Please try again.'));
      })
    );
  }

  // BACKWARDS COMPATIBILITY METHODS - KEPT FOR LEGACY SUPPORT

  // Legacy local storage methods
  private saveProgressToLocalStorage(progress: BookProgress): void {
    try {
      localStorage.setItem('bible-progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  private loadProgressFromLocalStorage(): BookProgress {
    try {
      const savedProgress = localStorage.getItem('bible-progress');
      if (savedProgress) {
        return JSON.parse(savedProgress);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    return this.initializeEmptyProgress();
  }

  // Legacy mock data methods for development/testing
  private getMockProgressData(): Observable<BookProgress> {
    return of(this.initializeEmptyProgress()).pipe(delay(500));
  }

  // Reset all progress data
  public resetProgress(): void {
    const emptyProgress = this.initializeEmptyProgress();
    this.progressSubject.next(emptyProgress);
    // When resetting, also clear from API
    // (future implementation)
  }

  getGroupsInTestament(testament: string): string[] {
    return BIBLE_DATA.getGroupsInTestament(testament);
  }

  
  // Calculate stats for a testament
  public calculateTestamentStats(testament: string): TestamentStats {
    const books = BIBLE_DATA.getTestamentBooks(testament);
    let totalVerses = 0;
    let memorizedVerses = 0;
    let totalChapters = 0;
    let memorizedChapters = 0;
    let inProgressChapters = 0;

    // Track book completion status to calculate metrics
    const bookStats = books.map(book => this.calculateBookStats(book.name));

    // Aggregate statistics across all books
    bookStats.forEach(stats => {
      totalVerses += stats.totalVerses;
      memorizedVerses += stats.memorizedVerses;
      totalChapters += stats.totalChapters;
      memorizedChapters += stats.memorizedChapters;
      inProgressChapters += stats.inProgressChapters;
    });

    // Create the TestamentStats object with base values
    // Let the derived properties be calculated via getters
    return new TestamentStats(
      testament,
      books.map(book => this.calculateBookStats(book.name))
    )
  }

  public resetChapter(bookName: string, chapterIndex: number): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;
    
    const currentProgress = { ...this.progressSubject.value };
    if (!currentProgress[bookName]) {
      return;
    }
    
    // Reset chapter progress
    const verseCount = book.getVerseCount(chapterIndex);
    currentProgress[bookName][chapterIndex] = new ChapterProgress(
      chapterIndex + 1,
      verseCount,
      0,
      false,
      false,
      Array(verseCount).fill(false)
    );
    
    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }
  
  public resetBook(bookName: string): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;
    
    const currentProgress = { ...this.progressSubject.value };
    currentProgress[bookName] = this.initializeEmptyBookProgress(book);
    
    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }
  
  public resetGroup(groupName: string): void {
    const books = BIBLE_DATA.getGroupBooks(groupName);
    const currentProgress = { ...this.progressSubject.value };
    
    books.forEach(book => {
      currentProgress[book.name] = this.initializeEmptyBookProgress(book);
    });
    
    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }
  
  public resetTestament(testament: string): void {
    const books = BIBLE_DATA.getTestamentBooks(testament);
    const currentProgress = { ...this.progressSubject.value };
    
    books.forEach(book => {
      currentProgress[book.name] = this.initializeEmptyBookProgress(book);
    });
    
    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }
  
  private initializeEmptyBookProgress(book: BibleBook): ChapterProgress[] {
    const chapterCount = book.chapters.length;
    const bookProgress = Array(chapterCount);
    
    for (let i = 0; i < chapterCount; i++) {
      const verseCount = book.getVerseCount(i);
      bookProgress[i] = new ChapterProgress(
        i + 1,
        verseCount,
        0,
        false,
        false,
        Array(verseCount).fill(false)
      );
    }
    
    return bookProgress;
  }
}