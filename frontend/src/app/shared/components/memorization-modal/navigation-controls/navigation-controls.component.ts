import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-controls.component.html',
  styleUrls: ['./navigation-controls.component.css']
})
export class NavigationControlsComponent {
  @Input() canGoBack = false;
  @Input() currentStepIndex = 0;
  @Input() nextDisabled = false;
  @Input() stageNames: string[] = ['Read', 'Flow', 'Memory'];
  
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() jumpToStep = new EventEmitter<number>();

  getStageIcon(stage: string): string {
    switch (stage) {
      case 'Read':
        return '📖';
      case 'Flow':
        return '〰️';
      case 'Memory':
        return '🧠';
      default:
        return stage.charAt(0);
    }
  }
}