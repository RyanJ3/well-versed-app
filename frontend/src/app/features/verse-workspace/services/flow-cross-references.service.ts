import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, take } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { BibleService } from '@services/api/bible.service';
import { NotificationService } from '@services/utils/notification.service';
import { FlowParsingService } from '@services/utils/flow-parsing.service';
import { FlowVerse } from '../models/flow.models';

export interface CrossReferenceState {
  verses: FlowVerse[];
  selectedVerse: any;
  count: number;
  loading: boolean;
}

@Injectable()
export class FlowCrossReferencesService {
  private crossReferenceState = new BehaviorSubject<CrossReferenceState>({
    verses: [],
    selectedVerse: null,
    count: 0,
    loading: false
  });

  public readonly state$ = this.crossReferenceState.asObservable();
  
  constructor(
    private bibleService: BibleService,
    private notificationService: NotificationService,
    private flowParsingService: FlowParsingService
  ) {}

  get currentState(): CrossReferenceState {
    return this.crossReferenceState.value;
  }

  get verses(): FlowVerse[] {
    return this.crossReferenceState.value.verses;
  }

  get selectedVerse(): any {
    return this.crossReferenceState.value.selectedVerse;
  }

  get isLoading(): boolean {
    return this.crossReferenceState.value.loading;
  }

  get count(): number {
    return this.crossReferenceState.value.count;
  }

  async selectVerse(verse: any, userId: number): Promise<void> {
    // Validate verse object
    if (!verse || verse.bookId === undefined || verse.chapter === undefined || verse.verse === undefined) {
      console.error('Invalid verse object passed to selectVerse:', verse);
      return;
    }
    
    this.updateState({ selectedVerse: verse });
    
    // Fetch the verse text for the selected verse
    const verseCode = `${verse.bookId}-${verse.chapter}-${verse.verse}`;
    try {
      const verseTexts = await firstValueFrom(
        this.bibleService.getVerseTexts(userId, [verseCode])
      );
      
      // Add the text to the selected verse object
      if (verseTexts[verseCode]) {
        this.updateState({ 
          selectedVerse: { ...verse, text: verseTexts[verseCode] }
        });
      }
    } catch (error) {
      console.error('Error loading selected verse text:', error);
    }
    
    // Load cross-references for this verse
    await this.loadCrossReferences(verse.bookId, verse.chapter, verse.verse, userId);
  }

  async loadCrossReferences(bookId: number, chapter: number, verse: number, userId: number): Promise<void> {
    this.updateState({ loading: true, verses: [] });
    
    try {
      const references = await firstValueFrom(
        this.bibleService.getCrossReferencesForVerse(bookId, chapter, verse)
      );
      
      console.log('Loaded cross-references:', references);
      this.updateState({ count: references.length });
      
      if (references.length === 0) {
        this.updateState({ loading: false });
        return;
      }
      
      // Backend now returns pre-grouped references with range info
      const verseCodesToFetch = references.map(ref => ref.verse_code);
      
      try {
        // Fetch verse texts from ESV API (only first verse of each range)
        const verseTexts = await firstValueFrom(
          this.bibleService.getVerseTexts(userId, verseCodesToFetch)
        );
        
        // Convert cross-references to FlowVerse format
        const crossReferenceVerses = references.map((ref, index) => {
          const reference = ref.display_reference || `${ref.book_name} ${ref.chapter}:${ref.verse_number}`;
          
          // Get text for display (only first verse, with ellipsis if range)
          let displayText = verseTexts[ref.verse_code] || 'Loading verse text...';
          if (ref.is_range && displayText !== 'Loading verse text...') {
            displayText = displayText.trim() + ' ...';
          }
          
          return {
            index: index,
            verseNumber: ref.verse_number,
            verseCode: ref.verse_code,
            reference: reference,
            fullReference: reference,
            text: displayText,
            firstLetters: '',
            isMemorized: ref.is_memorized,
            isFifth: false,
            isNewSentence: false,
            isNewParagraph: false,
            bookName: ref.book_name || '',
            chapter: ref.chapter || 0,
            verse: ref.verse_number || 0,
            verseId: ref.verse_id,
            displayText: displayText,
            practiceCount: ref.practice_count || 0,
            confidenceScore: ref.confidence_score || 0,
            crossRefConfidence: ref.cross_ref_confidence || 0,
            direction: ref.direction || 'from',
            isRange: ref.is_range || false,
            endVerse: ref.end_verse_number,
            endChapter: ref.end_chapter,
            verseCount: ref.is_range ? 
              (ref.end_chapter && ref.end_chapter !== ref.chapter ? 
                999 : // Use a large number for cross-chapter ranges
                (ref.end_verse_number - ref.verse_number + 1)) : 1
          } as FlowVerse;
        });
        
        this.updateState({ verses: crossReferenceVerses });
        
      } catch (error) {
        console.error('Error fetching verse texts:', error);
        // Fallback: create verses without texts
        const fallbackVerses = references.map((ref, index) => this.createFallbackVerse(ref, index));
        this.updateState({ verses: fallbackVerses });
      }
      
      this.updateState({ loading: false });
      
    } catch (error) {
      console.error('Error loading cross-references:', error);
      this.notificationService.error('Failed to load cross-references');
      this.updateState({ loading: false });
    }
  }

  private createFallbackVerse(ref: any, index: number): FlowVerse {
    const reference = ref.display_reference || `${ref.book_name} ${ref.chapter}:${ref.verse_number}`;
    
    return {
      index: index,
      verseNumber: ref.verse_number,
      verseCode: ref.verse_code,
      reference: reference,
      fullReference: reference,
      text: 'Failed to load verse text',
      firstLetters: '',
      isMemorized: ref.is_memorized,
      isFifth: false,
      isNewSentence: false,
      isNewParagraph: false,
      bookName: ref.book_name || '',
      chapter: ref.chapter || 0,
      verse: ref.verse_number || 0,
      verseId: ref.verse_id,
      displayText: 'Failed to load verse text',
      practiceCount: ref.practice_count || 0,
      confidenceScore: ref.confidence_score || 0,
      crossRefConfidence: ref.cross_ref_confidence || 0,
      direction: ref.direction || 'from',
      isRange: ref.is_range || false,
      endVerse: ref.end_verse_number,
      endChapter: ref.end_chapter,
      verseCount: ref.is_range ? 
        (ref.end_chapter && ref.end_chapter !== ref.chapter ? 
          999 : 
          (ref.end_verse_number - ref.verse_number + 1)) : 1
    } as FlowVerse;
  }

  getFilteredVerses(filter: 'all' | 'unmemorized'): FlowVerse[] {
    const verses = this.crossReferenceState.value.verses;
    if (filter === 'all') {
      return verses;
    } else if (filter === 'unmemorized') {
      return verses.filter(v => !v.isMemorized);
    }
    return verses;
  }

  getUnmemorizedCount(): number {
    return this.crossReferenceState.value.verses.filter(v => !v.isMemorized).length;
  }

  clearState(): void {
    this.updateState({
      verses: [],
      selectedVerse: null,
      count: 0,
      loading: false
    });
  }

  private updateState(partial: Partial<CrossReferenceState>): void {
    this.crossReferenceState.next({
      ...this.crossReferenceState.value,
      ...partial
    });
  }
}