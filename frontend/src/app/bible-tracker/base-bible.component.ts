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
  protected onBibleDataLoaded(): void {}

  // Convenience methods for accessing Bible data
  getTestament(testament: TestamentType): BibleTestament | undefined {
    return this.bibleData?.getTestamentByName(testament);
  }

  getOldTestament(): BibleTestament | undefined {
    return this.getTestament(TestamentType.OLD);
  }

  getNewTestament(): BibleTestament | undefined {
    return this.getTestament(TestamentType.NEW);
  }

  getDefaultTestament(): BibleTestament | undefined{
    return this.getOldTestament();
  }

  getDefaultGroup(): BibleGroup | undefined{
    return this.getDefaultBook()?.group;
  }
  getBook(bookName: string): BibleBook | undefined {
    return this.bibleData?.getBook(bookName);
  }

  getGroup(groupName: BookGroupType): BibleBook[] | undefined {
    return this.bibleData?.getGroupByName(groupName)?.books;
  }

  getDefaultBook(): BibleBook | undefined{
    return this.getBook("Psalms");
  }

  getDefaultChapter(): BibleChapter | undefined {
    return this.getBook("Psalms")?.chapters[22];
  }

}
