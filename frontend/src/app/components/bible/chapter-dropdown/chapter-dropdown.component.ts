import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleChapter } from '@models/bible';
import { DropdownStateService } from '../dropdown-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chapter-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chapter-dropdown.component.html',
  styleUrls: ['./chapter-dropdown.component.scss']
})
export class ChapterDropdownComponent implements OnInit, OnDestroy {
  @Input() currentChapter = 1;
  @Input() availableChapters: BibleChapter[] = [];
  @Output() chapterSelect = new EventEmitter<number>();
  
  showDropdown = false;
  private subscription?: Subscription;
  private dropdownId = 'chapter-dropdown';

  constructor(
    private elementRef: ElementRef,
    private dropdownState: DropdownStateService
  ) {}

  ngOnInit(): void {
    this.subscription = this.dropdownState.activeDropdown$.subscribe(activeId => {
      if (activeId !== this.dropdownId) {
        this.showDropdown = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      if (this.showDropdown === false) {
        this.dropdownState.setActiveDropdown(null);
      }
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    this.dropdownState.setActiveDropdown(this.showDropdown ? this.dropdownId : null);
  }

  onChapterClick(chapterNumber: number): void {
    this.chapterSelect.emit(chapterNumber);
    this.showDropdown = false;
  }

  getChapterProgress(chapter: BibleChapter): number {
    if (!chapter || chapter.totalVerses === 0) return 0;
    return Math.round((chapter.memorizedVerses / chapter.totalVerses) * 100);
  }
}