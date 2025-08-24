// frontend/src/app/features/profile/components/display-section/display-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-display-section',
  standalone: true,
  templateUrl: './display-section.component.html',
  styleUrls: ['./display-section.component.scss'],
  imports: [CommonModule, FormsModule],
  host: { class: 'section' }
})
export class ProfileDisplaySectionComponent {
  @Input() profileForm: any;
  @Input() active = false;
  @Output() fieldChange = new EventEmitter<void>();
  @Output() openClearData = new EventEmitter<void>();

  @HostBinding('class.active') get isActive() {
    return this.active;
  }
}
