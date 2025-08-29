import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleBook } from '@models/bible';
import { DropdownStateService } from '../dropdown-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-dropdown.component.html',
  styleUrls: ['./book-dropdown.component.scss']
})
export class BookDropdownComponent implements OnInit, OnDestroy {
  @Input() currentBook: BibleBook | null = null;
  @Input() allBooks: BibleBook[] = [];
  @Input() hasApocrypha = false;
  @Output() bookSelect = new EventEmitter<number>();
  
  showDropdown = false;
  testamentFilter: 'ALL' | 'OT' | 'NT' | 'APO' = 'ALL';
  private subscription?: Subscription;
  private dropdownId = 'book-dropdown';

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

  setTestamentFilter(filter: 'ALL' | 'OT' | 'NT' | 'APO'): void {
    this.testamentFilter = filter;
  }

  onBookSelect(bookId: number): void {
    this.bookSelect.emit(bookId);
    this.showDropdown = false;
  }

  getBookProgress(book: BibleBook): number {
    if (!book || book.totalVerses === 0) return 0;
    return Math.round((book.memorizedVerses / book.totalVerses) * 100);
  }

  get booksByTestament() {
    if (!this.allBooks || this.allBooks.length === 0) {
      return { OT: [], NT: [], APO: [] };
    }
    
    let filteredBooks = this.allBooks;
    if (this.testamentFilter !== 'ALL') {
      filteredBooks = this.allBooks.filter(book => {
        const testament = this.getBookTestament(book);
        return testament === this.testamentFilter;
      });
    }
    
    const otBooks = filteredBooks.filter(b => this.getBookTestament(b) === 'OT');
    const ntBooks = filteredBooks.filter(b => this.getBookTestament(b) === 'NT');
    const apoBooks = this.hasApocrypha ? filteredBooks.filter(b => this.getBookTestament(b) === 'APO') : [];
    
    return {
      OT: otBooks,
      NT: ntBooks,
      APO: apoBooks
    };
  }

  private getBookTestament(book: BibleBook): 'OT' | 'NT' | 'APO' {
    if (book.id <= 39) {
      return 'OT';
    } else if (book.id <= 66) {
      return 'NT';
    } else {
      return 'APO';
    }
  }
}