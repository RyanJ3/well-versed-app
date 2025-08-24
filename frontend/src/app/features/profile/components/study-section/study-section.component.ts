// frontend/src/app/features/profile/components/study-section/study-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-study-section',
  standalone: true,
  templateUrl: './study-section.component.html',
  styleUrls: ['./study-section.component.scss'],
  imports: [CommonModule, FormsModule],
  host: { class: 'section' }
})
export class ProfileStudySectionComponent {
  @Input() profileForm: any;
  @Input() active = false;
  @Output() fieldChange = new EventEmitter<void>();

  @HostBinding('class.active') get isActive() {
    return this.active;
  }
}
