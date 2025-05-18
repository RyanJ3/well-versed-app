// src/app/models/bible/bible-book.model.ts
import { BibleChapter } from './bible-chapter.model';
import { BibleGroup } from './bible-group.modle';
import { BibleTestament } from './bible-testament.model';

/**
 * Model class representing a Bible book
 */
export class BibleBook {
    public readonly chapters: BibleChapter[];
    public readonly id: string;

    constructor(
        public readonly name: string,
        public readonly testament: BibleTestament,
        public readonly group: BibleGroup,
        versesPerChapter: number[],
        memorizedData: Record<number, number[]> = {},
        public readonly canonicalAffiliation: string = 'All',
        public readonly order: number = 0
    ) {
        // Generate appropriate ID based on book name
        this.id = this.generateBookId(name);

        // Create chapters with memorization data and parent reference
        this.chapters = versesPerChapter.map((verseCount, idx) => {
            const chapterNumber = idx + 1;
            return new BibleChapter(
                chapterNumber,
                verseCount,
                memorizedData[chapterNumber] || []
            );
        });
    }

    // Generate book ID (shorthand code like GEN, MAT, etc.)
    private generateBookId(bookName: string): string {
        // Special cases for books that might have abbreviation issues
        const specialCases: Record<string, string> = {
            'Psalms': 'PSA',
            'Psalm': 'PSA',
            'Psalm 151': 'PS151',  // Special case for Psalm 151
            'Genesis': 'GEN',
            'Exodus': 'EXO',
            'Leviticus': 'LEV',
            'Numbers': 'NUM',
            'Deuteronomy': 'DEU',
            'Joshua': 'JOS',
            'Judges': 'JDG',
            'Ruth': 'RUT',
            'Esther': 'EST',
            'Job': 'JOB',
            'Proverbs': 'PRO',
            'Ecclesiastes': 'ECC',
            'Isaiah': 'ISA',
            'Jeremiah': 'JER',
            'Lamentations': 'LAM',
            'Ezekiel': 'EZK',
            'Daniel': 'DAN',
            'Hosea': 'HOS',
            'Joel': 'JOL',
            'Amos': 'AMO',
            'Obadiah': 'OBA',
            'Jonah': 'JON',
            'Micah': 'MIC',
            'Nahum': 'NAH',
            'Habakkuk': 'HAB',
            'Zephaniah': 'ZEP',
            'Haggai': 'HAG',
            'Zechariah': 'ZEC',
            'Malachi': 'MAL',
            'Matthew': 'MAT',
            'Mark': 'MRK',
            'Luke': 'LUK',
            'John': 'JHN',
            'Acts': 'ACT',
            'Romans': 'ROM',
            'Revelation': 'REV'
        };

        // Check if the book is in our special cases list
        if (specialCases[bookName]) {
            return specialCases[bookName];
        }

        // Handle numbered books like "1 Samuel" -> "1SA"
        if (bookName.match(/^\d+\s/)) {
            const parts = bookName.split(' ');
            const number = parts[0];
            const abbr = parts.slice(1).join(' ').substring(0, 3).toUpperCase();
            return `${number}${abbr}`;
        }

        // Default: first 3 letters uppercase
        return bookName.substring(0, 3).toUpperCase();
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
        // Special handling for Psalms
        if (this.name === 'Psalms' && chapterNumber === 151) {
            return true;
        }

        // Get the chapter
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
        }
    }

    toggleVerse(chapterNumber: number, verseNumber: number): boolean {
        const chapter = this.getChapter(chapterNumber);
        return chapter ? chapter.toggleVerse(verseNumber) : false;
    }

    reset(): void {
        this.chapters.forEach(chapter => chapter.clearAllVerses());
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
    }

    clearAllVerses(): void {
        this.chapters.forEach(chapter => chapter.clearAllVerses());
    }
}