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
   * Preserves leading punctuation and handles apostrophes/contractions.
   * 
   * @param word The word to process
   * @returns The word with only its first letter preserved
   */
  private extractFirstLetterFromWord(word: string): string {
    // Separate the word from trailing punctuation
    const punctuationMatch = word.match(/^(.+?)([.,;:!?]*)$/);
    const wordPart = punctuationMatch ? punctuationMatch[1] : word;
    const trailingPunctuation = punctuationMatch ? punctuationMatch[2] : '';
    
    // Handle words with apostrophes (possessive and contractive)
    const processedWord = this.removeApostrophesFromWord(wordPart);
    
    // Find the first letter
    const match = processedWord.match(/[a-zA-Z]/);
    if (match) {
      const index = processedWord.indexOf(match[0]);
      return processedWord.substring(0, index + 1) + trailingPunctuation;
    }
    
    return word; // Return original if no letters found
  }

  /**
   * Removes apostrophes from contractions and possessives.
   * 
   * @param word The word to process
   * @returns The word with apostrophes removed appropriately
   */
  private removeApostrophesFromWord(word: string): string {
    // Common contractions and possessive patterns
    const contractionPatterns = [
      // Standard contractions
      /(\w+)'re$/g,     // they're, we're, you're
      /(\w+)'ve$/g,     // I've, we've, they've
      /(\w+)'ll$/g,     // I'll, we'll, they'll
      /(\w+)'d$/g,      // I'd, we'd, they'd
      /(\w+)n't$/g,     // don't, can't, won't
      /(\w+)'m$/g,      // I'm
      /(\w+)'s$/g,      // Possessive or contractions like "it's", "he's"
    ];

    let result = word;
    
    // Remove apostrophes from contractions and possessives
    contractionPatterns.forEach(pattern => {
      result = result.replace(pattern, (match, beforeApostrophe) => {
        // Extract the part after the apostrophe
        const afterApostrophe = match.substring(beforeApostrophe.length + 1);
        return beforeApostrophe + afterApostrophe;
      });
    });

    // Handle any remaining apostrophes in possessive cases (like names ending in 's)
    // Example: "Jesus'" becomes "Jesus"
    result = result.replace(/(\w+)'(\w*)$/g, '$1$2');

    return result;
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