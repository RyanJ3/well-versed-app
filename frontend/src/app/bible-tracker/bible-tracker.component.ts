import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

// Import models
import { BibleBook, BibleChapter, BibleData, BibleTestament, UserVerseDetail } from '../core/models/bible';
import { BibleVerse } from '../core/models/bible/bible-verse.model';
import { BibleGroup } from '../core/models/bible/bible-group.modle';

// Import services
import { BibleService } from '../core/services/bible.service';
import { UserService } from '../core/services/user.service';
import { ModalService } from '../core/services/modal.service';

// Import sub-components
import { BibleTrackerHeaderComponent } from './components/bible-tracker-header/bible-tracker-header.component';
import { BibleTrackerStatsComponent } from './components/bible-tracker-stats/bible-tracker-stats.component';
import { BibleTrackerTestamentCardComponent } from './components/bible-tracker-testament-card/bible-tracker-testament-card.component';
import { BibleTrackerBookGroupsComponent } from './components/bible-tracker-book-groups/bible-tracker-book-groups.component';
import { BibleTrackerBookGridComponent } from './components/bible-tracker-book-grid/bible-tracker-book-grid.component';
import { BibleTrackerChapterHeatmapComponent } from './components/bible-tracker-chapter-heatmap/bible-tracker-chapter-heatmap.component';
import { BibleTrackerVerseGridComponent } from './components/bible-tracker-verse-grid/bible-tracker-verse-grid.component';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogsModule,
    ButtonsModule,
    BibleTrackerHeaderComponent,
    BibleTrackerStatsComponent,
    BibleTrackerTestamentCardComponent,
    BibleTrackerBookGroupsComponent,
    BibleTrackerBookGridComponent,
    BibleTrackerChapterHeatmapComponent,
    BibleTrackerVerseGridComponent
  ],
  styleUrls: ['./bible-tracker.component.scss'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy {
  private bibleData: BibleData;
  private subscriptions: Subscription = new Subscription();
  
  groupColors: { [key: string]: string } = {
    'Law': '#10b981',
    'History': '#3b82f6',
    'Wisdom': '#8b5cf6',
    'Major Prophets': '#f59e0b',
    'Minor Prophets': '#ef4444',
    'Gospels': '#10b981',
    'Acts': '#3b82f6',
    'Pauline Epistles': '#8b5cf6',
    'General Epistles': '#f59e0b',
    'Revelation': '#ef4444'
  };

  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;
  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;

  userVerses: UserVerseDetail[] = [];
  isLoading = true;
  isSavingBulk = false;
  userId = 1;
  includeApocrypha = false;

  progressViewMode: 'testament' | 'groups' = 'testament';
  progressSegments: any[] = [];

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.bibleData = this.bibleService.getBibleData();
    this.selectedTestament = this.defaultTestament;
    if (this.selectedTestament?.groups.length > 0) {
      this.setGroup(this.defaultGroup);
    }
  }

  ngOnInit() {
    const userSub = this.userService.currentUser$.subscribe(user => {
      if (user) {
        const newSetting = user.includeApocrypha || false;
        if (this.includeApocrypha !== newSetting) {
          this.includeApocrypha = newSetting;
          this.bibleService.updateUserPreferences(newSetting);
          this.loadUserVerses();
        } else if (!this.userVerses.length) {
          this.bibleService.updateUserPreferences(newSetting);
          this.loadUserVerses();
        }
      } else {
        this.loadUserVerses();
      }
    });

    this.subscriptions.add(userSub);
    this.userService.fetchCurrentUser();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadUserVerses() {
    this.isLoading = true;

    this.bibleService.getUserVerses(this.userId, this.includeApocrypha).subscribe({
      next: (verses: any) => {
        this.userVerses = verses;
        this.isLoading = false;
        this.computeProgressSegments();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading verses:', error);
        this.isLoading = false;
        this.modalService.alert(
          'Error Loading Verses',
          'Unable to load your saved verses. Please check your connection and try again.',
          'danger'
        );
        this.cdr.detectChanges();
      }
    });
  }

  toggleProgressView(): void {
    this.progressViewMode = this.progressViewMode === 'testament' ? 'groups' : 'testament';
    this.computeProgressSegments();
    this.cdr.detectChanges();
  }

  private computeProgressSegments(): void {
    if (this.progressViewMode === 'testament') {
      const otVerses = this.oldTestament.memorizedVerses;
      const ntVerses = this.newTestament.memorizedVerses;
      const apoVerses = this.includeApocrypha ? this.apocryphaTestament.memorizedVerses : 0;
      const totalVerses = this.totalVerses;
      const otPercent = Math.round((otVerses / totalVerses) * 100);
      const ntPercent = Math.round((ntVerses / totalVerses) * 100);
      const apoPercent = this.includeApocrypha ? Math.round((apoVerses / totalVerses) * 100) : 0;
      const remainingPercent = 100 - otPercent - ntPercent - apoPercent;

      const segments = [
        { name: 'Old Testament', shortName: 'OT', percent: otPercent, color: '#f59e0b', verses: otVerses },
        { name: 'New Testament', shortName: 'NT', percent: ntPercent, color: '#6366f1', verses: ntVerses }
      ];
      if (this.includeApocrypha) {
        segments.push({ name: 'Apocrypha', shortName: 'Apoc.', percent: apoPercent, color: '#8b5cf6', verses: apoVerses });
      }
      segments.push({ name: 'Remaining', shortName: '', percent: remainingPercent, color: '#e5e7eb', verses: totalVerses - otVerses - ntVerses - apoVerses });

      this.progressSegments = segments;
    } else {
      const segments: any[] = [];
      const totalVerses = this.totalVerses;
      const allGroups = [...this.oldTestament.groups, ...this.newTestament.groups];
      if (this.includeApocrypha) {
        allGroups.push(...this.apocryphaTestament.groups);
      }
      let totalMemorized = 0;

      allGroups.forEach(group => {
        if (group.memorizedVerses > 0) {
          const percent = Math.round((group.memorizedVerses / totalVerses) * 100);
          segments.push({
            name: group.name,
            shortName: this.getGroupShortName(group.name),
            percent,
            color: this.getGroupColor(group.name),
            verses: group.memorizedVerses
          });
          totalMemorized += group.memorizedVerses;
        }
      });

      const remainingPercent = Math.round(((totalVerses - totalMemorized) / totalVerses) * 100);
      if (remainingPercent > 0) {
        segments.push({
          name: 'Remaining',
          shortName: '',
          percent: remainingPercent,
          color: '#e5e7eb',
          verses: totalVerses - totalMemorized
        });
      }

      this.progressSegments = segments;
    }
  }

  toggleAndSaveVerse(verse: BibleVerse): void {
    // Toggle memorized state
    verse.memorized = !verse.memorized;
    this.saveVerse(verse);
  }

  saveVerse(verse: BibleVerse) {
    // Get book and chapter from the current selection context
    if (!this.selectedBook || !this.selectedChapter) {
      console.error('No book or chapter selected');
      return;
    }

    if (verse.memorized) {
      const practiceCount = 1;
      this.bibleService.saveVerse(
        this.userId,
        this.selectedBook.id,
        this.selectedChapter.chapterNumber,
        verse.verseNumber,
        practiceCount
      ).subscribe({
        next: (response: any) => {
          // Update verse properties if they exist
          verse.practiceCount = practiceCount;
          verse.lastPracticed = new Date();
          this.computeProgressSegments();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          verse.memorized = !verse.memorized;
          this.modalService.alert(
            'Error Saving Verse',
            'Unable to save this verse. Please try again.',
            'danger'
          );
          this.cdr.detectChanges();
        }
      });
    } else {
      this.bibleService.deleteVerse(
        this.userId,
        this.selectedBook.id,
        this.selectedChapter.chapterNumber,
        verse.verseNumber
      ).subscribe({
        next: (response: any) => {
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
          this.computeProgressSegments();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          verse.memorized = !verse.memorized;
          this.modalService.alert(
            'Error Removing Verse',
            'Unable to remove this verse. Please try again.',
            'danger'
          );
          this.cdr.detectChanges();
        }
      });
    }
  }

  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length > 0) {
      this.setGroup(testament.groups[0]);
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length > 0) {
      this.setBook(group.books[0]);
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    const visibleChapters = this.getVisibleChapters(book);
    if (visibleChapters.length > 0) {
      this.setChapter(visibleChapters[0]);
    }
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  selectAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.saveChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = true;
          verse.practiceCount = 1;
          verse.lastPracticed = new Date();
        });
        this.isSavingBulk = false;
        this.computeProgressSegments();
        this.modalService.success(
          'Chapter Saved',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been marked as memorized.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Chapter',
          'Unable to save all verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  async clearAllVerses(): Promise<void> {
    if (!this.selectedChapter || !this.selectedBook) return;

    const confirmed = await this.modalService.danger(
      'Clear All Verses?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name} ${this.selectedChapter.chapterNumber}? This action cannot be undone.`,
      'Clear Verses'
    );

    if (!confirmed) return;

    this.isSavingBulk = true;

    this.bibleService.clearChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = false;
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
        });
        this.isSavingBulk = false;
        this.computeProgressSegments();
        this.modalService.success(
          'Chapter Cleared',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been cleared.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Clearing Chapter',
          'Unable to clear verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  selectAllChapters(): void {
    if (!this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.saveBook(
      this.userId,
      this.selectedBook.id
    ).subscribe({
      next: () => {
        this.selectedBook!.chapters.forEach(ch => ch.selectAllVerses());
        this.isSavingBulk = false;
        this.computeProgressSegments();
        this.modalService.success(
          'Book Saved',
          `${this.selectedBook!.name} has been marked as memorized.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Book',
          'Unable to save all chapters in this book. Please try again.',
          'danger'
        );
      }
    });
  }

  async clearAllChapters(): Promise<void> {
    if (!this.selectedBook) return;

    const confirmed = await this.modalService.danger(
      'Clear All Chapters?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name}? This action cannot be undone.`,
      'Clear Chapters'
    );

    if (!confirmed) return;

    this.isSavingBulk = true;

    this.bibleService.clearBook(
      this.userId,
      this.selectedBook.id
    ).subscribe({
      next: () => {
        this.selectedBook!.chapters.forEach(ch => ch.clearAllVerses());
        this.isSavingBulk = false;
        this.computeProgressSegments();
        this.modalService.success(
          'Book Cleared',
          `${this.selectedBook!.name} has been cleared.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Clearing Book',
          'Unable to clear chapters in this book. Please try again.',
          'danger'
        );
      }
    });
  }

  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }

  getVisibleChapters(book: BibleBook): BibleChapter[] {
    return book.chapters.filter(chapter => this.isChapterVisible(chapter));
  }

  getGroupShortName(groupName: string): string {
    const shortNames: { [key: string]: string } = {
      'Law': 'Law',
      'History': 'History',
      'Wisdom': 'Wisdom',
      'Major Prophets': 'Major',
      'Minor Prophets': 'Minor',
      'Gospels': 'Gospels',
      'Acts': 'Acts',
      'Pauline Epistles': 'Pauline',
      'General Epistles': 'General',
      'Revelation': 'Rev'
    };
    return shortNames[groupName] || groupName;
  }

  getGroupColor(groupName: string): string {
    return this.groupColors[groupName] || '#6b7280';
  }

  // Getters
  get testaments(): BibleTestament[] {
    return this.bibleData.testaments;
  }

  get oldTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('NEW');
  }

  get apocryphaTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('APOCRYPHA');
  }

  get defaultTestament(): BibleTestament {
    return this.oldTestament;
  }

  get defaultGroup(): BibleGroup {
    return this.defaultBook.group;
  }

  get defaultBook(): BibleBook {
    return this.bibleData.getBookByName("Genesis");
  }

  get percentComplete(): number {
    return this.bibleData.percentComplete;
  }

  get totalVerses(): number {
    return this.bibleData.totalVerses;
  }

  get memorizedVerses(): number {
    return this.bibleData.memorizedVerses;
  }
}