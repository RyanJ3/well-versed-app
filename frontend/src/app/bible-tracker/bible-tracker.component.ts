// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {BIBLE_DATA, BibleBook, BookProgress, ChapterProgress} from './models';
import {BibleTrackerService} from './bible-tracker-service';
import {TestamentSelectorComponent} from './components/testament-selector.component';
import {GroupSelectorComponent} from './components/group-selector.component';
import {BookSelectorComponent} from './components/book-selector.component';
import {ChapterSelectorComponent} from './components/chapter-selector.component';
import {ChapterProgressComponent} from './components/chapter-progress.component';
import {BookInfoComponent} from "./components/book-info.component";

@Component({
    selector: 'app-bible-tracker',
    templateUrl: './bible-tracker.component.html',
    imports: [
        TestamentSelectorComponent,
        GroupSelectorComponent,
        BookSelectorComponent,
        BookInfoComponent,
        ChapterSelectorComponent,
        ChapterProgressComponent
    ],
    styleUrls: ['./bible-tracker.component.css']
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
    // Data sources
    testaments: string[] = [];
    availableGroups: string[] = [];
    booksInGroup: { [key: string]: BibleBook } = {};
    progress: BookProgress = {};

    // Selection state
    selectedTestament: string = "Old Testament";
    selectedGroup: string = "Wisdom";
    selectedBook: string = 'Psalms';
    selectedChapter: number = 1;

    // Current book data
    currentBook: BibleBook | null = null;
    currentBookProgress: ChapterProgress[] = [];

    // Selected chapter data
    selectedChapterIndex: number = 0;
    selectedChapterVerses: number = 0;
    selectedChapterMemorized: number = 0;

    // Book statistics
    memorizedVerses: number = 0;
    totalVerses: number = 0;
    completedChapters: number = 0;
    inProgressChapters: number = 0;

    private destroy$ = new Subject<void>();

    constructor(private bibleTrackerService: BibleTrackerService) {
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onTestamentChange(testament: string): void {
        this.selectedTestament = testament;

        // Get available groups for this testament
        this.availableGroups = this.bibleTrackerService.getGroupsInTestament(testament);

        // Select first group in the testament
        if (this.availableGroups.length > 0) {
            this.onGroupChange(this.availableGroups[0]);
        }
    }

    onBookChange(bookName: string): void {
        this.selectedBook = bookName;
        this.selectedChapter = 1;
        this.updateSelections();
    }

    onChapterSelect(chapterNumber: number): void {
        this.selectedChapter = chapterNumber;
        this.updateSelections();
    }

    getGroupStats(group: string): { percentComplete: number, completedChapters: number, totalChapters: number } {
        return this.bibleTrackerService.calculateGroupStats(group);
    }

    getTestamentStats(testament: string): { percentComplete: number } {
        return this.bibleTrackerService.calculateTestamentStats(testament);
    }

    getBookStats(bookName: string): number {
        const stats = this.bibleTrackerService.calculateBookStats(bookName);
        return stats.percentComplete;
    }

    incrementVerses(): void {
        this.bibleTrackerService.incrementVerses(this.selectedBook, this.selectedChapterIndex);
    }

    decrementVerses(): void {
        this.bibleTrackerService.decrementVerses(this.selectedBook, this.selectedChapterIndex);
    }

    updateChapterProgress(newValue: number): void {
        this.bibleTrackerService.updateChapterProgress(this.selectedBook, this.selectedChapterIndex, newValue);
    }

    resetChapter(): void {
        this.bibleTrackerService.resetChapter(this.selectedBook, this.selectedChapterIndex);
    }

    resetBook(): void {
        this.bibleTrackerService.resetBook(this.selectedBook);
    }

    resetGroup(): void {
        this.bibleTrackerService.resetGroup(this.selectedGroup);
    }

    resetTestament(): void {
        this.bibleTrackerService.resetTestament(this.selectedTestament);
    }

    createArray(length: number): any[] {
        return Array(length).fill(null);
    }

    trackByFn(index: number): number {
        return index;
    }

    onGroupChange(group: string): void {
        this.selectedGroup = group;

        // Get books in this group
        this.booksInGroup = this.bibleTrackerService.getBooksInGroup(group);

        // Select first book in the group by canonical order, not alphabetically
        const bookNames = Object.entries(this.booksInGroup)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([name, _]) => name);

        if (bookNames.length > 0) {
            this.onBookChange(bookNames[0]);
        }
    }

    // Add to bible-tracker.component.ts
    updateMemorizedVerses(selectedVerses: number[]): void {
        this.bibleTrackerService.updateMemorizedVerses(
            this.selectedBook,
            this.selectedChapterIndex,
            selectedVerses
        );

        // Force an immediate update of book statistics
        this.updateBookStatistics();
    }

    // Update selection methods
    ngOnInit(): void {
        // Get testaments and sort them to put Old Testament first
        this.testaments = this.bibleTrackerService.getTestaments()
            .sort((a, b) => {
                // Make sure Old Testament comes before New Testament
                if (a.includes('Old') && b.includes('New')) return -1;
                if (a.includes('New') && b.includes('Old')) return 1;
                return a.localeCompare(b);
            });

        // Subscribe to progress changes
        this.bibleTrackerService.progress$
            .pipe(takeUntil(this.destroy$))
            .subscribe(progress => {
                this.progress = progress;
                this.updateSelections();
                this.updateBookStatistics();
            });

        // Set initial selections
        this.onTestamentChange(this.selectedTestament);
    }

    private updateSelections(): void {
        // Update available groups
        this.availableGroups = this.bibleTrackerService.getGroupsInTestament(this.selectedTestament);

        // Update books in selected group
        this.booksInGroup = this.bibleTrackerService.getBooksInGroup(this.selectedGroup);

        // Update current book
        this.currentBook = BIBLE_DATA[this.selectedBook] || null;

        // Update current book progress
        if (this.currentBook && this.progress[this.selectedBook]) {
            this.currentBookProgress = this.progress[this.selectedBook];
        } else if (this.currentBook) {
            this.currentBookProgress = Array(this.currentBook.totalChapters).fill(null).map((_, i) => ({
                chapter: i + 1,
                memorizedVerses: 0,
                inProgress: false,
                versesMemorized: [false, true, false, true],
                completed: false
            }));
        } else {
            this.currentBookProgress = [];
        }

        // Update selected chapter
        this.selectedChapterIndex = this.selectedChapter - 1;
        if (this.currentBook && this.selectedChapterIndex >= 0 && this.selectedChapterIndex < this.currentBook.chapters.length) {
            this.selectedChapterVerses = this.currentBook.chapters[this.selectedChapterIndex];
            this.selectedChapterMemorized = this.currentBookProgress[this.selectedChapterIndex]?.memorizedVerses || 0;
        } else {
            this.selectedChapterVerses = 0;
            this.selectedChapterMemorized = 0;
        }

        // Update book statistics
        if (this.currentBook) {
            const stats = this.bibleTrackerService.calculateBookStats(this.selectedBook);
            this.memorizedVerses = stats.memorizedVerses;
            this.totalVerses = stats.totalVerses;
            this.completedChapters = stats.completedChapters;
            this.inProgressChapters = stats.inProgressChapters;
        } else {
            this.memorizedVerses = 0;
            this.totalVerses = 0;
            this.completedChapters = 0;
            this.inProgressChapters = 0;
        }
    }

    // Add helper method to update book statistics
    private updateBookStatistics(): void {
        if (this.currentBook) {
            const stats = this.bibleTrackerService.calculateBookStats(this.selectedBook);
            this.memorizedVerses = stats.memorizedVerses;
            this.totalVerses = stats.totalVerses;
            this.completedChapters = stats.completedChapters;
            this.inProgressChapters = stats.inProgressChapters;
        }
    }
}
