import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../../../services/bible.service';
import { BaseBibleComponent } from '../../base-bible.component';
import { VerseSelectorComponent } from '../verse-selector/verse-selector.component';
import { BibleBook, BibleChapter } from '../../../models/bible.model';

@Component({
  selector: 'app-chapter-progress',
  templateUrl: './chapter-progress.component.html',
  styleUrls: ['./chapter-progress.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    VerseSelectorComponent
  ]
})
export class ChapterProgressComponent extends BaseBibleComponent implements OnInit {

  @Input() selectedChapter: BibleChapter ;
  @Input() selectedBook: BibleBook ;
  
  constructor() {
    super();

    this.selectedChapter = this.getDefaultChapter();
    this.selectedBook = this.getDefaultBook();
  }
  
}