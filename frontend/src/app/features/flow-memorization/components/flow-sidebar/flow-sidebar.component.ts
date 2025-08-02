import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersePickerComponent, VerseSelection } from '@components/bible/verse-range-picker/verse-range-picker.component';
import { FlowProgressComponent } from '../flow-progress/flow-progress.component';
import { FlowVerse, FlowViewSettings } from '@models/flow.models';

@Component({
  selector: 'app-flow-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    VersePickerComponent,
    FlowProgressComponent
  ],
  templateUrl: './flow-sidebar.component.html',
  styleUrls: ['./flow-sidebar.component.scss']
})
export class FlowSidebarComponent implements OnInit {
  @Input() verses: FlowVerse[] = [];
  @Input() initialSelection: VerseSelection | null = null;
  @Input() warningMessage: string | null = null;
  @Input() retryCountdown: number | null = null;
  @Input() isLoading = false;
  @Input() isSaving = false;
  @Input() viewSettings!: FlowViewSettings;
  @Input() memorizedCount = 0;
  
  @Output() selectionApplied = new EventEmitter<VerseSelection>();
  @Output() startMemorization = new EventEmitter<void>();
  @Output() viewSettingsChanged = new EventEmitter<Partial<FlowViewSettings>>();
  @Output() toggleVerse = new EventEmitter<FlowVerse>();
  @Output() markAllMemorized = new EventEmitter<void>();
  @Output() deselectAllVerses = new EventEmitter<void>();
  
  openMenu: 'layout' | 'toggle' | null = null;

  ngOnInit() {
    if (!this.viewSettings) {
      this.viewSettings = {
        layoutMode: 'grid',
        isTextMode: false,
        highlightFifthVerse: true,
        showVerseNumbers: true,
        fontSize: 16
      };
    }
  }

  onVerseSelectionChanged(selection: VerseSelection) {
    this.selectionApplied.emit(selection);
  }

  setViewMode(mode: 'flow' | 'text') {
    this.viewSettingsChanged.emit({ isTextMode: mode === 'text' });
  }

  setLayoutMode(mode: 'grid' | 'single') {
    this.viewSettingsChanged.emit({ layoutMode: mode });
  }

  increaseFontSize() {
    if (this.viewSettings.fontSize < 24) {
      this.viewSettingsChanged.emit({ fontSize: this.viewSettings.fontSize + 2 });
    }
  }

  decreaseFontSize() {
    if (this.viewSettings.fontSize > 12) {
      this.viewSettingsChanged.emit({ fontSize: this.viewSettings.fontSize - 2 });
    }
  }

  toggleMenu(menu: 'layout' | 'toggle') {
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  onToggleVerse(verse: FlowVerse) {
    this.toggleVerse.emit(verse);
  }
}
