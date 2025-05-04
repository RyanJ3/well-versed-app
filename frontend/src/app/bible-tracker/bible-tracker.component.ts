// bible-tracker.component.ts - Main component for the Bible Memorization Tracker
import { Component } from '@angular/core';
import { BibleStatsComponent } from './bible-stats.component';
import { BookSelectorComponent } from './components/book-selector/book-selector.component';
import { ChapterProgressComponent } from './components/chapter-progress/chapter-progress.component';
import { ChapterSelectorComponent } from './components/chapter-selector/chapter-selector.component';
import { GroupSelectorComponent } from './components/group-selector/group-selector.component';
import { TestamentSelectorComponent } from './components/testament-selector/testament-selector.component';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  imports: [
    TestamentSelectorComponent,
    GroupSelectorComponent,
    BookSelectorComponent,
    ChapterSelectorComponent,
    ChapterProgressComponent,
  ],
  styleUrls: ['./bible-tracker.component.css'],
})
export class BibleTrackerComponent extends BibleStatsComponent{

  constructor() {
    super();
  }

}