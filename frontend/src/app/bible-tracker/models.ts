// models.ts - Contains all the data models for the application

export class BibleBook {
    testament: string;
    bookName: string;
    group: string;
    chapters: number[];
    totalChapters: number;
    totalVerses: number;
    order: number;
    canon: string[];

    constructor(testament: string, bookName: string, group: string, chapters: number[], order: number, canon: string[] = ["Protestant"]) {
        this.testament = testament;
        this.bookName = bookName;
        this.group = group;
        this.chapters = chapters;
        this.totalChapters = chapters.length;
        this.totalVerses = this.getTotalVerses();
        this.order = order;
        this.canon = canon;
    }

    getTotalVerses(): number {
        return this.chapters.reduce((sum, verses) => sum + verses, 0);
    }
}

// models.ts - update the ChapterProgress interface
export interface ChapterProgress {
    chapter: number;
    memorizedVerses: number; // Keep for backward compatibility
    inProgress: boolean;
    completed: boolean;
    versesMemorized: boolean[]; // Boolean array where each index represents a verse
}

// Keep other interfaces the same
export interface BookProgress {
    [key: string]: ChapterProgress[];
}

export interface GroupStats {
    percentComplete: number;
    completedChapters: number;
    totalChapters: number;
}

export interface BookStats {
    percentComplete: number;
    memorizedVerses: number;
    totalVerses: number;
    completedChapters: number;
    inProgressChapters: number;
}

