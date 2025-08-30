import { Injectable } from '@angular/core';
import { 
  BaseVerse, 
  MemorizationVerse, 
  CrossReferenceVerse, 
  TopicalVerse,
  createMemorizationVerse,
  createCrossReferenceVerse,
  createTopicalVerse
} from '../../models/verse-types.model';
import { BibleService } from '../../../services/bible.service';

@Injectable({
  providedIn: 'root'
})
export class VerseTransformationService {
  constructor(private bibleService: BibleService) {}

  /**
   * Transform raw verse data into memorization verses
   */
  async transformToMemorizationVerses(
    verseCodes: string[],
    memorizedVerses: Set<string>
  ): Promise<MemorizationVerse[]> {
    const verseTexts = await this.fetchVerseTexts(verseCodes);
    
    return verseCodes.map((verseCode, index) => {
      const base = this.createBaseVerse(verseCode, verseTexts[verseCode]);
      const isMemorized = memorizedVerses.has(verseCode);
      
      return createMemorizationVerse(base, {
        isMemorized,
        isFirstInChapter: index === 0,
        isLastInChapter: index === verseCodes.length - 1,
        nextVerseCode: verseCodes[index + 1],
        previousVerseCode: verseCodes[index - 1]
      });
    });
  }

  /**
   * Transform cross-reference data into cross-reference verses
   */
  async transformToCrossReferenceVerses(
    references: any[],
    sourceVerseCode: string,
    direction: 'from' | 'to' = 'from'
  ): Promise<CrossReferenceVerse[]> {
    const verseCodes = references.map(ref => ref.verse_code);
    const verseTexts = await this.fetchVerseTexts(verseCodes);
    
    return references.map((ref, index) => {
      const base = this.createBaseVerse(ref.verse_code, verseTexts[ref.verse_code]);
      
      return createCrossReferenceVerse(
        base,
        sourceVerseCode,
        ref.confidence || 0.5,
        direction
      );
    });
  }

  /**
   * Transform topical verse data
   */
  async transformToTopicalVerses(
    verses: any[],
    topicName: string
  ): Promise<TopicalVerse[]> {
    const verseCodes = verses.map(v => v.verse_code);
    const verseTexts = await this.fetchVerseTexts(verseCodes);
    
    return verses.map((verse, index) => {
      const base = this.createBaseVerse(verse.verse_code, verseTexts[verse.verse_code]);
      
      return createTopicalVerse(
        base,
        topicName,
        verse.relevance || 1.0
      );
    });
  }

  /**
   * Create a base verse from a verse code and text
   */
  private createBaseVerse(verseCode: string, text?: string): BaseVerse {
    const parts = this.parseVerseCode(verseCode);
    
    return {
      verseCode,
      reference: this.formatReference(parts),
      text: text || 'Loading...',
      bookName: parts.bookName,
      chapter: parts.chapter,
      verseNumber: parts.verse,
      displayReference: this.formatDisplayReference(parts)
    };
  }

  /**
   * Parse verse code into components
   */
  private parseVerseCode(verseCode: string): {
    bookId: number;
    bookName: string;
    chapter: number;
    verse: number;
  } {
    // Format: BBCCVVV (e.g., 01001001 = Genesis 1:1)
    const bookId = parseInt(verseCode.substring(0, 2));
    const chapter = parseInt(verseCode.substring(2, 5));
    const verse = parseInt(verseCode.substring(5, 8));
    
    const bookName = this.getBookName(bookId);
    
    return { bookId, bookName, chapter, verse };
  }

  /**
   * Format a reference string
   */
  private formatReference(parts: { bookName: string; chapter: number; verse: number }): string {
    return `${parts.bookName} ${parts.chapter}:${parts.verse}`;
  }

  /**
   * Format a display reference (abbreviated)
   */
  private formatDisplayReference(parts: { bookName: string; chapter: number; verse: number }): string {
    const abbrev = this.getBookAbbreviation(parts.bookName);
    return `${abbrev} ${parts.chapter}:${parts.verse}`;
  }

