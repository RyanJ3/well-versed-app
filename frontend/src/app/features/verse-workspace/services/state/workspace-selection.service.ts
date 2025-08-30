import { Injectable } from '@angular/core';
import { WorkspaceVerse } from '../../models/workspace.models';
import { VerseSection } from '../../models/verse-section.model';

@Injectable()
export class WorkspaceSelectionService {
  selectedVerses = new Set<string>();
  private lastClickedVerse: number | null = null;
  isDragging = false;
  private dragStart: number | null = null;
  private dragEnd: number | null = null;

  handleVerseClick(index: number, event: MouseEvent, verses: WorkspaceVerse[]) {
    const verse = verses[index];

    if (event.shiftKey && this.lastClickedVerse !== null) {
      // Shift+click: Select range from last clicked to current
      const start = Math.min(this.lastClickedVerse, index);
      const end = Math.max(this.lastClickedVerse, index);
      
      // If CTRL is also held, add to selection; otherwise replace
      if (!(event.ctrlKey || event.metaKey)) {
        this.selectedVerses.clear();
      }
      
      for (let i = start; i <= end; i++) {
        this.selectedVerses.add(verses[i].verseCode);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // CTRL/CMD+click: Toggle individual verse selection
      if (this.selectedVerses.has(verse.verseCode)) {
        this.selectedVerses.delete(verse.verseCode);
      } else {
        this.selectedVerses.add(verse.verseCode);
      }
    } else {
      // Regular click: Clear selection and select only this verse
      this.selectedVerses.clear();
      this.selectedVerses.add(verse.verseCode);
    }

    this.lastClickedVerse = index;
  }

  handleMouseDown(index: number) {
    this.isDragging = true;
    this.dragStart = index;
    this.dragEnd = index;
    // Don't clear selection on mouse down - wait for drag
  }

  handleMouseMove(index: number, verses: WorkspaceVerse[], filteredVerses?: WorkspaceVerse[]) {
    if (!this.isDragging) return;
    this.dragEnd = index;
    
    // Clear and rebuild selection based on drag range
    this.selectedVerses.clear();
    const start = Math.min(this.dragStart ?? index, index);
    const end = Math.max(this.dragStart ?? index, index);
    
    // If we have filtered verses, we need to only select verses that are actually visible
    if (filteredVerses && filteredVerses.length > 0) {
      // Get the actual verse codes that should be selected based on the drag range
      const startVerseCode = verses[start]?.verseCode;
      const endVerseCode = verses[end]?.verseCode;
      
      if (startVerseCode && endVerseCode) {
        // Find the positions of start and end verses in the filtered array
        const startFilteredIndex = filteredVerses.findIndex(v => v.verseCode === startVerseCode);
        const endFilteredIndex = filteredVerses.findIndex(v => v.verseCode === endVerseCode);
        
        if (startFilteredIndex !== -1 && endFilteredIndex !== -1) {
          // Select all filtered verses between the start and end positions
          const minFilteredIndex = Math.min(startFilteredIndex, endFilteredIndex);
          const maxFilteredIndex = Math.max(startFilteredIndex, endFilteredIndex);
          
          for (let i = minFilteredIndex; i <= maxFilteredIndex; i++) {
            if (filteredVerses[i]) {
              this.selectedVerses.add(filteredVerses[i].verseCode);
            }
          }
        }
      }
    } else {
      // Original logic for non-filtered verses
      for (let i = start; i <= end; i++) {
        if (verses[i]) {
          this.selectedVerses.add(verses[i].verseCode);
        }
      }
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.dragStart = null;
    this.dragEnd = null;
  }

  selectAll(verses: WorkspaceVerse[]) {
    verses.forEach(v => this.selectedVerses.add(v.verseCode));
  }

  selectSection(section: VerseSection, verses: WorkspaceVerse[]) {
    for (let i = section.start; i <= section.end && i < verses.length; i++) {
      this.selectedVerses.add(verses[i].verseCode);
    }
  }

  clearSelection() {
    this.selectedVerses.clear();
    this.lastClickedVerse = null;
  }

  isVerseSelected(verse: WorkspaceVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }
  
  addToSelection(verse: WorkspaceVerse) {
    this.selectedVerses.add(verse.verseCode);
  }
  
  removeFromSelection(verse: WorkspaceVerse) {
    this.selectedVerses.delete(verse.verseCode);
  }
}