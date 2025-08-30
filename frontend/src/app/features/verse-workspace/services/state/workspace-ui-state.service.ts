import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkspaceStateService } from './workspace-state.service';
import { ContextMenuData } from '../../models/context-menu-data.model';
import { WorkspaceFilterMode } from '../../models/workspace-filter-mode.enum';

export interface UIState {
  showFullText: boolean;
  fontSize: number;
  layoutMode: 'grid' | 'single';
  activeFilter: WorkspaceFilterMode;
  showSettings: boolean;
  isGearSpinning: boolean;
  showEncouragement: string;
  isLoading: boolean;
  mode: 'chapter' | 'crossReferences' | 'topical';
  contextMenu: ContextMenuData;
  showModal: boolean;
  modalChapterName: string;
  targetVerseAfterLoad: number | null;
}

@Injectable()
export class WorkspaceUIStateService {
  private uiState = new BehaviorSubject<UIState>({
    showFullText: false,
    fontSize: 16,
    layoutMode: 'grid',
    activeFilter: WorkspaceFilterMode.ALL,
    showSettings: false,
    isGearSpinning: false,
    showEncouragement: '',
    isLoading: false,
    mode: 'chapter',
    contextMenu: {
      visible: false,
      x: 0,
      y: 0,
      verseId: null,
      selectedCount: 0
    },
    showModal: false,
    modalChapterName: '',
    targetVerseAfterLoad: null
  });

  public readonly state$ = this.uiState.asObservable();

  constructor(private flowStateService: WorkspaceStateService) {
    this.loadSavedState();
  }

  get currentState(): UIState {
    return this.uiState.value;
  }

  // Font size management
  increaseFontSize(): void {
    const currentSize = this.uiState.value.fontSize;
    if (currentSize < 24) {
      this.updateState({ fontSize: currentSize + 2 });
      this.saveState();
    }
  }

  decreaseFontSize(): void {
    const currentSize = this.uiState.value.fontSize;
    if (currentSize > 12) {
      this.updateState({ fontSize: currentSize - 2 });
      this.saveState();
    }
  }

  setFontSize(size: number): void {
    if (size >= 12 && size <= 24) {
      this.updateState({ fontSize: size });
      this.saveState();
    }
  }

  // Layout mode
  setLayoutMode(mode: 'grid' | 'single'): void {
    this.updateState({ layoutMode: mode });
    this.saveState();
  }

  // Text display mode
  toggleTextMode(): void {
    this.updateState({ showFullText: !this.uiState.value.showFullText });
    this.saveState();
  }

  setTextMode(showFull: boolean): void {
    this.updateState({ showFullText: showFull });
    this.saveState();
  }

  // Filter management
  setActiveFilter(filter: WorkspaceFilterMode): void {
    this.updateState({ activeFilter: filter });
  }

  // Mode management
  setMode(mode: 'chapter' | 'crossReferences' | 'topical'): void {
    this.updateState({ 
      mode: mode,
      // Reset filter when changing modes
      activeFilter: WorkspaceFilterMode.ALL
    });
  }

  // Settings panel
  toggleSettings(): void {
    const newState = !this.uiState.value.showSettings;
    this.updateState({ 
      showSettings: newState,
      isGearSpinning: true
    });
    
    // Stop gear spinning animation after duration
    setTimeout(() => {
      this.updateState({ isGearSpinning: false });
    }, 600);
  }

  closeSettings(): void {
    this.updateState({ showSettings: false });
  }

  // Context menu
  showContextMenu(x: number, y: number, verseId: string | null, selectedCount: number): void {
    this.updateState({
      contextMenu: {
        visible: true,
        x: x,
        y: y,
        verseId: verseId,
        selectedCount: selectedCount
      }
    });
  }

  hideContextMenu(): void {
    this.updateState({
      contextMenu: {
        ...this.uiState.value.contextMenu,
        visible: false
      }
    });
  }

  updateContextMenuSelection(selectedCount: number): void {
    this.updateState({
      contextMenu: {
        ...this.uiState.value.contextMenu,
        selectedCount: selectedCount
      }
    });
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.updateState({ isLoading: loading });
  }

  // Encouragement messages
  showEncouragement(message: string, duration: number = 3000): void {
    this.updateState({ showEncouragement: message });
    
    if (duration > 0) {
      setTimeout(() => {
        this.updateState({ showEncouragement: '' });
      }, duration);
    }
  }

  clearEncouragement(): void {
    this.updateState({ showEncouragement: '' });
  }

  // Modal state
  setModalState(show: boolean, chapterName?: string): void {
    this.updateState({
      showModal: show,
      modalChapterName: chapterName || ''
    });
  }

  // Target verse for scrolling
  setTargetVerse(verseNumber: number | null): void {
    this.updateState({ targetVerseAfterLoad: verseNumber });
  }

  // Persist state
  private loadSavedState(): void {
    const savedState = this.flowStateService.getState();
    this.updateState({
      fontSize: savedState.fontSize || 16,
      layoutMode: savedState.layoutMode || 'grid',
      showFullText: savedState.isTextMode || false
    });
  }

  private saveState(): void {
    const currentState = this.uiState.value;
    this.flowStateService.updateState({
      fontSize: currentState.fontSize,
      layoutMode: currentState.layoutMode,
      isTextMode: currentState.showFullText
    });
  }

  // Reset UI state
  resetToDefaults(): void {
    this.updateState({
      showFullText: false,
      fontSize: 16,
      layoutMode: 'grid',
      activeFilter: WorkspaceFilterMode.ALL,
      showSettings: false,
      isGearSpinning: false,
      showEncouragement: '',
      mode: 'chapter'
    });
    this.saveState();
  }

  private updateState(partial: Partial<UIState>): void {
    this.uiState.next({
      ...this.uiState.value,
      ...partial
    });
  }
}