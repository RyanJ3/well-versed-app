import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-selector.component.html',
  styleUrls: ['./mode-selector.component.scss']
})
export class ModeSelectorComponent {
  @Input() mode: 'chapter' | 'crossReferences' | 'topical' = 'chapter';
  @Output() modeChange = new EventEmitter<'chapter' | 'crossReferences' | 'topical'>();
  
  showDropdown = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  selectMode(newMode: 'chapter' | 'crossReferences' | 'topical'): void {
    this.modeChange.emit(newMode);
    this.showDropdown = false;
  }
}