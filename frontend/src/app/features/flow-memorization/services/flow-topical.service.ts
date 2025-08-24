import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { BibleService } from '@services/api/bible.service';
import { NotificationService } from '@services/utils/notification.service';
import { FlowParsingService } from '@services/utils/flow-parsing.service';
import { FlowVerse } from '../models/flow.models';

export interface TopicalState {
  verses: FlowVerse[];
  selectedTopic: any;
  availableTopics: any[];
  count: number;
  loading: boolean;
  loadingTopics: boolean;
}

@Injectable()
export class FlowTopicalService {
  private topicalState = new BehaviorSubject<TopicalState>({
    verses: [],
    selectedTopic: null,
    availableTopics: [],
    count: 0,
    loading: false,
    loadingTopics: false
  });

  public readonly state$ = this.topicalState.asObservable();
  
  constructor(
    private bibleService: BibleService,
    private notificationService: NotificationService,
    private flowParsingService: FlowParsingService
  ) {}

  get currentState(): TopicalState {
    return this.topicalState.value;
  }

  get verses(): FlowVerse[] {
    return this.topicalState.value.verses;
  }

  get selectedTopic(): any {
    return this.topicalState.value.selectedTopic;
  }

  get availableTopics(): any[] {
    return this.topicalState.value.availableTopics;
  }

  get isLoading(): boolean {
    return this.topicalState.value.loading;
  }

  get count(): number {
    return this.topicalState.value.count;
  }

  async loadAvailableTopics(): Promise<void> {
    this.updateState({ loadingTopics: true });
    
    try {
      const topics = await firstValueFrom(this.bibleService.getTopics());
      this.updateState({ 
        availableTopics: topics,
        loadingTopics: false 
      });
      console.log('Loaded topics:', topics.length);
    } catch (error) {
      console.error('Error loading topics:', error);
      this.notificationService.error('Failed to load topics');
      this.updateState({ loadingTopics: false });
    }
  }

  async selectTopic(topic: any, userId: number): Promise<void> {
    this.updateState({ selectedTopic: topic });
    console.log('Selected topic:', topic);
    await this.loadTopicalVerses(topic.topicId, userId);
  }

  async loadTopicalVerses(topicId: number, userId: number, limit: number = 100): Promise<void> {
    this.updateState({ loading: true, verses: [] });
    
    try {
      const verses = await firstValueFrom(
        this.bibleService.getTopicalVerses(topicId, limit)
      );
      
      console.log('Loaded topical verses:', verses);
      this.updateState({ count: verses.length });
      
      // Get verse codes for fetching texts
      const verseCodes = verses.map(v => v.verse_code);
      
      try {
        // Fetch verse texts from ESV API
        const verseTexts = await firstValueFrom(
          this.bibleService.getVerseTexts(userId, verseCodes)
        );
        
        // Transform to FlowVerse format with actual verse texts
        const topicalVerses = verses.map((verse, index) => {
          const reference = verse.display_reference || `${verse.book_name} ${verse.chapter}:${verse.verse_number}`;
          
          // Get text for display (only first verse, with ellipsis if range)
          let displayText = verseTexts[verse.verse_code] || '';
          if (verse.is_range && displayText) {
            displayText = displayText.trim() + ' ...';
          }
          
          return {
            verseId: verse.verse_id,
            verseCode: verse.verse_code,
            verseNumber: verse.verse_number,
            reference: reference,
            text: displayText,
            firstLetters: this.generateFirstLetters(displayText),
            displayText: displayText,
            isMemorized: verse.is_memorized,
            isNewSentence: false,
            isNewParagraph: false,
            isFifth: false,
            bookName: verse.book_name,
            chapter: verse.chapter,
            verse: verse.verse_number,
            fullReference: reference,
            topicRelevance: verse.topic_relevance || 0.0,
            topicName: verse.topic_name,
            practiceCount: verse.practice_count || 0,
            confidenceScore: verse.confidence_score || 0.0,
            isRange: verse.is_range || false,
            endVerse: verse.end_verse_number,
            endChapter: verse.end_chapter,
            verseCount: verse.is_range ? 
              (verse.end_chapter && verse.end_chapter !== verse.chapter ? 
                999 : // Use a large number for cross-chapter ranges
                (verse.end_verse_number - verse.verse_number + 1)) : 1
          } as FlowVerse;
        });
        
        // Sort by relevance (highest first)
        topicalVerses.sort((a, b) => (b.topicRelevance || 0) - (a.topicRelevance || 0));
        this.updateState({ verses: topicalVerses });
        
      } catch (error) {
        console.error('Error loading verse texts for topical verses:', error);
        // Create verses without texts as fallback
        const fallbackVerses = verses.map((verse, index) => this.createFallbackVerse(verse, index));
        this.updateState({ verses: fallbackVerses });
      }
      
      this.updateState({ loading: false });
      
    } catch (error) {
      console.error('Error loading topical verses:', error);
      this.notificationService.error('Failed to load topical verses');
      this.updateState({ loading: false });
    }
  }

  private createFallbackVerse(verse: any, index: number): FlowVerse {
    const reference = verse.display_reference || `${verse.book_name} ${verse.chapter}:${verse.verse_number}`;
    
    return {
      verseId: verse.verse_id,
      verseCode: verse.verse_code,
      verseNumber: verse.verse_number,
      reference: reference,
      text: 'Loading verse text...',
      firstLetters: '',
      displayText: 'Loading verse text...',
      isMemorized: verse.is_memorized,
      isNewSentence: false,
      isNewParagraph: false,
      isFifth: false,
      bookName: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse_number,
      fullReference: reference,
      topicRelevance: verse.topic_relevance || 0.0,
      topicName: verse.topic_name,
      practiceCount: verse.practice_count || 0,
      confidenceScore: verse.confidence_score || 0.0,
      isRange: verse.is_range || false,
      endVerse: verse.end_verse_number,
      endChapter: verse.end_chapter,
      verseCount: verse.is_range ? 
        (verse.end_chapter && verse.end_chapter !== verse.chapter ? 
          999 : 
          (verse.end_verse_number - verse.verse_number + 1)) : 1
    } as FlowVerse;
  }

  private generateFirstLetters(text: string): string {
    // Generate first letters of each word for memorization hints
    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase()) // Get first letter of each word
      .join('');
  }

  getFilteredVerses(filter: 'all' | 'unmemorized'): FlowVerse[] {
    const verses = this.topicalState.value.verses;
    if (filter === 'all') {
      return verses;
    } else if (filter === 'unmemorized') {
      return verses.filter(v => !v.isMemorized);
    }
    return verses;
  }

  getUnmemorizedCount(): number {
    return this.topicalState.value.verses.filter(v => !v.isMemorized).length;
  }

  clearState(): void {
    this.updateState({
      verses: [],
      selectedTopic: null,
      count: 0,
      loading: false
    });
  }

  private updateState(partial: Partial<TopicalState>): void {
    this.topicalState.next({
      ...this.topicalState.value,
      ...partial
    });
  }
}