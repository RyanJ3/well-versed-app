import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  keys: string[];
  description: string;
}

@Component({
  selector: 'app-keyboard-help-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard-help-dialog.component.html',
  styleUrls: ['./keyboard-help-dialog.component.scss']
})
export class KeyboardHelpDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['←', 'P'], description: 'Previous segment' },
        { keys: ['→', 'N'], description: 'Next segment' },
        { keys: ['R', '0'], description: 'Reset view (show full journey)' },
        { keys: ['Home'], description: 'Go to first segment' },
        { keys: ['End'], description: 'Go to last segment' }
      ]
    },
    {
      title: 'Panels & Views',
      shortcuts: [
        { keys: ['J'], description: 'Toggle journey panel' },
        { keys: ['D', 'I'], description: 'Toggle segment details' },
        { keys: ['1'], description: '2D map view' },
        { keys: ['2'], description: '3D terrain view' },
        { keys: ['3'], description: 'Historical view' }
      ]
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['?', 'H'], description: 'Show this help' },
        { keys: ['Esc'], description: 'Close active panel/dialog' },
        { keys: ['Space'], description: 'Play/pause journey animation' },
        { keys: ['/'], description: 'Focus search' }
      ]
    }
  ];
  
  onClose(): void {
    this.close.emit();
  }
  
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onClose();
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }
}