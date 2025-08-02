import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersePickerComponent, VerseSelection } from '../../../../../../components/bible/verse-range-picker/verse-range-picker.component';

@Component({
  selector: 'app-verse-selector-panel',
  standalone: true,
  imports: [CommonModule, VersePickerComponent],
  templateUrl: './verse-selector-panel.component.html',
  styleUrls: ['./verse-selector-panel.component.scss'],
})
export class VerseSelectorPanelComponent {
  @Output() selection = new EventEmitter<VerseSelection>();

  apply(sel: VerseSelection) {
    this.selection.emit(sel);
  }
}
