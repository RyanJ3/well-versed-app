import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceMode } from '@features/verse-workspace/models/workspace-mode.enum';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-selector.component.html',
  styleUrls: ['./mode-selector.component.scss']
})
export class ModeSelectorComponent {
  @Input() mode: WorkspaceMode = WorkspaceMode.CHAPTER;
  @Output() modeChange = new EventEmitter<WorkspaceMode>();
  
  showDropdown = false;
  
  // Expose enum to template
  WorkspaceMode = WorkspaceMode;

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

  selectMode(newMode: WorkspaceMode): void {
    this.modeChange.emit(newMode);
    this.showDropdown = false;
  }
}