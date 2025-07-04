import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { Verse } from '../../models/memorization.types';

@Component({
  selector: 'app-setup-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup-stage.component.html',
  styleUrls: ['./setup-stage.component.scss'],
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
  ]
})
export class SetupStageComponent {
  @Input() verses: Verse[] = [];
  @Input() groupSize = 2;
  @Output() groupSizeChange = new EventEmitter<number>();
  @Output() startPractice = new EventEmitter<void>();

  get estimatedTime(): number {
    const groupCount = Math.ceil(this.verses.length / this.groupSize);
    return Math.round(groupCount * 3 * 1.5);
  }

  get groupCount(): number {
    return Math.ceil(this.verses.length / this.groupSize);
  }

  setGroupSize(size: number) {
    this.groupSize = size;
    this.groupSizeChange.emit(size);
  }

  start() {
    this.startPractice.emit();
  }
}
