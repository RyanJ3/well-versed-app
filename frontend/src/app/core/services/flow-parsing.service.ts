import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FlowParsingService {
  
  /**
   * Extracts the first letters of each word from the given text.
   * Handles apostrophes, contractions, and punctuation properly.
   * 
   * @param text The text to process
   * @returns The text with only first letters preserved
   */
  extractFirstLetters(text: string): string {
    if (!text) return '';

    return text
      .split(' ')
      .map(word => this.extractFirstLetterFromWord(word))
      .join(' ');
  }

  /**
   * Extracts the first letter from a single word.
   * Preserves leading and trailing punctuation and handles apostrophes/contractions.
   * 
   * @param word The word to process
   * @returns The word with only its first letter preserved
   */
  private extractFirstLetterFromWord(word: string): string {
    // Separate leading punctuation, word content, and trailing punctuation
    const fullMatch = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9']+)([^a-zA-Z0-9]*)$/);
    
    if (!fullMatch) {
      // If no letters/numbers found, return as is
      return word;
    }
    
    const leadingPunctuation = fullMatch[1] || '';
    const wordPart = fullMatch[2] || '';
    const trailingPunctuation = fullMatch[3] || '';
    
    // Check if this is a possessive (ends with 's or just ')
    const possessiveMatch = wordPart.match(/^([a-zA-Z0-9]+)('s?|'')$/);
    if (possessiveMatch) {
      const baseWord = possessiveMatch[1];
      const possessiveSuffix = possessiveMatch[2];
      const firstLetter = baseWord.match(/[a-zA-Z]/);
      if (firstLetter) {
        return leadingPunctuation + firstLetter[0] + possessiveSuffix + trailingPunctuation;
      }
    }
    
    // Handle contractions by removing apostrophe parts
    const processedWord = this.removeContractionSuffixes(wordPart);
    
    // Find the first letter
    const match = processedWord.match(/[a-zA-Z]/);
    if (match) {
      const index = processedWord.indexOf(match[0]);
      return leadingPunctuation + processedWord.substring(0, index + 1) + trailingPunctuation;
    }
    
    return word; // Return original if no letters found
  }

  /**
   * Removes contraction suffixes (but not possessive apostrophes).
   * 
   * @param word The word to process
   * @returns The word with contraction suffixes removed
   */
  private removeContractionSuffixes(word: string): string {
    // Common contraction patterns - remove the apostrophe and everything after
    const contractionPatterns = [
      /(\w+)'re$/,     // they're -> they
      /(\w+)'ve$/,     // I've -> I  
      /(\w+)'ll$/,     // I'll -> I
      /(\w+)'d$/,      // I'd -> I
      /(\w+)n't$/,     // don't -> do, can't -> can, won't -> wo
      /(\w+)'m$/,      // I'm -> I
      // Handle "it's", "he's" etc. as contractions (not possessives in this context)
      /^(it|he|she|that|what|where|when|how)'s$/i, // it's -> it, he's -> he
    ];

    for (const pattern of contractionPatterns) {
      const match = word.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return word;
  }

  /**
   * Gets the display format for Memory mode (dots).
   * 
   * @param text The text to convert to dots
   * @param maxDots Maximum number of dots to show (default: 10)
   * @returns A string of dots representing the word count
   */
  getMemoryModeDisplay(text: string, maxDots: number = 10): string {
    if (!text) return '';
    
    const wordCount = text.split(' ').length;
    return Array(Math.min(wordCount, maxDots)).fill('•').join(' ') + 
           (wordCount > maxDots ? '...' : '');
  }
}