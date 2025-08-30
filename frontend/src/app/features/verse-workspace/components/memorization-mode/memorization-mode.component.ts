import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceVerse, ModalVerse } from '../../models/workspace.models';
import { VerseListComponent } from '../verse-list/verse-list.component';
import { WorkspaceVerseFacade } from '../../services/workspace-verse.facade';
import { WorkspaceMemorizationFacade } from '../../services/workspace-memorization.facade';
import { WorkspaceSelectionService } from '../../services/workspace-selection.service';
import { WorkspaceMemorizationService } from '../../services/workspace-memorization.service';
import { NotificationService } from '@services/utils/notification.service';

@Component({
  selector: 'app-memorization-mode',
  standalone: true,
  imports: [CommonModule, VerseListComponent],
  template: `
    <div class="memorization-container" *ngIf="active">
      <!-- Empty state when no verses -->
      <div class="instructions" *ngIf="verses.length === 0 && !isLoading">
        Right-click for options • Space to select • Enter to study • Arrow keys to navigate
      </div>

      <!-- Verse list grid -->
      <app-verse-list
        *ngIf="!isLoading && verses.length > 0"
        [verses]="verses"
        [filteredVerses]="filteredVerses"
        [selectedVerses]="selectedVerses"
        [isRTL]="isRTL"
        [fontSize]="fontSize"
        [layoutMode]="layoutMode"
        [isTextMode]="isTextMode"
        [showVerseNumbers]="showVerseNumbers"
        [userPreferredLanguage]="userPreferredLanguage"
        (verseClick)="onVerseClick($event)"
        (verseRightClick)="onVerseRightClick($event)"
        (verseDoubleClick)="onVerseDoubleClick($event)"
        (verseDragStart)="onVerseDragStart($event)"
        (selectionRectangle)="onSelectionRectangle($event)"
      ></app-verse-list>
    </div>
  `,
  styles: [`
    .memorization-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .instructions {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
      font-size: 0.875rem;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class MemorizationModeComponent implements OnInit {
  @Input() active: boolean = false;
  @Input() verses: WorkspaceVerse[] = [];
  @Input() filteredVerses: WorkspaceVerse[] = [];
  @Input() selectedVerses: Set<string> = new Set();
  @Input() isLoading: boolean = false;
  @Input() isRTL: boolean = false;
  @Input() fontSize: number = 16;
  @Input() layoutMode: 'grid' | 'single' = 'grid';
  @Input() isTextMode: boolean = false;
  @Input() showVerseNumbers: boolean = true;
  @Input() userPreferredLanguage: string = '';

  @Output() verseSelected = new EventEmitter<{verse: WorkspaceVerse, multiSelect: boolean}>();
  @Output() verseToggleMemorized = new EventEmitter<WorkspaceVerse>();
  @Output() contextMenuRequested = new EventEmitter<{event: MouseEvent, verse: WorkspaceVerse}>();
  @Output() startMemorizationSession = new EventEmitter<WorkspaceVerse>();
  @Output() rectangleSelection = new EventEmitter<WorkspaceVerse[]>();

  constructor(
    private verseFacade: WorkspaceVerseFacade,
    private memorizationFacade: WorkspaceMemorizationFacade,
    private selectionService: WorkspaceSelectionService,
    private memorizationService: WorkspaceMemorizationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Component initialization if needed
  }

  onVerseClick(event: {verse: WorkspaceVerse, event: MouseEvent}) {
    const multiSelect = event.event.ctrlKey || event.event.metaKey || event.event.shiftKey;
    this.verseSelected.emit({verse: event.verse, multiSelect});
  }

  onVerseRightClick(event: {verse: WorkspaceVerse, event: MouseEvent}) {
    event.event.preventDefault();
    this.contextMenuRequested.emit({event: event.event, verse: event.verse});
  }

  onVerseDoubleClick(verse: WorkspaceVerse) {
    this.startMemorizationSession.emit(verse);
  }

  onVerseDragStart(event: {verse: WorkspaceVerse, event: DragEvent}) {
    // Handle drag start for verse
    if (event.event.dataTransfer) {
      event.event.dataTransfer.effectAllowed = 'copy';
      event.event.dataTransfer.setData('text/plain', event.verse.text);
      event.event.dataTransfer.setData('application/json', JSON.stringify({
        verseCode: event.verse.verseCode,
        reference: event.verse.fullReference,
        text: event.verse.text
      }));
    }
  }

  onSelectionRectangle(verses: WorkspaceVerse[]) {
    this.rectangleSelection.emit(verses);
  }

  // Quick actions
  toggleVerseMemorized(verse: WorkspaceVerse) {
    this.verseToggleMemorized.emit(verse);
  }

  markSelectedAsMemorized(memorized: boolean) {
    const selectedVerses = Array.from(this.selectedVerses);
    selectedVerses.forEach(verseCode => {
      const verse = this.verses.find(v => v.verseCode === verseCode);
      if (verse && verse.isMemorized !== memorized) {
        this.verseToggleMemorized.emit(verse);
      }
    });
  }
}