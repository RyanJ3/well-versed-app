// src/app/models/bible/enums.ts
// Enums for type safety

/**
 * Defines the Testament types in the Bible
 */
export enum TestamentType {
  OLD = 'Old Testament',
  NEW = 'New Testament'
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
export const apocryphalChapters: Record<string, number[]> = {};
