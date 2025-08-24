import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PracticeSettings {
  fontSize: number;
  layoutMode: 'column' | 'paragraph';
}

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.scss']
})
export class SettingsMenuComponent {
  @Input() practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };
  @Input() position: 'header' | 'bottom' = 'bottom';
  @Output() settingsChange = new EventEmitter<PracticeSettings>();

  showSettings = false;
  isGearSpinning = false;

  toggleSettings() {
    this.showSettings = !this.showSettings;
    this.isGearSpinning = true;
    setTimeout(() => (this.isGearSpinning = false), 600);
  }

  increaseFontSize() {
    if (this.practiceSettings.fontSize < 24) {
      this.practiceSettings = {
        ...this.practiceSettings,
        fontSize: this.practiceSettings.fontSize + 2
      };
      this.settingsChange.emit(this.practiceSettings);
    }
  }

  decreaseFontSize() {
    if (this.practiceSettings.fontSize > 12) {
      this.practiceSettings = {
        ...this.practiceSettings,
        fontSize: this.practiceSettings.fontSize - 2
      };
      this.settingsChange.emit(this.practiceSettings);
    }
  }

  setLayoutMode(mode: 'column' | 'paragraph') {
    this.practiceSettings = {
      ...this.practiceSettings,
      layoutMode: mode
    };
    this.settingsChange.emit(this.practiceSettings);
  }
}