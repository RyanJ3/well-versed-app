import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confidence-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confidence-slider.component.html',
  styleUrls: ['./confidence-slider.component.scss'],
})
export class ConfidenceSliderComponent {
  @Input() label = '';
  @Input() value = 50;
  @Input() min = 0;
  @Input() max = 100;
  @Input() showEmojis = true;

  @Output() valueChange = new EventEmitter<number>();

  onChange(val: number) {
    this.valueChange.emit(val);
  }
}
