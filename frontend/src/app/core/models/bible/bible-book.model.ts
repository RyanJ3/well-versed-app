// frontend/src/app/models/bible/bible-book.model.ts
import { BibleChapter } from './bible-chapter.model';
import { BibleGroup } from './bible-group.modle';
import { BibleTestament } from './bible-testament.model';

// Book name to numerical ID mapping
const BOOK_ID_MAP: Record<string, number> = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
  'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
  'Haggai': 37, 'Zechariah': 38, 'Malachi': 39, 'Matthew': 40,
  'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44, 'Romans': 45,
  '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48,
  'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
  '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54,
  '2 Timothy': 55, 'Titus': 56, 'Philemon': 57, 'Hebrews': 58,
  'James': 59, '1 Peter': 60, '2 Peter': 61, '1 John': 62,
  '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66,
  // Apocryphal books
  'Tobit': 67, 'Judith': 68, '1 Maccabees': 69, '2 Maccabees': 70,
  'Wisdom of Solomon': 71, 'Sirach': 72, 'Baruch': 73,
  '1 Esdras': 74, '3 Maccabees': 75, 'Prayer of Manasseh': 76,
  'Psalm 151': 77
};

/**
 * Model class representing a Bible book
 */
export class BibleBook {
    public readonly chapters: BibleChapter[];
    public readonly id: number; // Changed to number
    
    // Progress tracking property
    public lastRead: string | null = null;

    constructor(
        public readonly name: string,
        public readonly testament: BibleTestament,
        public readonly group: BibleGroup,
        versesPerChapter: number[],
        memorizedData: Record<number, number[]> = {},
        public readonly canonicalAffiliation: string = 'All',
        public readonly order: number = 0
    ) {
        // Get numerical ID from book name
        this.id = BOOK_ID_MAP[name] || 0;
        if (this.id === 0) {
            console.warn(`No ID mapping found for book: ${name}`);
        }

        // Create chapters with memorization data and parent reference
        this.chapters = versesPerChapter.map((verseCount, idx) => {
            const chapterNumber = idx + 1;
            return new BibleChapter(
                chapterNumber,
                verseCount,
                memorizedData[chapterNumber] || [],
                this,
                []
            );
        });
    }

    // Getter for string-based book code (for display purposes)
    get bookCode(): string {
        // Generate a 3-letter code from the name for display
        const specialCases: Record<string, string> = {
            'Psalms': 'PSA',
            'Genesis': 'GEN',
            'Exodus': 'EXO',
            // ... add more if needed for display
        };
        
        return specialCases[this.name] || this.name.substring(0, 3).toUpperCase();
    }

    /**
     * Gets visible chapters based on user preferences
     */
    getVisibleChapters(includeApocrypha: boolean): BibleChapter[] {
        if (includeApocrypha) {
            return this.chapters;
        }

        return this.chapters.filter(chapter => !chapter.isApocryphal);
    }

    /**
     * Check if a specific chapter is apocryphal
     */
    isApocryphalChapter(chapterNumber: number): boolean {
        const chapter = this.chapters.find(ch => ch.chapterNumber === chapterNumber);
        return chapter ? chapter.isApocryphal : false;
    }

    get totalChapters(): number {
        return this.chapters.length;
    }

    get totalVerses(): number {
        return this.chapters.reduce((sum, chapter) => sum + chapter.totalVerses, 0);
    }

    get memorizedVerses(): number {
        return this.chapters.reduce((sum, chapter) => sum + chapter.memorizedVerses, 0);
    }

    get isCompleted(): boolean {
        return this.chapters.every(chapter => chapter.isComplete);
    }

    get percentComplete(): number {
        return this.totalVerses > 0
            ? Math.round((this.memorizedVerses / this.totalVerses) * 100)
            : 0;
    }

    get completedChapters(): number {
        return this.chapters.filter(chapter => chapter.isComplete).length;
    }

    get isInProgress(): boolean {
        return this.chapters.some(chapter => chapter.isInProgress);
    }

    get inProgressChapters(): number {
        return this.chapters.filter(chapter => chapter.isInProgress).length;
    }

    getChapter(chapterNumber: number): BibleChapter {
        if (chapterNumber < 1 || chapterNumber > this.totalChapters) {
            throw new Error(`Chapter ${chapterNumber} not found in book ${this.name}`);
        }
        return this.chapters[chapterNumber - 1];
    }

    markVerseAsMemorized(chapterNumber: number, verseNumber: number): void {
        const chapter = this.getChapter(chapterNumber);
        if (chapter) {
            chapter.markVerseAsMemorized(verseNumber);
            // Update lastRead when a verse is marked as memorized
            this.lastRead = new Date().toISOString();
        }
    }

    toggleVerse(chapterNumber: number, verseNumber: number): boolean {
        const chapter = this.getChapter(chapterNumber);
        const result = chapter ? chapter.toggleVerse(verseNumber) : false;
        if (result) {
            // Update lastRead when a verse is toggled
            this.lastRead = new Date().toISOString();
        }
        return result;
    }

    reset(): void {
        this.chapters.forEach(chapter => chapter.clearAllVerses());
        // Don't reset lastRead - keep historical data
    }

    getProgressData(): Record<number, number[]> {
        const result: Record<number, number[]> = {};
        this.chapters.forEach(chapter => {
            const memorizedVerses = chapter.getMemorizedVerseNumbers();
            if (memorizedVerses.length > 0) {
                result[chapter.chapterNumber] = memorizedVerses;
            }
        });
        return result;
    }

    get memorizedChapters(): number {
        return this.chapters.filter(chapter => chapter.isComplete).length;
    }

    // Book-level operations
    selectAllVerses(): void {
        this.chapters.forEach(chapter => chapter.selectAllVerses());
        // Update lastRead when all verses are selected
        this.lastRead = new Date().toISOString();
    }

    clearAllVerses(): void {
        this.chapters.forEach(chapter => chapter.clearAllVerses());
        // Don't update lastRead when clearing - keep historical data
    }
}