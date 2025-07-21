import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersePickerComponent, VerseSelection } from '../../../../shared/components/verse-range-picker/verse-range-picker.component';
import { CardWithVerses } from '../../../../core/services/deck.service';

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
}
