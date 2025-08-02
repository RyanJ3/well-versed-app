import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-setup-stage',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('optionHover', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './setup-stage.component.html',
  styleUrls: ['./setup-stage.component.scss']
})
export class SetupStageComponent {
  @Input() groupSize = 2;
  @Input() verseCount = 0;
  @Output() groupSizeChange = new EventEmitter<number>();
  @Output() start = new EventEmitter<void>();

  get groupCount(): number {
    return Math.ceil(this.verseCount / this.groupSize);
  }

  setGroupSize(size: number) {
    this.groupSize = size;
    this.groupSizeChange.emit(size);
  }

  onStart() {
    this.start.emit();
  }
}