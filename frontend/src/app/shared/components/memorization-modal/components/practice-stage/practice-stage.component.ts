import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { Verse, PracticeSettings } from '../../models/memorization.types';
import { STAGE_ICONS } from '../../models/memorization.constants';

@Component({
  selector: 'app-practice-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-stage.component.html',
  styleUrls: ['./practice-stage.component.scss'],
  animations: [
    trigger('verseTransition', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class PracticeStageComponent {
  @Input() currentVerses: Verse[] = [];
  @Input() currentStepIndex = 0;
  @Input() practiceSettings: PracticeSettings = {
    fontSize: 16,
    layoutMode: 'column'
  };
  @Input() canGoBack = false;
  @Input() stageNames: string[] = [];
  @Input() isSaving = false;
  
  @Output() nextStep = new EventEmitter<void>();
  @Output() prevStep = new EventEmitter<void>();
  @Output() jumpToStep = new EventEmitter<number>();
  @Output() settingsChange = new EventEmitter<PracticeSettings>();

  stageIcons = STAGE_ICONS;
  showSettingsDropdown = false;
  isGearSpinning = false;

  getVerseDisplay(v: Verse): string {
    if (this.currentStepIndex === 0) {
      return v.text;
    }
    if (this.currentStepIndex === 1) {
      return this.getInitials(v.text);
    }
    const wordCount = v.text.split(' ').length;
    return Array(Math.min(wordCount, 10)).fill('•').join(' ') + (wordCount > 10 ? '...' : '');
  }

  getInitials(text: string): string {
    return text
      .split(' ')
      .map(word => {
        const match = word.match(/[a-zA-Z]/);
        if (match) {
          const index = word.indexOf(match[0]);
          return word.substring(0, index + 1);
        }
        return word;
      })
      .join(' ');
  }

  getStageIcon(stage: string): string {
    return this.stageIcons[stage] || stage.charAt(0);
  }

  toggleSettingsDropdown() {
    this.showSettingsDropdown = !this.showSettingsDropdown;
    this.isGearSpinning = true;
    setTimeout(() => (this.isGearSpinning = false), 600);
  }

  increaseFontSize() {
    if (this.practiceSettings.fontSize < 24) {
      const newSettings = { ...this.practiceSettings, fontSize: this.practiceSettings.fontSize + 2 };
      this.settingsChange.emit(newSettings);
    }
  }

  decreaseFontSize() {
    if (this.practiceSettings.fontSize > 12) {
      const newSettings = { ...this.practiceSettings, fontSize: this.practiceSettings.fontSize - 2 };
      this.settingsChange.emit(newSettings);
    }
  }

  setLayoutMode(mode: 'column' | 'paragraph') {
    const newSettings = { ...this.practiceSettings, layoutMode: mode };
    this.settingsChange.emit(newSettings);
  }

  onJumpToStep(index: number) {
    this.jumpToStep.emit(index);
  }

  onNext() {
    this.nextStep.emit();
  }

  onPrev() {
    this.prevStep.emit();
  }
}
