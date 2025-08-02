import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BibleBook, BibleChapter } from '../../../../models/bible';
import { BibleVerse } from '../../../../models/bible/bible-verse.model';

@Component({
  selector: 'app-bible-tracker-verse-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bible-tracker-verse-grid.component.html',
  styleUrls: ['./bible-tracker-verse-grid.component.scss']
})
export class BibleTrackerVerseGridComponent {
  @Input() selectedBook: BibleBook | null = null;
  @Input() selectedChapter: BibleChapter | null = null;
  @Input() isLoading: boolean = false;
  @Input() isSavingBulk: boolean = false;
  @Output() verseToggled = new EventEmitter<BibleVerse>();
  @Output() selectAllVerses = new EventEmitter<void>();
  @Output() clearAllVerses = new EventEmitter<void>();
  
  toggleVerse(verse: any): void {
    if (!this.isLoading && !this.isSavingBulk) {
      this.verseToggled.emit(verse);
    }
  }
}
