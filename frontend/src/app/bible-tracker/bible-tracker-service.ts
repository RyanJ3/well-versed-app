// bible-tracker.service.ts - Service for managing Bible memorization data with backend simulation
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  BIBLE_DATA,
  BibleBook,
  BookProgress,
  BookStats,
  GroupStats,
  ChapterProgress,
  TestamentStats,
} from './models';

@Injectable({
  providedIn: 'root',
})
export class BibleTrackerService {
  private progressSubject = new BehaviorSubject<BookProgress>({});
  public progress$ = this.progressSubject.asObservable();

  // Simulated backend latency (in ms)
  private apiLatency = 300;

  constructor() {
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

  public incrementVerses(bookName: string, chapterIndex: number): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const maxVerses = book.getVerseCount(chapterIndex);
    const currentProgress = { ...this.progressSubject.value };

    // Ensure the book entry exists
    if (!currentProgress[bookName]) {
      currentProgress[bookName] =
        this.initializeEmptyProgress()[bookName] || [];
    }

    // Ensure chapter entry exists
    if (!currentProgress[bookName][chapterIndex]) {
      currentProgress[bookName][chapterIndex] = new ChapterProgress(
        chapterIndex + 1,
        maxVerses,
        0,
        false,
        false,
      );
    }

    const chapter = currentProgress[bookName][chapterIndex];
    const versesMemorized = [
      ...(chapter.versesMemorized || Array(maxVerses).fill(false)),
    ];

    // Find the first unmemorized verse and mark it as memorized
    let incremented = false;
    for (let i = 0; i < versesMemorized.length; i++) {
      if (!versesMemorized[i]) {
        versesMemorized[i] = true;
        incremented = true;
        break;
      }
    }

    if (incremented) {
      const memorizedCount = versesMemorized.filter((v) => v).length;

      currentProgress[bookName][chapterIndex] = new ChapterProgress(
        chapterIndex + 1,
        maxVerses,
        memorizedCount,
        memorizedCount > 0,
        memorizedCount === maxVerses,
        versesMemorized,
      );

      this.progressSubject.next(currentProgress);
      this.saveProgressToAPI(currentProgress).subscribe();
    }
  }

  public decrementVerses(bookName: string, chapterIndex: number): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const maxVerses = book.getVerseCount(chapterIndex);
    const currentProgress = { ...this.progressSubject.value };

    // Handle case where book or chapter doesn't exist yet
    if (
      !currentProgress[bookName] ||
      !currentProgress[bookName][chapterIndex]
    ) {
      return;
    }

    const chapter = currentProgress[bookName][chapterIndex];
    const versesMemorized = [...(chapter.versesMemorized || [])];

    // Find the last memorized verse and mark it as not memorized
    let decremented = false;
    for (let i = versesMemorized.length - 1; i >= 0; i--) {
      if (versesMemorized[i]) {
        versesMemorized[i] = false;
        decremented = true;
        break;
      }
    }

