import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersePickerComponent, VerseSelection } from '@components/bible/verse-range-picker/verse-range-picker.component';
import { CardWithVerses, VerseInCard } from '@services/deck.service';

@Component({
  selector: 'app-card-editor',
  standalone: true,
  imports: [CommonModule, VersePickerComponent],
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.scss']
})
export class CardEditorComponent {
  @Input() card!: CardWithVerses;
  @Input() pickerWarning = '';

  @Output() selectionApplied = new EventEmitter<VerseSelection>();
  @Output() remove = new EventEmitter<void>();

  getVerseCodes(card: CardWithVerses): string[] {
    return card.verses.map((v: VerseInCard) => v.verse_code);
  }
}
