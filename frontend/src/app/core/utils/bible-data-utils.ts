// Add this to frontend/src/app/utils/bible-data-utils.ts
// (Create this file if it doesn't exist)

/**
 * Data structure defining which chapters in standard books are considered apocryphal
 * This helps the app know which individual chapters to hide when apocrypha setting is disabled
 */
export const apocryphalChapters: Record<string, number[]> = {
  // Psalm 151 (in Psalms book)
  'PSA': [151],
  
  // Additions to Esther (chapters 10-16 in Catholic Bible) 
  'EST': [10, 11, 12, 13, 14, 15, 16],
  
  // Additions to Daniel
  // - The Prayer of Azariah and Song of the Three Holy Children (chapter 3 additions)
  // - Susanna (chapter 13)
  // - Bel and the Dragon (chapter 14)
  'DAN': [13, 14],

  // Additional chapters in Jeremiah (some traditions)
  'JER': [52], 
  
  // In some Bible versions, these might have additional apocryphal content
  // Add more entries as needed for your specific Bible data
};

/**
 * Helper function to check if a specific chapter in a book is apocryphal
 */
export function isApocryphalChapter(bookId: number, chapterNumber: number): boolean {
  // Check if the book is in our apocryphal chapters list
  if (apocryphalChapters[bookId]) {
    // Check if the chapter number is in the list of apocryphal chapters
    return apocryphalChapters[bookId].includes(chapterNumber);
  }
  
  // Special case for Psalm 151
  if (bookId === 'PSA' && chapterNumber === 151) {
    return true;
  }
  
  return false;
}