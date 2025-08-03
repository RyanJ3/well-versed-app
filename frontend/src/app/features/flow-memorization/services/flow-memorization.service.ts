import { Injectable } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { BibleService } from '@services/api/bible.service';
import { FlowVerse } from '../models/flow.models';

@Injectable()
export class FlowMemorizationService {
  private saveQueue$ = new Subject<{ verse: FlowVerse; userId: number }>();
  savedNotification$ = new Subject<void>();

  constructor(private bibleService: BibleService) {
    this.saveQueue$
      .pipe(debounceTime(300))
      .subscribe(({ verse, userId }) => {
        this.saveVerseToBackend(verse, userId);
      });
  }

  queueVerseSave(verse: FlowVerse, userId: number) {
    this.saveQueue$.next({ verse, userId });
  }

  private saveVerseToBackend(verse: FlowVerse, userId: number) {
    const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);

    if (verse.isMemorized) {
      this.bibleService.saveVerse(userId, bookId, chapter, verseNum, 1)
        .subscribe({
          next: () => {
            verse.isSaving = false;
            this.savedNotification$.next();
          },
          error: (error) => {
            console.error('Error saving verse:', error);
            verse.isMemorized = !verse.isMemorized;
            verse.isSaving = false;
            alert('Failed to save verse. Please try again.');
          }
        });
    } else {
      this.bibleService.deleteVerse(userId, bookId, chapter, verseNum)
        .subscribe({
          next: () => {
            verse.isSaving = false;
            this.savedNotification$.next();
          },
          error: (error) => {
            console.error('Error removing verse:', error);
            verse.isMemorized = !verse.isMemorized;
            verse.isSaving = false;
            alert('Failed to remove verse. Please try again.');
          }
        });
    }
  }

  async markAllMemorized(verses: FlowVerse[], bookId: number, userId: number): Promise<void> {
    const chapterGroups = new Map<number, number[]>();

    verses.forEach((verse) => {
      const [_, chapter, verseNum] = verse.verseCode.split('-').map(Number);
      if (!chapterGroups.has(chapter)) {
        chapterGroups.set(chapter, []);
      }
      chapterGroups.get(chapter)!.push(verseNum);
    });

    const savePromises = Array.from(chapterGroups.entries()).map(
      ([chapter, verseNums]) => {
        return Promise.all(
          verseNums.map((verse) =>
            this.bibleService.saveVerse(userId, bookId, chapter, verse, 1).toPromise()
          )
        );
      }
    );

    await Promise.all(savePromises);
    verses.forEach((verse) => {
      verse.isMemorized = true;
    });
    this.savedNotification$.next();
  }

  async deselectAllVerses(verses: FlowVerse[], bookId: number, userId: number): Promise<void> {
    const chapterGroups = new Map<number, number[]>();

    verses.forEach((verse) => {
      const [, chapter, verseNum] = verse.verseCode.split('-').map(Number);
      if (!chapterGroups.has(chapter)) {
        chapterGroups.set(chapter, []);
      }
      chapterGroups.get(chapter)!.push(verseNum);
    });

    const clearPromises = Array.from(chapterGroups.entries()).map(
      ([chapter, verseNums]) => {
        return Promise.all(
          verseNums.map((verse) =>
            this.bibleService.deleteVerse(userId, bookId, chapter, verse).toPromise()
          )
        );
      }
    );

    await Promise.all(clearPromises);
    verses.forEach((verse) => {
      verse.isMemorized = false;
    });
    this.savedNotification$.next();
  }
}
