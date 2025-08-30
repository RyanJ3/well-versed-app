import { Injectable } from '@angular/core';
import { combineLatest, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

// Models
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceMode } from '../../models/workspace-mode.enum';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';
import { BibleBook, BibleChapter } from '@models/bible';

// Services
import { BibleService } from '@services/api/bible.service';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';
import { NotificationService } from '@services/utils/notification.service';

// Facades
import { WorkspaceVerseFacade } from './workspace-verse.facade';
import { WorkspaceNavigationFacade } from './workspace-navigation.facade';
import { WorkspaceMemorizationFacade } from './workspace-memorization.facade';
import { WorkspaceBibleDataFacade } from './workspace-bible-data.facade';
import { WorkspaceUIStateService } from '../state/workspace-ui-state.service';

/**
 * Orchestrator facade that coordinates all workspace facades
 * This is the main entry point for the component
 */
@Injectable()
export class WorkspaceOrchestratorFacade {
  
  // Combined view model for the component (initialized in constructor)
  viewModel$!: Observable<any>;
  
  // Filtered verses based on current filter (initialized in constructor)
  filteredVerses$!: Observable<WorkspaceVerse[]>;

  constructor(
    private verseFacade: WorkspaceVerseFacade,
    private navigationFacade: WorkspaceNavigationFacade,
    private memorizationFacade: WorkspaceMemorizationFacade,
    private bibleDataFacade: WorkspaceBibleDataFacade,
    private uiStateService: WorkspaceUIStateService,
    private bibleService: BibleService,
    private workspaceParsingService: WorkspaceParsingService,
    private notificationService: NotificationService
  ) {
    // Initialize observables after injection
    this.viewModel$ = combineLatest([
      this.verseFacade.verses$,
      this.verseFacade.selectedVerses$,
      this.navigationFacade.mode$,
      this.navigationFacade.currentBook$,
      this.navigationFacade.currentChapter$,
      this.memorizationFacade.isSaving$,
      this.memorizationFacade.pendingSaveCount$
    ]).pipe(
      map(([verses, selectedVerses, mode, currentBook, currentChapter, isSaving, pendingSaveCount]) => ({
        verses,
        selectedVerses,
        mode,
        currentBook,
        currentChapter,
        isSaving,
        pendingSaveCount,
        hasSelection: selectedVerses.size > 0,
        stats: this.calculateStats(verses)
      }))
    );

    // Filtered verses based on current filter
    this.filteredVerses$ = combineLatest([
      this.verseFacade.verses$,
      this.uiStateService.state$
    ]).pipe(
      map(([verses, uiState]) => this.filterVerses(verses, uiState.activeFilter))
    );
  }

  /**
   * Load a chapter with all its verses
   */
  async loadChapter(bookId: number, chapterNum: number, userId: number, preferredBible?: string): Promise<void> {
    try {
      this.uiStateService.setLoading(true);

      // Get book and chapter data
      const book = this.bibleDataFacade.getBookById(bookId);
      if (!book) {
        console.error('Book not found:', bookId);
        this.uiStateService.setLoading(false);
        return;
      }

      const bibleChapter = book.getChapter(chapterNum);
      
      // Update navigation state
      this.navigationFacade.setCurrentBook(book);
      this.navigationFacade.setCurrentChapter(chapterNum, bibleChapter);

      // Generate verse codes
      const totalVerses = bibleChapter.totalVerses;
      const verseCodes: string[] = Array.from({ length: totalVerses }, (_, i) =>
        `${bookId}-${chapterNum}-${i + 1}`
      );

      // Get verse texts
      const verseTexts = await firstValueFrom(
        this.bibleService.getVerseTexts(userId, verseCodes, preferredBible)
      );

      // Create verses array
      const verses: WorkspaceVerse[] = verseCodes.map((code, index) => {
        const [, , verseNum] = code.split('-').map(Number);
        const text = verseTexts[code] || '';
        const bibleVerse = bibleChapter?.verses[verseNum - 1];
        const isMemorized = bibleVerse?.memorized || false;

        return {
          verseCode: code,
          reference: book.chapters.length === 1 ? `v${verseNum}` : `${chapterNum}:${verseNum}`,
          fullReference: `${book.name} ${chapterNum}:${verseNum}`,
          text: text,
          firstLetters: this.workspaceParsingService.extractFirstLetters(text),
          isMemorized: isMemorized,
          isFifth: (index + 1) % 5 === 0,
          bookName: book.name,
          chapter: chapterNum,
          verse: verseNum,
          verseNumber: verseNum,
          isSaving: false
        } as WorkspaceVerse;
      });

      // Update facades with loaded verses
      this.verseFacade.loadVerses(verses);
      this.memorizationFacade.initializeReviewData(verses);
      
      this.uiStateService.setLoading(false);
      console.log('Chapter loaded:', book.name, chapterNum, verses.length, 'verses');
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      this.uiStateService.setLoading(false);
      this.notificationService.error('Failed to load chapter data');
    }
  }