    if (decremented) {
      const memorizedCount = versesMemorized.filter((v) => v).length;

      currentProgress[bookName][chapterIndex] = new ChapterProgress(
        chapterIndex + 1,
        maxVerses,
        memorizedCount,
        memorizedCount > 0,
        false,
        versesMemorized,
      );

      this.progressSubject.next(currentProgress);
      this.saveProgressToAPI(currentProgress).subscribe();
    }
  }

  public resetChapter(bookName: string, chapterIndex: number): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const maxVerses = book.getVerseCount(chapterIndex);
    const currentProgress = { ...this.progressSubject.value };

    // Ensure the book entry exists
    if (!currentProgress[bookName]) {
      currentProgress[bookName] =
        this.initializeEmptyProgress()[bookName] || [];
    }

    currentProgress[bookName][chapterIndex] = new ChapterProgress(
      chapterIndex + 1,
      maxVerses,
      0,
      false,
      false,
    );

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  public calculateBookStats(bookName: string): BookStats {
    const book = BIBLE_DATA.getBookByName(bookName);
    const currentProgress = this.progressSubject.value;
    const bookProgress = currentProgress[bookName];

    if (!book || !bookProgress) {
      return new BookStats();
    }

    let memorizedVerses = 0;
    bookProgress.forEach((chapter) => {
      if (chapter && chapter.versesMemorized) {
        memorizedVerses += chapter.versesMemorized.filter((v) => v).length;
      }
    });

    const completedChapters = bookProgress.filter((ch) => ch?.completed).length;
    const inProgressChapters = bookProgress.filter(
      (ch) => ch?.inProgress && !ch?.completed,
    ).length;

    return new BookStats(
      book.getTotalVerses()
        ? Math.round((memorizedVerses / book.getTotalVerses()) * 100)
        : 0,
      memorizedVerses,
      book.getTotalVerses(),
      completedChapters,
      inProgressChapters,
    );
  }

  public getTestaments(): string[] {
    return BIBLE_DATA.getTestaments();
  }

  public getBooksInGroup(group: string): BibleBook[] {
    return BIBLE_DATA.getBooksByGroup(group);
  }

  public getGroupsInTestament(testament: string): string[] {
    return BIBLE_DATA.getGroupsInTestament(testament);
  }

  public calculateGroupStats(group: string): GroupStats {
    let groupMemorizedVerses = 0;
    let groupTotalVerses = 0;
    let groupCompletedChapters = 0;
    let groupTotalChapters = 0;

    const currentProgress = this.progressSubject.value;
    const booksInGroup = BIBLE_DATA.getBooksByGroup(group);

    booksInGroup.forEach((book) => {
      groupTotalVerses += book.getTotalVerses();
      groupTotalChapters += book.getTotalChapters();

      if (currentProgress[book.name]) {
        currentProgress[book.name].forEach((chapter) => {
          if (chapter) {
            if (chapter.versesMemorized) {
              groupMemorizedVerses += chapter.versesMemorized.filter(
                (v) => v,
              ).length;
            } else {
              groupMemorizedVerses += chapter.memorizedVerses || 0;
            }

            if (chapter.completed) {
              groupCompletedChapters++;
            }
          }
        });
      }
    });

    return new GroupStats(
      groupTotalVerses
        ? Math.round((groupMemorizedVerses / groupTotalVerses) * 100)
        : 0,
      groupCompletedChapters,
      groupTotalChapters,
    );
  }

  public calculateTestamentStats(testament: string): TestamentStats {
    // Get all books in the testament using the strongly typed API
    const booksInTestament: BibleBook[] =
      BIBLE_DATA.getBooksByTestament(testament);

    // Initialize counters with explicit types
    let memorizedVerses: number = 0;
    let totalVerses: number = 0;
    let completedChapters: number = 0;

    // Calculate total chapters using the book methods
    const totalChapters: number = booksInTestament.reduce(
      (sum: number, book: BibleBook) => sum + book.getTotalChapters(),
      0,
    );

    // Get current progress from this service (not recursively)
    const progress: BookProgress = this.progressSubject.value;

    // Calculate total verses in testament using book methods
    totalVerses = booksInTestament.reduce(
      (sum: number, book: BibleBook) => sum + book.getTotalVerses(),
      0,
    );

    // Calculate memorized verses and completed chapters
    booksInTestament.forEach((book: BibleBook) => {
      const bookName: string = book.name;
      const bookProgress: ChapterProgress[] | undefined = progress[bookName];

      if (bookProgress) {
        bookProgress.forEach((chapterProgress: ChapterProgress) => {
          if (chapterProgress) {
            // Count memorized verses using the versesMemorized array
            if (
              chapterProgress.versesMemorized &&
              Array.isArray(chapterProgress.versesMemorized)
            ) {
              memorizedVerses += chapterProgress.versesMemorized.filter(
                (v: boolean) => v,
              ).length;
            } else {
              // Fallback to legacy property
              memorizedVerses += chapterProgress.memorizedVerses || 0;
            }

            // Count completed chapters
            if (chapterProgress.completed === true) {
              completedChapters++;
            }
          }
        });
      }
    });

    // Calculate percentage with explicit type
    const percentComplete: number =
      totalVerses > 0 ? Math.round((memorizedVerses / totalVerses) * 100) : 0;

    return new TestamentStats(
      percentComplete,
      memorizedVerses,
      totalVerses,
      completedChapters,
      totalChapters,
    );
  }

  public updateChapterProgress(
    bookName: string,
    chapterIndex: number,
    newValue: number,
  ): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const maxVerses = book.getVerseCount(chapterIndex);
    const currentProgress = { ...this.progressSubject.value };

    // Ensure the book entry exists
    if (!currentProgress[bookName]) {
      currentProgress[bookName] = Array(book.getTotalChapters())
        .fill(null)
        .map((_, i) => {
          return new ChapterProgress(
            i + 1,
            book.getVerseCount(i),
            0,
            false,
            false,
          );
        });
    }

    // Create a new boolean array for verse tracking
    const versesMemorized = Array(maxVerses).fill(false);
    // Mark the first 'newValue' verses as memorized
    for (let i = 0; i < newValue && i < maxVerses; i++) {
      versesMemorized[i] = true;
    }

    currentProgress[bookName][chapterIndex] = new ChapterProgress(
      chapterIndex + 1,
      maxVerses,
      newValue,
      newValue > 0,
      newValue === maxVerses,
      versesMemorized,
    );

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  public resetBook(bookName: string): void {
    const book = BIBLE_DATA.getBookByName(bookName);
    if (!book) return;

    const currentProgress = { ...this.progressSubject.value };

    // Reset all chapters in the book
    currentProgress[bookName] = Array(book.getTotalChapters())
      .fill(null)
      .map((_, i) => {
        return new ChapterProgress(
          i + 1,
          book.getVerseCount(i),
          0,
          false,
          false,
        );
      });

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  public resetGroup(group: string): void {
    const currentProgress = { ...this.progressSubject.value };
    const booksInGroup = BIBLE_DATA.getBooksByGroup(group);

    booksInGroup.forEach((book) => {
      currentProgress[book.name] = Array(book.getTotalChapters())
        .fill(null)
        .map((_, i) => {
          return new ChapterProgress(
            i + 1,
            book.getVerseCount(i),
            0,
            false,
            false,
          );
        });
    });

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  public resetTestament(testament: string): void {
    const currentProgress = { ...this.progressSubject.value };
    const booksInTestament = BIBLE_DATA.getBooksByTestament(testament);

    booksInTestament.forEach((book) => {
      currentProgress[book.name] = Array(book.getTotalChapters())
        .fill(null)
        .map((_, i) => {
          return new ChapterProgress(
            i + 1,
            book.getVerseCount(i),
            0,
            false,
            false,
          );
        });
    });

    this.progressSubject.next(currentProgress);
    this.saveProgressToAPI(currentProgress).subscribe();
  }

  /**
   * Fetches user progress from the backend
   */
  private fetchProgressFromAPI(): Observable<BookProgress> {
    // Create some sample progress data for demonstration
    const dummyProgress = this.initializeEmptyProgress();
    const johnBook = BIBLE_DATA.getBookByName('John');
    const psalmsBook = BIBLE_DATA.getBookByName('Psalms');
    const romansBook = BIBLE_DATA.getBookByName('Romans');

    // Add some progress to John
    if (johnBook && dummyProgress['John'] && dummyProgress['John'].length > 0) {
      // Chapter 1 completed
      const versesMemorized1 = [true, true, false, true];
      dummyProgress['John'][0] = new ChapterProgress(
        1, // chapter
        versesMemorized1.length, // totalVerses
        versesMemorized1.filter((v) => v).length, // memorizedVerses
        false, // inProgress
        true, // completed
        versesMemorized1, // versesMemorized
      );

      // Chapter 2 in progress
      const versesMemorized2 = [false, true, false, true];
      dummyProgress['John'][1] = new ChapterProgress(
        2,
        versesMemorized2.length,
        15, // We're keeping the original count for consistency
        true,
        false,
        versesMemorized2,
      );

      // Chapter 3 in progress
      const versesMemorized3 = [false, true, false, true];
      dummyProgress['John'][2] = new ChapterProgress(
        3,
        versesMemorized3.length,
        20, // Original count preserved
        true,
        false,
        versesMemorized3,
      );
    }

    // Add some progress to Psalms
    if (
      psalmsBook &&
      dummyProgress['Psalms'] &&
      dummyProgress['Psalms'].length > 0
    ) {
      // A few completed psalms
      for (let i = 0; i < 10; i++) {
        if (dummyProgress['Psalms'][i]) {
          const verseCount = psalmsBook.getVerseCount(i);
          const versesMemorized = Array(verseCount > 6 ? verseCount : 6).fill(
            true,
          );
          dummyProgress['Psalms'][i] = new ChapterProgress(
            i + 1,
            versesMemorized.length,
            versesMemorized.length,
            true,
            true,
            versesMemorized,
          );
        }
      }
    }

    // Add some progress to Romans
    if (
      romansBook &&
      dummyProgress['Romans'] &&
      dummyProgress['Romans'].length > 0
    ) {
      // Romans 8 completed
      const versesMemorized = [false, true, false, true];
      dummyProgress['Romans'][7] = new ChapterProgress(
        8,
        versesMemorized.length,
        39, // Original count
        true,
        false,
        versesMemorized,
      );
    }

    // Simulate network delay
    return of(dummyProgress).pipe(delay(this.apiLatency));
  }

  /**
   * Saves user progress to the backend
   */
  private saveProgressToAPI(progress: BookProgress): Observable<boolean> {
    // This is where you would make your actual API call in the future
    // For now, we're just simulating a successful save with a delay
    console.log('Saving progress to API:', progress);
    return of(true).pipe(delay(this.apiLatency));
  }

  /**
   * Initializes empty progress for all books
   */
  private initializeEmptyProgress(): BookProgress {
    const initialProgress: BookProgress = {};

    BIBLE_DATA.books.forEach((book) => {
      const bookName = book.name;
      initialProgress[bookName] = Array(book.getTotalChapters())
        .fill(null)
        .map((_, i) => {
          const chapterVerseCount = book.getVerseCount(i);
          return new ChapterProgress(
            i + 1, // chapter
            chapterVerseCount, // totalVerses
            0, // memorizedVerses
            false, // inProgress
            false, // completed
            Array(chapterVerseCount).fill(false), // versesMemorized
          );
        });
    });

    return initialProgress;
  }

  /**
   * Migrates data from older formats to current format
   */
  private migrateProgressData(progress: BookProgress): BookProgress {
    const updatedProgress: BookProgress = { ...progress };

    Object.entries(updatedProgress).forEach(([bookName, chapters]) => {
      const book = BIBLE_DATA.getBookByName(bookName);
      if (chapters && book) {
        updatedProgress[bookName] = chapters.map(
          (chapter: ChapterProgress, chapterIndex: number) => {
            if (!chapter) {
              return new ChapterProgress(
                chapterIndex + 1,
                book.getVerseCount(chapterIndex),
                0,
                false,
                false,
              );
            }

            // Use the static factory method
            return ChapterProgress.fromExistingData(
              chapter,
              book.getVerseCount(chapterIndex),
            );
          },
        );
      }
    });

    return updatedProgress;
  }

  /**
   * Loads user progress from API or initializes empty progress
   */
  private loadProgress(): void {
    this.fetchProgressFromAPI().subscribe(
      (progress) => {
        // Migrate old data format if needed
        const migratedProgress = this.migrateProgressData(progress);
        this.progressSubject.next(migratedProgress);
      },
      (error) => {
        console.error('Error loading progress data:', error);
        // In case of error, initialize with empty progress
        this.progressSubject.next(this.initializeEmptyProgress());
      },
    );
  }

  /**
   * Retrieves a chapter's progress
   */
  public getChapterProgress(
    bookName: string,
    chapterIndex: number,
  ): ChapterProgress {
    const currentProgress = this.progressSubject.value;
    if (
      !currentProgress[bookName] ||
      !currentProgress[bookName][chapterIndex]
    ) {
      return new ChapterProgress(chapterIndex + 1, 0, 0, false, false);
    }
    return currentProgress[bookName][chapterIndex];
  }
}
