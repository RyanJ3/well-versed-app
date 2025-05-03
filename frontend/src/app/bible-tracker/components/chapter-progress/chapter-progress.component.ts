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
  standalone: true,  // If using standalone component approach
  imports: [
    CommonModule,
    VerseSelectorComponent  // Make sure this component is also properly configured
  ]
})
export class ChapterProgressComponent extends BaseBibleComponent implements OnInit {

  @Input() selectedChapter?: BibleChapter | undefined;
  @Input() selectedBook?: BibleBook | undefined;
  
  constructor() {
    super();
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
  }
  
}