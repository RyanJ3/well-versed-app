import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FlowVerse } from '../../models/flow.models';

@Component({
  selector: 'app-flow-grid-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-grid-view.component.html',
  styleUrls: ['./flow-grid-view.component.scss']
})
export class FlowGridViewComponent {
  @Input() verses: FlowVerse[] = [];
  @Input() layoutMode: 'grid' | 'single' = 'grid';
  @Input() showVerseNumbers = true;
  @Input() highlightFifthVerse = true;
  @Input() fontSize = 16;
  @Output() toggleVerse = new EventEmitter<FlowVerse>();
  
  gridRows: FlowVerse[][] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.prepareGridRows();
  }

  private prepareGridRows() {
    this.gridRows = [];
    if (this.layoutMode === 'grid' && this.verses.length > 0) {
      for (let i = 0; i < this.verses.length; i += 5) {
        const row = [];
        for (let j = 0; j < 5; j++) {
          row.push(this.verses[i + j] || null);
        }
        this.gridRows.push(row);
      }
    }
  }

  formatFirstLetters(verse: FlowVerse): SafeHtml {
    if (!verse.firstLetters) return '';

    let formatted = verse.firstLetters;
    if (formatted.includes('**¶')) {
      formatted = formatted.replace(/\*\*¶/g, '<br>');
    }

    return this.sanitizer.sanitize(1, formatted) || '';
  }

  getVerseClass(verse: FlowVerse | null): string {
    if (!verse) return 'empty-cell';

    const classes = ['verse-cell'];
    if (verse.isFifth && this.highlightFifthVerse) {
      classes.push('fifth-verse');
    }
    if (verse.isMemorized) {
      classes.push('memorized');
    }
    if (verse.isSaving) {
      classes.push('saving');
    }
    return classes.join(' ');
  }

  getVerseReference(verse: FlowVerse): string {
    const bookId = parseInt(verse.verseCode.split('-')[0]);
    // This would need to be passed in or handled differently
    // For now, returning the basic reference
    return verse.reference;
  }

  onToggleVerse(verse: FlowVerse) {
    if (!verse.isSaving) {
      this.toggleVerse.emit(verse);
    }
  }
}