  /**
   * Toggle verse memorization status
   */
  toggleVerseMemorized(verse: WorkspaceVerse): void {
    this.verseFacade.toggleVerseMemorized(verse);
    this.memorizationFacade.queueVerseSave(verse);
  }

  /**
   * Mark all selected verses as memorized/unmemorized
   */
  markSelectedAsMemorized(memorized: boolean): void {
    this.verseFacade.markSelectedAsMemorized(memorized);
    
    // Queue saves for all affected verses
    const verses = this.verseFacade.getCurrentVerses();
    const selectedVerseCodes = this.verseFacade.getSelectedVerses();
    
    selectedVerseCodes.forEach(verseCode => {
      const verse = verses.find(v => v.verseCode === verseCode);
      if (verse) {
        this.memorizationFacade.queueVerseSave(verse);
      }
    });
  }

  /**
   * Select a verse or range of verses
   */
  selectVerse(index: number, multiSelect: boolean = false): void {
    const verses = this.verseFacade.getCurrentVerses();
    if (verses[index]) {
      this.verseFacade.selectVerse(verses[index].verseCode, multiSelect);
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.verseFacade.clearSelection();
  }

  /**
   * Select all verses
   */
  selectAll(): void {
    this.verseFacade.selectAll();
  }

  /**
   * Change the workspace mode
   */
  setMode(mode: WorkspaceMode): void {
    this.navigationFacade.setMode(mode);
    this.uiStateService.setMode(mode);
    
    // Clear selections when changing modes
    this.verseFacade.clearSelection();
  }

  /**
   * Navigate to a different chapter
   */
  navigateToChapter(bookId: number, chapter: number): void {
    this.navigationFacade.navigateToChapter(bookId, chapter);
  }

  /**
   * Go to next chapter
   */
  goToNextChapter(): void {
    this.navigationFacade.goToNextChapter();
  }

  /**
   * Go to previous chapter
   */
  goToPreviousChapter(): void {
    this.navigationFacade.goToPreviousChapter();
  }

  /**
   * Filter verses based on filter type
   */
  private filterVerses(verses: WorkspaceVerse[], filter: WorkspaceFilterMode): WorkspaceVerse[] {
    if (!verses) return [];
    
    switch (filter) {
      case WorkspaceFilterMode.UNMEMORIZED:
        return verses.filter(v => !v.isMemorized);
      case WorkspaceFilterMode.NEEDS_REVIEW:
        return verses.filter(v => this.memorizationFacade.needsReview(v.verseCode));
      default:
        return verses;
    }
  }

  /**
   * Calculate statistics for verses
   */
  private calculateStats(verses: WorkspaceVerse[]): any {
    if (!verses) return { total: 0, memorized: 0, needsReview: 0 };
    
    return {
      total: verses.length,
      memorized: verses.filter(v => v.isMemorized).length,
      needsReview: verses.filter(v => this.memorizationFacade.needsReview(v.verseCode)).length
    };
  }

  /**
   * Get current state snapshots
   */
  getCurrentVerses(): WorkspaceVerse[] {
    return this.verseFacade.getCurrentVerses();
  }

  getCurrentMode(): WorkspaceMode {
    return this.navigationFacade.getCurrentMode();
  }

  isVerseSelected(index: number): boolean {
    return this.verseFacade.isVerseSelectedByIndex(index);
  }
}