import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownStateService } from '../dropdown-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-verse-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verse-dropdown.component.html',
  styleUrls: ['./verse-dropdown.component.scss']
})
export class VerseDropdownComponent implements OnInit, OnDestroy {
  @Input() selectedVerseNumber = 1;
  @Input() availableVerseNumbers: number[] = [];
  @Input() memorizedVerses: number[] = [];
  @Output() verseSelect = new EventEmitter<number>();
  
  showDropdown = false;
  private subscription?: Subscription;
  private dropdownId = 'verse-dropdown';
  private closeTimeout?: any;

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

  onMouseEnter(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.showDropdown = true;
    this.dropdownState.setActiveDropdown(this.dropdownId);
  }

  onMouseLeave(): void {
    this.closeTimeout = setTimeout(() => {
      this.showDropdown = false;
      this.dropdownState.setActiveDropdown(null);
    }, 300);
  }

  onVerseClick(verseNumber: number): void {
    this.verseSelect.emit(verseNumber);
    this.showDropdown = false;
  }

  isVerseMemorized(verseNumber: number): boolean {
    return this.memorizedVerses.includes(verseNumber);
  }
}