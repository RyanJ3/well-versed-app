import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceVerse } from '../../models/workspace.models';
import { WorkspaceCrossReferencesService } from '../../services/workspace-cross-references.service';
import { WorkspaceLoadingComponent } from '../workspace-loading/workspace-loading.component';

@Component({
  selector: 'app-cross-references-mode',
  standalone: true,
  imports: [CommonModule, WorkspaceLoadingComponent],
  template: `
    <div class="cross-references-container" *ngIf="active">
      <!-- Cross-references grid -->
      <div *ngIf="!isLoading && verses.length > 0" class="verses-grid cross-references-grid">
        <!-- Selected Verse Card (highlighted) -->
        <div class="selected-verse-card" *ngIf="selectedVerse">
          <div class="card-header">
            <span class="card-label">Selected Verse</span>
            <span class="card-reference">{{ selectedVerse.displayText }}</span>
          </div>
          <div class="card-text" [dir]="isRTL ? 'rtl' : 'ltr'">
            {{ selectedVerse.text || 'Loading verse text...' }}
          </div>
        </div>
        
        <!-- Cross-Reference Cards -->
        <div
          *ngFor="let verse of filteredVerses; let i = index"
          class="verse-block cross-ref-card"
          [class.memorized]="verse.isMemorized"
          [class.selected]="isVerseSelected(verse)"
          [class.high-confidence]="verse.crossRefConfidence && verse.crossRefConfidence > 0.7"
          [class.medium-confidence]="verse.crossRefConfidence && verse.crossRefConfidence > 0.4 && verse.crossRefConfidence <= 0.7"
          [class.low-confidence]="verse.crossRefConfidence && verse.crossRefConfidence <= 0.4"
          [style.fontSize.px]="fontSize"
          (click)="onVerseClick(verse, $event)"
          (contextmenu)="onVerseRightClick(verse, $event)"
          (dblclick)="onVerseDoubleClick(verse)">
          
          <div class="verse-header">
            <span class="verse-reference">{{ verse.reference }}</span>
            <div class="verse-badges">
              <span class="confidence-badge" *ngIf="verse.crossRefConfidence">
                {{ (verse.crossRefConfidence * 100).toFixed(0) }}%
              </span>
              <span class="direction-badge" [class.from]="verse.direction === 'from'" [class.to]="verse.direction === 'to'">
                {{ verse.direction === 'from' ? '←' : '→' }}
              </span>
              <span class="range-badge" *ngIf="verse.isRange">
                {{ verse.verseCount }} verses
              </span>
            </div>
          </div>
          
          <div class="verse-text" [dir]="isRTL ? 'rtl' : 'ltr'">
            {{ verse.text }}
          </div>
          
          <div class="verse-footer" *ngIf="verse.isMemorized">
            <span class="memorized-badge">✓ Memorized</span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="!isLoading && verses.length === 0 && selectedVerse" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p>No cross-references found for this verse</p>
      </div>
      
      <!-- No verse selected -->
      <div *ngIf="!isLoading && !selectedVerse" class="empty-state">
        <div class="empty-icon">🔗</div>
        <p>Select a verse number above to view cross-references</p>
      </div>
      
      <!-- Loading state -->
      <app-workspace-loading
        *ngIf="isLoading"
        [message]="'Finding cross-references...'">
      </app-workspace-loading>
    </div>
  `,
  styles: [`
    .cross-references-container {
      width: 100%;
      height: 100%;
      padding: 1rem;
      overflow-y: auto;
    }

    .verses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      animation: fadeIn 0.3s ease-in;
    }

    .selected-verse-card {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 0.5rem;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-label {
      font-size: 0.875rem;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-reference {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .card-text {
      line-height: 1.8;
      font-size: 1rem;
    }

    .cross-ref-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cross-ref-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .cross-ref-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .cross-ref-card.memorized {
      border-left: 4px solid #10b981;
    }

    .verse-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .verse-reference {
      font-weight: 600;
      color: #1f2937;
    }

    .verse-badges {
      display: flex;
      gap: 0.5rem;
    }

    .confidence-badge {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .high-confidence .confidence-badge {
      background: #dcfce7;
      color: #15803d;
    }

    .medium-confidence .confidence-badge {
      background: #fef3c7;
      color: #a16207;
    }

    .low-confidence .confidence-badge {
      background: #fee2e2;
      color: #dc2626;
    }

    .direction-badge {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .direction-badge.from {
      background: #ddd6fe;
      color: #7c3aed;
    }

    .direction-badge.to {
      background: #fed7aa;
      color: #ea580c;
    }

    .range-badge {
      background: #e0e7ff;
      color: #4f46e5;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    .verse-text {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }

    .verse-footer {
      display: flex;
      justify-content: flex-end;
    }

    .memorized-badge {
      color: #10b981;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CrossReferencesModeComponent implements OnInit, OnChanges {
  @Input() active: boolean = false;
  @Input() verses: WorkspaceVerse[] = [];
  @Input() filteredVerses: WorkspaceVerse[] = [];
  @Input() selectedVerse: any = null;
  @Input() selectedVerses: Set<string> = new Set();
  @Input() isLoading: boolean = false;
  @Input() isRTL: boolean = false;
  @Input() fontSize: number = 16;
  @Input() userId: number = 0;
  @Input() preferredBible?: string;

  @Output() verseSelected = new EventEmitter<{verse: WorkspaceVerse, multiSelect: boolean}>();
  @Output() contextMenuRequested = new EventEmitter<{event: MouseEvent, verse: WorkspaceVerse}>();
  @Output() startMemorizationSession = new EventEmitter<WorkspaceVerse>();
  @Output() loadCrossReferences = new EventEmitter<{bookId: number, chapter: number, verse: number}>();

  constructor(
    private crossReferencesService: WorkspaceCrossReferencesService
  ) {}

  ngOnInit() {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges) {
    // React to input changes if needed
  }

  onVerseClick(verse: WorkspaceVerse, event: MouseEvent) {
    const multiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
    this.verseSelected.emit({verse, multiSelect});
  }

  onVerseRightClick(verse: WorkspaceVerse, event: MouseEvent) {
    event.preventDefault();
    this.contextMenuRequested.emit({event, verse});
  }

  onVerseDoubleClick(verse: WorkspaceVerse) {
    this.startMemorizationSession.emit(verse);
  }

  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }
}