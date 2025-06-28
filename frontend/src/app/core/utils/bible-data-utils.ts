// Add this to frontend/src/app/utils/bible-data-utils.ts
// (Create this file if it doesn't exist)

/**
 * Data structure defining which chapters in standard books are considered apocryphal
 * This helps the app know which individual chapters to hide when apocrypha setting is disabled
 */
export const apocryphalChapters: Record<string, number[]> = {};

/**
 * Helper function to check if a specific chapter in a book is apocryphal
 */
export function isApocryphalChapter(bookId: number, chapterNumber: number): boolean {
  return false;
}