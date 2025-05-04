import { BibleData, TestamentType, BookGroupType, BibleBook, BibleTestament, BibleChapter, BibleGroup } from '../models/bible.model';
import { Directive, OnInit, OnDestroy } from '@angular/core';
import { BibleService } from '../services/bible.service';

@Directive()
export abstract class BaseBibleComponent implements OnInit, OnDestroy {

  protected bibleData: BibleData = new BibleData();

  constructor() {
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  }

  // Hook for child components to react to Bible data being loaded
  protected onBibleDataLoaded(): void { }

  // Convenience methods for accessing Bible data
  getTestamentByName(testamentName: string): BibleTestament {
    return this.bibleData.getTestamentByName(testamentName);
  }

  get oldTestament(): BibleTestament {
    return this.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.getTestamentByName('NEW');
  }

  getDefaultTestament(): BibleTestament {
    return this.oldTestament;
  }

  getTestaments(): BibleTestament[] {
    return [this.oldTestament, this.newTestament];
  }

  getPercentComplete(): number {
    return this.bibleData.percentComplete;
  }

  getDefaultGroup(): BibleGroup {
    return this.getDefaultBook().group;
  }
  getBook(bookName: string): BibleBook {
    return this.bibleData.getBookByName(bookName);
  }

  getGroup(groupName: BookGroupType): BibleBook[] {
    return this.bibleData.getGroupByName(groupName).books;
  }

  getDefaultBook(): BibleBook {
    return this.getBook("Psalms");
  }

  getDefaultChapter(): BibleChapter {
    return this.getBook("Psalms").chapters[22];
  }

  getBooksInGroup(selectedGroup: BibleGroup): BibleBook[] {
    if (!selectedGroup) {
      console.warn('Selected group is undefined.');
      return [];
    }
    return this.bibleData.getGroupByName(selectedGroup.name).books || [];
  }

}
