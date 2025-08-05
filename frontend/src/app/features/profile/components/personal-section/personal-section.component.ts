// frontend/src/app/features/profile/components/personal-section/personal-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '@models/user';

@Component({
  selector: 'app-profile-personal-section',
  standalone: true,
  templateUrl: './personal-section.component.html',
  styleUrls: ['./personal-section.component.scss'],
  imports: [CommonModule, FormsModule],
  host: { class: 'section' }
})
export class ProfilePersonalSectionComponent {
  @Input() profileForm: any;
  @Input() denominationOptions: { text: string; value: string }[] = [];
  @Input() user: User | null = null;
  @Input() active = false;
  @Output() fieldChange = new EventEmitter<void>();

  @HostBinding('class.active') get isActive() {
    return this.active;
  }
}