  /**
   * Fetch verse texts from the API
   */
  private async fetchVerseTexts(verseCodes: string[]): Promise<Record<string, string>> {
    if (verseCodes.length === 0) return {};
    
    try {
      const uniqueCodes = [...new Set(verseCodes)];
      const response = await this.bibleService.getVersesByCode(uniqueCodes).toPromise();
      
      const texts: Record<string, string> = {};
      response?.forEach((verse: any) => {
        texts[verse.verse_code] = verse.text;
      });
      
      return texts;
    } catch (error) {
      console.error('Error fetching verse texts:', error);
      return {};
    }
  }

  /**
   * Get book name from book ID
   */
  private getBookName(bookId: number): string {
    const bookNames: Record<number, string> = {
      1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
      6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
      11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
      15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
      20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
      24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
      28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
      33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
      38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
      43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
      48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
      52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
      56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
      61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude',
      66: 'Revelation'
    };
    
    return bookNames[bookId] || 'Unknown';
  }

  /**
   * Get book abbreviation
   */
  private getBookAbbreviation(bookName: string): string {
    const abbreviations: Record<string, string> = {
      'Genesis': 'Gen', 'Exodus': 'Ex', 'Leviticus': 'Lev', 'Numbers': 'Num',
      'Deuteronomy': 'Deut', 'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth',
      '1 Samuel': '1 Sam', '2 Samuel': '2 Sam', '1 Kings': '1 Kgs', '2 Kings': '2 Kgs',
      '1 Chronicles': '1 Chr', '2 Chronicles': '2 Chr', 'Ezra': 'Ezra', 'Nehemiah': 'Neh',
      'Esther': 'Est', 'Job': 'Job', 'Psalms': 'Ps', 'Proverbs': 'Prov',
      'Ecclesiastes': 'Eccl', 'Song of Solomon': 'Song', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
      'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan', 'Hosea': 'Hos',
      'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah',
      'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph',
      'Haggai': 'Hag', 'Zechariah': 'Zech', 'Malachi': 'Mal', 'Matthew': 'Matt',
      'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
      'Romans': 'Rom', '1 Corinthians': '1 Cor', '2 Corinthians': '2 Cor',
      'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Phil', 'Colossians': 'Col',
      '1 Thessalonians': '1 Thess', '2 Thessalonians': '2 Thess', '1 Timothy': '1 Tim',
      '2 Timothy': '2 Tim', 'Titus': 'Titus', 'Philemon': 'Phlm', 'Hebrews': 'Heb',
      'James': 'Jas', '1 Peter': '1 Pet', '2 Peter': '2 Pet', '1 John': '1 John',
      '2 John': '2 John', '3 John': '3 John', 'Jude': 'Jude', 'Revelation': 'Rev'
    };
    
    return abbreviations[bookName] || bookName.substring(0, 3);
  }

  /**
   * Filter verses by search term
   */
  filterVerses<T extends BaseVerse>(verses: T[], searchTerm: string): T[] {
    if (!searchTerm) return verses;
    
    const term = searchTerm.toLowerCase();
    return verses.filter(verse => 
      verse.text.toLowerCase().includes(term) ||
      verse.reference.toLowerCase().includes(term)
    );
  }

  /**
   * Sort verses by reference
   */
  sortVersesByReference<T extends BaseVerse>(verses: T[]): T[] {
    return [...verses].sort((a, b) => a.verseCode.localeCompare(b.verseCode));
  }

  /**
   * Group verses by chapter
   */
  groupVersesByChapter<T extends BaseVerse>(verses: T[]): Map<number, T[]> {
    const grouped = new Map<number, T[]>();
    
    verses.forEach(verse => {
      const chapter = verse.chapter || 1;
      if (!grouped.has(chapter)) {
        grouped.set(chapter, []);
      }
      grouped.get(chapter)!.push(verse);
    });
    
    return grouped;
  }
}