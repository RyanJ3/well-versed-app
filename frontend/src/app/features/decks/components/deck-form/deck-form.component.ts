import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DeckFormValue {
  name: string;
  description: string;
  isPublic: boolean;
}

@Component({
  selector: 'app-deck-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deck-form.component.html',
  styleUrls: ['./deck-form.component.scss']
})
export class DeckFormComponent {
  @Input() value: DeckFormValue = { name: '', description: '', isPublic: false };
  @Input() saving = false;

  @Output() submitForm = new EventEmitter<DeckFormValue>();

  onSubmit() {
    this.submitForm.emit(this.value);
  }
}
