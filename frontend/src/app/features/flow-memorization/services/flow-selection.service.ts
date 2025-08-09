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
      const start = Math.min(this.lastClickedVerse, index);
      const end = Math.max(this.lastClickedVerse, index);
      for (let i = start; i <= end; i++) {
        this.selectedVerses.add(verses[i].verseCode);
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (this.selectedVerses.has(verse.verseCode)) {
        this.selectedVerses.delete(verse.verseCode);
      } else {
        this.selectedVerses.add(verse.verseCode);
      }
    } else {
      this.selectedVerses.clear();
      this.selectedVerses.add(verse.verseCode);
    }

    this.lastClickedVerse = index;
  }

  handleMouseDown(index: number) {
    this.isDragging = true;
    this.dragStart = index;
    this.dragEnd = index;
    this.selectedVerses.clear();
  }

  handleMouseMove(index: number, verses: FlowVerse[]) {
    if (!this.isDragging) return;
    this.dragEnd = index;
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
  }

  isVerseSelected(verse: FlowVerse): boolean {
    return this.selectedVerses.has(verse.verseCode);
  }
}