export const BIBLE_DATA: { [key: string]: BibleBook } = {
    // Old Testament (39 books)
    // Torah/Pentateuch (5 books)
    Genesis: new BibleBook("Old Testament", "Genesis", "Torah", [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26], 1, ["Protestant", "Catholic", "Orthodox"]),
    Exodus: new BibleBook("Old Testament", "Exodus", "Torah", [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38], 2, ["Protestant", "Catholic", "Orthodox"]),
    Leviticus: new BibleBook("Old Testament", "Leviticus", "Torah", [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34], 3, ["Protestant", "Catholic", "Orthodox"]),
    Numbers: new BibleBook("Old Testament", "Numbers", "Torah", [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13], 4, ["Protestant", "Catholic", "Orthodox"]),
    Deuteronomy: new BibleBook("Old Testament", "Deuteronomy", "Torah", [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12], 5, ["Protestant", "Catholic", "Orthodox"]),

    // Historical Books (12 books)
    Joshua: new BibleBook("Old Testament", "Joshua", "Historical", [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33], 6, ["Protestant", "Catholic", "Orthodox"]),
    Judges: new BibleBook("Old Testament", "Judges", "Historical", [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25], 7, ["Protestant", "Catholic", "Orthodox"]),
    Ruth: new BibleBook("Old Testament", "Ruth", "Historical", [22, 23, 18, 22], 8, ["Protestant", "Catholic", "Orthodox"]),
    "1 Samuel": new BibleBook("Old Testament", "1 Samuel", "Historical", [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13], 9, ["Protestant", "Catholic", "Orthodox"]),
    "2 Samuel": new BibleBook("Old Testament", "2 Samuel", "Historical", [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25], 10, ["Protestant", "Catholic", "Orthodox"]),
    "1 Kings": new BibleBook("Old Testament", "1 Kings", "Historical", [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53], 11, ["Protestant", "Catholic", "Orthodox"]),
    "2 Kings": new BibleBook("Old Testament", "2 Kings", "Historical", [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30], 12, ["Protestant", "Catholic", "Orthodox"]),
    "1 Chronicles": new BibleBook("Old Testament", "1 Chronicles", "Historical", [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30], 13, ["Protestant", "Catholic", "Orthodox"]),
    "2 Chronicles": new BibleBook("Old Testament", "2 Chronicles", "Historical", [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23], 14, ["Protestant", "Catholic", "Orthodox"]),
    Ezra: new BibleBook("Old Testament", "Ezra", "Historical", [11, 70, 13, 24, 17, 22, 28, 36, 15, 44], 15, ["Protestant", "Catholic", "Orthodox"]),
    Nehemiah: new BibleBook("Old Testament", "Nehemiah", "Historical", [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31], 16, ["Protestant", "Catholic", "Orthodox"]),
    Esther: new BibleBook("Old Testament", "Esther", "Historical", [22, 23, 15, 17, 14, 14, 10, 17, 32, 3], 17, ["Protestant", "Catholic", "Orthodox"]),

    // Poetic/Wisdom Books (5 books)
    Job: new BibleBook("Old Testament", "Job", "Wisdom", [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17], 18, ["Protestant", "Catholic", "Orthodox"]),
    Psalms: new BibleBook("Old Testament", "Psalms", "Wisdom", [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6], 19, ["Protestant", "Catholic", "Orthodox"]),
    Proverbs: new BibleBook("Old Testament", "Proverbs", "Wisdom", [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31], 20, ["Protestant", "Catholic", "Orthodox"]),
    Ecclesiastes: new BibleBook("Old Testament", "Ecclesiastes", "Wisdom", [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14], 21, ["Protestant", "Catholic", "Orthodox"]),
    "Song of Solomon": new BibleBook("Old Testament", "Song of Solomon", "Wisdom", [17, 17, 11, 16, 16, 13, 13, 14], 22, ["Protestant", "Catholic", "Orthodox"]),

    // Major Prophets (5 books)
    Isaiah: new BibleBook("Old Testament", "Isaiah", "Prophets", [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24], 23, ["Protestant", "Catholic", "Orthodox"]),
    Jeremiah: new BibleBook("Old Testament", "Jeremiah", "Prophets", [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34], 24, ["Protestant", "Catholic", "Orthodox"]),
    Lamentations: new BibleBook("Old Testament", "Lamentations", "Prophets", [22, 22, 66, 22, 22], 25, ["Protestant", "Catholic", "Orthodox"]),
    Ezekiel: new BibleBook("Old Testament", "Ezekiel", "Prophets", [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35], 26, ["Protestant", "Catholic", "Orthodox"]),
    Daniel: new BibleBook("Old Testament", "Daniel", "Prophets", [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13], 27, ["Protestant", "Catholic", "Orthodox"]),

    // Minor Prophets (12 books)
    Hosea: new BibleBook("Old Testament", "Hosea", "Prophets", [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9], 28, ["Protestant", "Catholic", "Orthodox"]),
    Joel: new BibleBook("Old Testament", "Joel", "Prophets", [20, 32, 21], 29, ["Protestant", "Catholic", "Orthodox"]),
    Amos: new BibleBook("Old Testament", "Amos", "Prophets", [15, 16, 15, 13, 27, 14, 17, 14, 15], 30, ["Protestant", "Catholic", "Orthodox"]),
    Obadiah: new BibleBook("Old Testament", "Obadiah", "Prophets", [21], 31, ["Protestant", "Catholic", "Orthodox"]),
    Jonah: new BibleBook("Old Testament", "Jonah", "Prophets", [17, 10, 10, 11], 32, ["Protestant", "Catholic", "Orthodox"]),
    Micah: new BibleBook("Old Testament", "Micah", "Prophets", [16, 13, 12, 13, 15, 16, 20], 33, ["Protestant", "Catholic", "Orthodox"]),
    Nahum: new BibleBook("Old Testament", "Nahum", "Prophets", [15, 13, 19], 34, ["Protestant", "Catholic", "Orthodox"]),
    Habakkuk: new BibleBook("Old Testament", "Habakkuk", "Prophets", [17, 20, 19], 35, ["Protestant", "Catholic", "Orthodox"]),
    Zephaniah: new BibleBook("Old Testament", "Zephaniah", "Prophets", [18, 15, 20], 36, ["Protestant", "Catholic", "Orthodox"]),
    Haggai: new BibleBook("Old Testament", "Haggai", "Prophets", [15, 23], 37, ["Protestant", "Catholic", "Orthodox"]),
    Zechariah: new BibleBook("Old Testament", "Zechariah", "Prophets", [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21], 38, ["Protestant", "Catholic", "Orthodox"]),
    Malachi: new BibleBook("Old Testament", "Malachi", "Prophets", [14, 17, 18, 6], 39, ["Protestant", "Catholic", "Orthodox"]),

    // New Testament (27 books)
    // Gospels (4 books)
    Matthew: new BibleBook("New Testament", "Matthew", "Gospels", [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20], 40, ["Protestant", "Catholic", "Orthodox"]),
    Mark: new BibleBook("New Testament", "Mark", "Gospels", [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20], 41, ["Protestant", "Catholic", "Orthodox"]),
    Luke: new BibleBook("New Testament", "Luke", "Gospels", [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53], 42, ["Protestant", "Catholic", "Orthodox"]),
    John: new BibleBook("New Testament", "John", "Gospels", [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25], 43, ["Protestant", "Catholic", "Orthodox"]),

    // Historical Book (1 book)
    Acts: new BibleBook("New Testament", "Acts", "Modern Historical", [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31], 44, ["Protestant", "Catholic", "Orthodox"]),

    // Pauline Epistles (13 books)
    Romans: new BibleBook("New Testament", "Romans", "Pauline Epistles", [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27], 45, ["Protestant", "Catholic", "Orthodox"]),
    "1 Corinthians": new BibleBook("New Testament", "1 Corinthians", "Pauline Epistles", [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24], 46, ["Protestant", "Catholic", "Orthodox"]),
    "2 Corinthians": new BibleBook("New Testament", "2 Corinthians", "Pauline Epistles", [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14], 47, ["Protestant", "Catholic", "Orthodox"]),
    Galatians: new BibleBook("New Testament", "Galatians", "Pauline Epistles", [24, 21, 29, 31, 26, 18], 48, ["Protestant", "Catholic", "Orthodox"]),
    Ephesians: new BibleBook("New Testament", "Ephesians", "Pauline Epistles", [23, 22, 21, 32, 33, 24], 49, ["Protestant", "Catholic", "Orthodox"]),
    Philippians: new BibleBook("New Testament", "Philippians", "Pauline Epistles", [30, 30, 21, 23], 50, ["Protestant", "Catholic", "Orthodox"]),
    Colossians: new BibleBook("New Testament", "Colossians", "Pauline Epistles", [29, 23, 25, 18], 51, ["Protestant", "Catholic", "Orthodox"]),
    "1 Thessalonians": new BibleBook("New Testament", "1 Thessalonians", "Pauline Epistles", [10, 20, 13, 18, 28], 52, ["Protestant", "Catholic", "Orthodox"]),
    "2 Thessalonians": new BibleBook("New Testament", "2 Thessalonians", "Pauline Epistles", [12, 17, 18], 53, ["Protestant", "Catholic", "Orthodox"]),
    "1 Timothy": new BibleBook("New Testament", "1 Timothy", "Pauline Epistles", [20, 15, 16, 16, 25, 21], 54, ["Protestant", "Catholic", "Orthodox"]),
    "2 Timothy": new BibleBook("New Testament", "2 Timothy", "Pauline Epistles", [18, 26, 17, 22], 55, ["Protestant", "Catholic", "Orthodox"]),
    Titus: new BibleBook("New Testament", "Titus", "Pauline Epistles", [16, 15, 15], 56, ["Protestant", "Catholic", "Orthodox"]),
    Philemon: new BibleBook("New Testament", "Philemon", "Pauline Epistles", [25], 57, ["Protestant", "Catholic", "Orthodox"]),

    // General Epistles (8 books)
    Hebrews: new BibleBook("New Testament", "Hebrews", "General Epistles", [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25], 58, ["Protestant", "Catholic", "Orthodox"]),
    James: new BibleBook("New Testament", "James", "General Epistles", [27, 26, 18, 17, 20], 59, ["Protestant", "Catholic", "Orthodox"]),
    "1 Peter": new BibleBook("New Testament", "1 Peter", "General Epistles", [25, 25, 22, 19, 14], 60, ["Protestant", "Catholic", "Orthodox"]),
    "2 Peter": new BibleBook("New Testament", "2 Peter", "General Epistles", [21, 22, 18], 61, ["Protestant", "Catholic", "Orthodox"]),
    "1 John": new BibleBook("New Testament", "1 John", "General Epistles", [10, 29, 24, 21, 21], 62, ["Protestant", "Catholic", "Orthodox"]),
    "2 John": new BibleBook("New Testament", "2 John", "General Epistles", [13], 63, ["Protestant", "Catholic", "Orthodox"]),
    "3 John": new BibleBook("New Testament", "3 John", "General Epistles", [14], 64, ["Protestant", "Catholic", "Orthodox"]),
    Jude: new BibleBook("New Testament", "Jude", "General Epistles", [25], 65, ["Protestant", "Catholic", "Orthodox"]),

    // Apocalyptic Book (1 book)
    Revelation: new BibleBook("New Testament", "Revelation", "Apocalyptic", [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21], 66, ["Protestant", "Catholic", "Orthodox"]),

    // Catholic Deuterocanonical Books (7 books)
    Tobit: new BibleBook("Old Testament", "Tobit", "Deuterocanonical", [22, 14, 17, 21, 22, 18, 16, 21, 6, 13, 18, 22, 18], 67, ["Catholic", "Orthodox"]),
    Judith: new BibleBook("Old Testament", "Judith", "Deuterocanonical", [16, 28, 10, 15, 24, 21, 32, 36, 14, 23, 23, 20, 20, 19, 14, 25], 68, ["Catholic", "Orthodox"]),
    "1 Maccabees": new BibleBook("Old Testament", "1 Maccabees", "Deuterocanonical", [64, 70, 60, 61, 68, 63, 50, 32, 73, 89, 74, 53, 53, 49, 41, 24], 69, ["Catholic", "Orthodox"]),
    "2 Maccabees": new BibleBook("Old Testament", "2 Maccabees", "Deuterocanonical", [36, 32, 40, 50, 27, 31, 42, 36, 29, 38, 38, 45, 26, 46, 39], 70, ["Catholic", "Orthodox"]),
    Wisdom: new BibleBook("Old Testament", "Wisdom", "Deuterocanonical", [16, 24, 19, 20, 23, 25, 30, 21, 18, 21, 26, 27, 19, 31, 19, 29, 21, 25, 22], 71, ["Catholic", "Orthodox"]),
    Sirach: new BibleBook("Old Testament", "Sirach", "Deuterocanonical", [30, 18, 31, 31, 15, 37, 36, 19, 18, 31, 34, 18, 26, 27, 20, 30, 32, 33, 30, 31, 28, 27, 27, 34, 26, 29, 30, 26, 28, 25, 31, 24, 33, 31, 26, 31, 31, 34, 35, 30, 22, 25, 33, 23, 26, 20, 25, 25, 16, 29, 30], 72, ["Catholic", "Orthodox"]),
    Baruch: new BibleBook("Old Testament", "Baruch", "Deuterocanonical", [22, 35, 37, 37, 9], 73, ["Catholic", "Orthodox"]),

    // Orthodox-only Deuterocanonical Books
    "3 Maccabees": new BibleBook("Old Testament", "3 Maccabees", "Deuterocanonical", [29, 33, 30, 21, 51, 41, 23], 74, ["Orthodox"]),
    "4 Maccabees": new BibleBook("Old Testament", "4 Maccabees", "Deuterocanonical", [35, 24, 21, 26, 38, 35, 23, 29, 32, 21, 27, 19, 27, 20, 32, 25, 24, 24], 75, ["Orthodox"]),
    "1 Esdras": new BibleBook("Old Testament", "1 Esdras", "Deuterocanonical", [58, 30, 24, 63, 73, 34, 15, 96, 55], 76, ["Orthodox"]),
    "2 Esdras": new BibleBook("Old Testament", "2 Esdras", "Deuterocanonical", [40, 48, 36, 52, 56, 59, 70, 63, 47, 59, 46, 51, 58, 48, 63, 78], 77, ["Orthodox"]),
    "Prayer of Manasseh": new BibleBook("Old Testament", "Prayer of Manasseh", "Deuterocanonical", [15], 78, ["Orthodox"]),
    Psalm151: new BibleBook("Old Testament", "Psalm 151", "Deuterocanonical", [7], 79, ["Orthodox"])
};
