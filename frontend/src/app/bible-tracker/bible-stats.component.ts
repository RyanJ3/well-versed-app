import { Directive, Input, OnInit } from "@angular/core";
import { BibleBook, BibleChapter, BibleData, BibleGroup, BibleTestament } from "../models/bible.model";
import { Subject } from "rxjs";

@Directive()
export abstract class BibleStatsComponent {

    private bibleData: BibleData = new BibleData();

    @Input() selectedTestament: BibleTestament = this.defaultTestament;
    @Input() selectedGroup: BibleGroup = this.defaultGroup;
    @Input() selectedBook: BibleBook = this.defaultBook;
    @Input() selectedChapter: BibleChapter = this.defaultChapter;

    // Subjects to notify changes
    testamentChange$ = new Subject<BibleTestament>();
    groupChange$ = new Subject<BibleGroup>();
    bookChange$ = new Subject<BibleBook>();
    chapterChange$ = new Subject<BibleChapter>();

    constructor() { }

    // Cascade updates when selecting a testament
    selectTestament(testament: BibleTestament): void {
        this.selectedTestament = testament;
        
        // Update group when testament changes
        const firstGroup = testament.groups[0] || null;
        if (firstGroup) {
            this.selectGroup(firstGroup);
        }
    }

    // Cascade updates when selecting a group
    selectGroup(group: BibleGroup): void {
        this.selectedGroup = group;
        
        // Update book when group changes
        const firstBook = group.books[0] || null;
        if (firstBook) {
            this.selectBook(firstBook);
        }
    }

    // Cascade updates when selecting a book
    selectBook(book: BibleBook): void {
        this.selectedBook = book;
        
        // Update chapter when book changes
        const firstChapter = book.chapters[0] || null;
        if (firstChapter) {
            this.selectChapter(firstChapter);
        }
    }

    // Simple update for chapter
    selectChapter(chapter: BibleChapter): void {
        this.selectedChapter = chapter;
    }


    // Convenience methods for accessing Bible data
    getTestamentByName(testamentName: string): BibleTestament {
        return this.bibleData.getTestamentByName(testamentName);
    }

    getGroupByName(groupName: string): BibleBook[] {
        return this.bibleData.getGroupByName(groupName).books;
    }

    getBookByName(bookName: string): BibleBook {
        return this.bibleData.getBookByName(bookName);
    }

    get oldTestament(): BibleTestament {
        return this.getTestamentByName('OLD');
    }

    get newTestament(): BibleTestament {
        return this.getTestamentByName('NEW');
    }

    get defaultTestament(): BibleTestament {
        return this.oldTestament;
    }

    get testaments(): BibleTestament[] {
        return [this.oldTestament, this.newTestament];
    }

    get percentComplete(): number {
        return this.bibleData.percentComplete;
    }

    get defaultGroup(): BibleGroup {
        return this.defaultBook.group;
    }

    get defaultBook(): BibleBook {
        return this.getBookByName("Psalms");
    }

    get defaultChapter(): BibleChapter {
        return this.getBookByName("Psalms").chapters[22];
    }

    flipTestaments() {
        this.selectedTestament = ((this.selectedTestament === this.oldTestament) ?
            this.newTestament : this.oldTestament);
    }
}