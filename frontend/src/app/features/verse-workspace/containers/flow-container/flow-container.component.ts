import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FlowMemorizationFacade } from '../../facades/flow-memorization.facade';
import { BaseVerse } from '../../models/verse-types.model';
import { VerseGridComponent } from '../../components/verse-grid/verse-grid.component';
import { FlowHeaderComponent } from '../../components/flow-header/flow-header.component';
import { FlowFiltersComponent } from '../../components/flow-filters/flow-filters.component';
import { StudyModalComponent } from '../../components/study-modal/study-modal.component';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';

/**
 * Smart Container Component
 * Manages state and business logic, delegates presentation to dumb components
 */
@Component({
  selector: 'app-flow-container',
  standalone: true,
  imports: [
    CommonModule,
    VerseGridComponent,
    FlowHeaderComponent,
    FlowFiltersComponent,
    StudyModalComponent,
    ContextMenuComponent
  ],
  template: `
    <div class="flow-container" [attr.data-mode]="mode$ | async">
      <!-- Header -->
      <app-flow-header
        [currentBook]="currentBook$ | async"
        [currentChapter]="currentChapter$ | async"
        [progress]="memorizationProgress$ | async"
        [mode]="mode$ | async"
        (bookChange)="onBookChange($event)"
        (chapterChange)="onChapterChange($event)"
        (modeChange)="onModeChange($event)"
        (startStudy)="onStartStudy()"
      />
      
      <!-- Filters -->
      <app-flow-filters
        [searchTerm]="searchTerm$ | async"
        [activeFilter]="activeFilter$ | async"
        [filterFlags]="filterFlags$ | async"
        (searchChange)="onSearchChange($event)"
        (filterToggle)="onFilterToggle($event)"
        (clearFilters)="onClearFilters()"
      />
      
      <!-- Main Content -->
      <div class="flow-content">
        <!-- Loading State -->
        <div *ngIf="isLoading$ | async" class="loading-overlay">
          <div class="spinner"></div>
          <p>Loading verses...</p>
        </div>
        
        <!-- Error State -->
        <div *ngIf="error$ | async as error" class="error-message">
          <p>{{ error }}</p>
          <button (click)="onRetry()">Retry</button>
        </div>
        
        <!-- Verse Grid -->
        <app-verse-grid
          *ngIf="!(isLoading$ | async)"
          [verses]="filteredVerses$ | async"
          [selectedVerses]="selectedVerses$ | async"
          [memorizedVerseIds]="memorizedVerseIds$ | async"
          [fontSize]="fontSize$ | async"
          [layoutMode]="layoutMode$ | async"
          [showFullText]="showFullText$ | async"
          [searchTerm]="searchTerm$ | async"
          (verseClick)="onVerseClick($event)"
          (verseDoubleClick)="onVerseDoubleClick($event)"
          (verseContextMenu)="onVerseContextMenu($event)"
          (verseMemorizedToggle)="onVerseMemorizedToggle($event)"
          (selectionChange)="onSelectionChange($event)"
        />
      </div>
      
      <!-- Study Modal -->
      <app-study-modal
        *ngIf="isStudyActive$ | async"
        [currentVerse]="currentStudyVerse$ | async"
        [progress]="studyProgress$ | async"
        [stats]="studyStats$ | async"
        (next)="onStudyNext()"
        (previous)="onStudyPrevious()"
        (recordAttempt)="onRecordAttempt($event)"
        (close)="onStudyClose()"
      />
      
      <!-- Context Menu -->
      <app-context-menu
        *ngIf="contextMenu$ | async as menu"
        [visible]="menu.visible"
        [position]="menu.position"
        [verseCode]="menu.verseCode"
        (action)="onContextMenuAction($event)"
        (close)="onContextMenuClose()"
      />
    </div>
  `,
  styleUrls: ['./flow-container.component.scss']
})
export class FlowContainerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable streams from facade
  verses$ = this.facade.filteredVerses$;
  filteredVerses$ = this.facade.filteredVerses$;
  selectedVerses$ = this.facade.selectedVerses$;
  memorizedVerseIds$ = this.facade.memorizedVerses$.pipe(
    map(verses => new Set(verses.map(v => v.verseCode)))
  );
  
  currentBook$ = this.facade.currentBook$;
  currentChapter$ = this.facade.currentChapter$;
  memorizationProgress$ = this.facade.memorizationProgress$;
  
  mode$ = this.facade.mode$;
  fontSize$ = this.facade.fontSize$;
  layoutMode$ = this.facade.layoutMode$;
  showFullText$ = this.facade.showFullText$;
  
  searchTerm$ = this.facade.searchTerm$;
  activeFilter$ = this.facade.activeFilter$;
  filterFlags$ = this.facade.filterFlags$;
  
  isLoading$ = this.facade.isLoading$;
  error$ = this.facade.error$;
  
  isStudyActive$ = this.facade.isStudyActive$;
  currentStudyVerse$ = this.facade.currentStudyVerse$;
  studyProgress$ = this.facade.studyProgress$;
  studyStats$ = this.facade.studyStats$;
  
  contextMenu$ = this.facade.contextMenu$;
  
  constructor(private facade: FlowMemorizationFacade) {}
  
  ngOnInit(): void {
    // Load initial data
    this.facade.loadChapter(1, 1);
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Event Handlers - Delegate to Facade
  
  onBookChange(bookId: number): void {
    this.facade.changeBook(bookId);
  }
  
  onChapterChange(chapter: number): void {
    this.facade.currentBook$
      .pipe(take(1))
      .subscribe(book => {
        this.facade.loadChapter(book.id, chapter);
      });
  }
  
  onModeChange(mode: 'memorization' | 'crossReferences' | 'topical'): void {
    switch (mode) {
      case 'memorization':
        this.facade.switchToMemorizationMode();
        break;
      case 'crossReferences':
        this.facade.switchToCrossReferencesMode();
        break;
      case 'topical':
        this.facade.switchToTopicalMode();
        break;
    }
  }
  
  onStartStudy(): void {
    this.facade.startStudySession();
  }
  
  onSearchChange(searchTerm: string): void {
    this.facade.setSearchTerm(searchTerm);
  }
  
  onFilterToggle(filterType: 'memorized' | 'toLearn' | 'review'): void {
    this.facade.toggleFilter(filterType);
  }
  
  onClearFilters(): void {
    this.facade.clearFilters();
  }
  
  onVerseClick(event: { verse: BaseVerse; multiSelect: boolean }): void {
    this.facade.selectVerse(event.verse.verseCode, event.multiSelect);
  }
  
  onVerseDoubleClick(verse: BaseVerse): void {
    this.facade.navigateToVerse(verse.verseCode);
  }
  
  onVerseContextMenu(event: { verse: BaseVerse; x: number; y: number }): void {
    this.facade.showContextMenu(event.verse.verseCode, event.x, event.y);
  }
  
  onVerseMemorizedToggle(verse: BaseVerse): void {
    this.facade.toggleMemorized(verse.verseCode);
  }
  
  onSelectionChange(verseCodes: string[]): void {
    // Handle batch selection changes if needed
  }
  
  onStudyNext(): void {
    this.facade.nextStudyVerse();
  }
  
  onStudyPrevious(): void {
    this.facade.previousStudyVerse();
  }
  
  onRecordAttempt(result: { verseCode: string; correct: boolean }): void {
    this.facade.recordStudyAttempt(result.verseCode, result.correct);
  }
  
  onStudyClose(): void {
    this.facade.endStudySession();
  }
  
  onContextMenuAction(action: { type: string; verseCode: string }): void {
    switch (action.type) {
      case 'memorize':
        this.facade.toggleMemorized(action.verseCode);
        break;
      case 'study':
        this.facade.startStudySession([action.verseCode]);
        break;
      case 'crossReferences':
        this.facade.switchToCrossReferencesMode(action.verseCode);
        break;
      // Add more actions as needed
    }
    this.facade.hideContextMenu();
  }
  
  onContextMenuClose(): void {
    this.facade.hideContextMenu();
  }
  
  onRetry(): void {
    this.facade.currentLocation$
      .pipe(take(1))
      .subscribe(location => {
        this.facade.loadChapter(location.bookId, location.chapter);
      });
  }
  
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    this.facade.handleKeyboardShortcut(event);
  }
  
  private setupKeyboardShortcuts(): void {
    // Additional keyboard shortcut setup if needed
  }
}

import { map, take } from 'rxjs/operators';