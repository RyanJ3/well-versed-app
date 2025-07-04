import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FlowVerse } from '../../models/flow.models';

@Component({
  selector: 'app-flow-text-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-text-view.component.html',
  styleUrls: ['./flow-text-view.component.scss']
})
export class FlowTextViewComponent {
  @Input() verses: FlowVerse[] = [];
  @Input() showVerseNumbers = true;
  @Input() fontSize = 16;

  constructor(private sanitizer: DomSanitizer) {}

  getPlainTextContent(): SafeHtml {
    if (!this.verses.length) return '';

    const parts = this.verses.map((v) => {
      let text = v.text;
      if (text.includes('**¶')) {
        text = text.replace(/\*\*¶/g, '<br><br>');
      }

      const verseNum = `<sup class="verse-num">${v.verse}</sup> `;
      return (this.showVerseNumbers ? verseNum : '') + text;
    });

    const combined = parts.join(' ');
    return this.sanitizer.sanitize(1, combined) || '';
  }
}
