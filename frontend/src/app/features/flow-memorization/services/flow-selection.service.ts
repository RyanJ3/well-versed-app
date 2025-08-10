import { Injectable } from '@angular/core';
import { FlowVerse } from '../models/flow.models';
import { VerseSection } from '../models/verse-section.model';

@Injectable()
export class FlowSelectionService {
  selectedVerses = new Set<string>();
  private lastClickedVerse: number | null = null;
  isDragging = false;
  private dragStart: number | null = null;
  private dragEnd: number | null = null;

  handleVerseClick(index: number, event: MouseEvent, verses: FlowVerse[]) {
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

  handleMouseMove(index: number, verses: FlowVerse[]) {
    if (!this.isDragging) return;
    this.dragEnd = index;
    
    // Clear and rebuild selection based on drag range
    this.selectedVerses.clear();
    const start = Math.min(this.dragStart ?? index, index);
    const end = Math.max(this.dragStart ?? index, index);
    for (let i = start; i <= end; i++) {
      if (verses[i]) {
        this.selectedVerses.add(verses[i].verseCode);
      }
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.dragStart = null;
    this.dragEnd = null;
  }

  selectAll(verses: FlowVerse[]) {
    verses.forEach(v => this.selectedVerses.add(v.verseCode));
  }

  selectSection(section: VerseSection, verses: FlowVerse[]) {
    for (let i = section.start; i <= section.end && i < verses.length; i++) {
      this.selectedVerses.add(verses[i].verseCode);
    }
  }

  clearSelection() {
    this.selectedVerses.clear();
    this.lastClickedVerse = null;
  }

  isVerseSelected(verse: FlowVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }
}