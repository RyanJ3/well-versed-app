import { WorkspaceVerse } from '../models/workspace.models';

export class WorkspaceVerseUtils {
  /**
   * Get display text for a verse (full text or first letters)
   */
  static getVerseDisplay(verse: WorkspaceVerse, showFullText: boolean): string {
    if (!verse) return '';
    const text = showFullText ? verse.text : verse.firstLetters;
    // Remove a leading pilcrow so we don't double-signal when the label shows
    return text.replace(/^¶\s*/, '');
  }

  /**
   * Check if verse needs review based on review data
   */
  static needsReview(
    verseCode: string, 
    reviewData: Record<string, { lastReviewed: number; strength: number }>
  ): boolean {
    const data = reviewData[verseCode];
    if (!data) return false;
    // Needs review if strength is below 80% or last reviewed more than 3 days ago
    const daysSinceReview = (Date.now() - data.lastReviewed) / (1000 * 60 * 60 * 24);
    return data.strength < 80 || daysSinceReview > 3;
  }

  /**
   * Check if verse starts a new paragraph
   */
  static isNewParagraph(verse: WorkspaceVerse): boolean {
    return verse.text.indexOf('¶') > 0;
  }

  /**
   * Get CSS classes for verse display state
   */
  static getVerseClasses(
    verse: WorkspaceVerse,
    isSelected: boolean,
    needsReview: boolean
  ): string {
    const classes = ['verse-block'];
    
    if (this.isNewParagraph(verse)) {
      classes.push('new-paragraph');
    }

    // Memorized state (adds green border + check)
    if (verse.isMemorized) {
      if (needsReview) {
        classes.push('memorized-needs-review');
      } else {
        classes.push('memorized');
      }
    }

    // Selection ALWAYS adds 'selected' (blue border wins)
    if (isSelected) {
      classes.push('selected');
    } else if (verse.isFifth) {
      classes.push('fifth-verse');
    }

    return classes.join(' ');
  }

  /**
   * Filter verses based on filter type
   */
  static filterVerses(
    verses: WorkspaceVerse[],
    filter: 'all' | 'unmemorized' | 'needsReview',
    reviewData?: Record<string, { lastReviewed: number; strength: number }>
  ): WorkspaceVerse[] {
    if (!verses || verses.length === 0) {
      return [];
    }

    switch (filter) {
      case 'unmemorized':
        return verses.filter(v => !v.isMemorized);
      case 'needsReview':
        if (!reviewData) return [];
        return verses.filter(v => this.needsReview(v.verseCode, reviewData));
      default:
        return verses;
    }
  }

  /**
   * Get count statistics for verses
   */
  static getVerseCounts(
    verses: WorkspaceVerse[],
    reviewData?: Record<string, { lastReviewed: number; strength: number }>
  ): {
    total: number;
    memorized: number;
    unmemorized: number;
    needsReview: number;
  } {
    if (!verses || verses.length === 0) {
      return { total: 0, memorized: 0, unmemorized: 0, needsReview: 0 };
    }

    const memorized = verses.filter(v => v.isMemorized).length;
    const needsReview = reviewData 
      ? verses.filter(v => this.needsReview(v.verseCode, reviewData)).length 
      : 0;

    return {
      total: verses.length,
      memorized: memorized,
      unmemorized: verses.length - memorized,
      needsReview: needsReview
    };
  }

  /**
   * Calculate progress percentage
   */
  static calculateProgress(memorized: number, total: number): number {
    return total > 0 ? Math.round((memorized / total) * 100) : 0;
  }

  /**
   * Convert filtered index to actual verse index
   */
  static getActualIndex(
    filteredIndex: number,
    filteredVerses: WorkspaceVerse[],
    allVerses: WorkspaceVerse[]
  ): number {
    if (filteredIndex >= 0 && filteredIndex < filteredVerses.length) {
      const verse = filteredVerses[filteredIndex];
      return allVerses.findIndex(v => v.verseCode === verse.verseCode);
    }
    return filteredIndex;
  }

  /**
   * Create a verse reference string
   */
  static createVerseReference(
    verseCodes: string[],
    verses: WorkspaceVerse[],
    bookName: string
  ): string {
    if (verseCodes.length === 0 || !bookName) return '';
    
    const firstVerseCode = verseCodes[0];
    const lastVerseCode = verseCodes[verseCodes.length - 1];
    const firstVerse = verses.find(v => v.verseCode === firstVerseCode);
    const lastVerse = verses.find(v => v.verseCode === lastVerseCode);
    
    if (!firstVerse || !lastVerse) return '';
    
    if (verseCodes.length === 1) {
      return `${bookName} ${firstVerse.reference}`;
    } else {
      return `${bookName} ${firstVerse.reference}-${lastVerse.reference}`;
    }
  }

  /**
   * Check if milestone is achieved based on progress
   */
  static isMilestoneAchieved(progressPercentage: number, milestone: number): boolean {
    return progressPercentage >= milestone;
  }

  /**
   * Generate first letters from text for memorization
   */
  static generateFirstLetters(text: string): string {
    return text
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase()) // Get first letter of each word
      .join('');
  }

  /**
   * Parse verse code into components
   */
  static parseVerseCode(verseCode: string): {
    bookId: number;
    chapter: number;
    verse: number;
  } | null {
    const parts = verseCode.split('-').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      return {
        bookId: parts[0],
        chapter: parts[1],
        verse: parts[2]
      };
    }
    return null;
  }

  /**
   * Convert verse indices/codes to verse codes
   */
  static convertToVerseCodes(items: (string | number)[], verses: WorkspaceVerse[]): string[] {
    const verseCodes: string[] = [];
    
    for (const item of items) {
      if (typeof item === 'string' && item.includes('-')) {
        // Already a verse code
        verseCodes.push(item);
      } else {
        // Try to parse as index
        const index = typeof item === 'number' ? item : parseInt(String(item));
        if (!isNaN(index) && verses[index]) {
          verseCodes.push(verses[index].verseCode);
        }
      }
    }
    
    return verseCodes;
  }
}