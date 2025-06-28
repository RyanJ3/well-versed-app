// src/app/models/bible/enums.ts
// Enums for type safety

/**
 * Defines the Testament types in the Bible
 */
export enum TestamentType {
  OLD = 'Old Testament',
  NEW = 'New Testament',
  APOCRYPHA = 'Apocrypha'
}

/**
 * Defines the different book groups within the Bible
 */
export enum BookGroupType {
  LAW = 'Torah',
  HISTORY = 'Historical',
  WISDOM = 'Wisdom',
  MAJOR_PROPHETS = 'Major Prophets',
  MINOR_PROPHETS = 'Minor Prophets',
  GOSPELS = 'Gospels',
  MODERN_HISTORICAL = 'Modern Historical',
  PAULINE = 'Pauline Epistles',
  GENERAL = 'General Epistles',
  APOCALYPTIC = 'Apocalyptic'
}

/**
 * Constants for apocryphal chapters
 */
export const apocryphalChapters: Record<string, number[]> = {
  
  // Additions to Esther (chapters 10-16 in Catholic Bible) 
  'EST': [10, 11, 12, 13, 14, 15, 16],
  
  // Additions to Daniel
  'DAN': [13, 14],

  // Additional chapters in Jeremiah (some traditions)
  'JER': [52]
};