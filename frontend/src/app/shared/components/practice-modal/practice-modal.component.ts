import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PracticeVerse {
  verseCode: string;
  reference: string;
  text: string;
  firstLetters: string;
  isMemorized: boolean;
  isFifth: boolean;
}

@Component({
  selector: 'app-practice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-modal.component.html',
  styleUrls: ['./practice-modal.component.scss'],
})
export class PracticeModalComponent {
  @Input() show = false;
  @Input() verses: PracticeVerse[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<void>();

  layoutMode: 'grid' | 'single' = 'grid';
  showVerseText = false;
  highlightFifthVerse = true;
  confidenceLevel = 50;
  isSaving = false;

  gridRows: (PracticeVerse | null)[][] = [];

  ngOnChanges() {
    this.prepareGridRows();
  }

  toggleLayout() {
    this.layoutMode = this.layoutMode === 'grid' ? 'single' : 'grid';
    this.prepareGridRows();
  }

  prepareGridRows() {
    this.gridRows = [];
    if (this.layoutMode === 'grid') {
      for (let i = 0; i < this.verses.length; i += 5) {
        const row: (PracticeVerse | null)[] = [];
        for (let j = 0; j < 5; j++) {
          row.push(this.verses[i + j] || null);
        }
        this.gridRows.push(row);
      }
    }
  }

  getVerseClass(verse: PracticeVerse | null): string {
    if (!verse) return 'empty-cell';
    const classes = ['verse-cell'];
    if (verse.isFifth && this.highlightFifthVerse) {
      classes.push('fifth-verse');
    }
    return classes.join(' ');
  }

  onClose() {
    this.close.emit();
  }

  onComplete() {
    this.complete.emit();
  }
}
