// frontend/src/app/features/profile/components/bible-section/bible-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LanguageOption {
  id: string;
  name: string;
  nameLocal: string;
}

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  abbreviationLocal: string;
  language: string;
  languageId: string;
  description?: string;
}

@Component({
  selector: 'app-profile-bible-section',
  standalone: true,
  templateUrl: './bible-section.component.html',
  styleUrls: ['./bible-section.component.scss'],
  imports: [CommonModule, FormsModule],
  host: { class: 'section' }
})
export class ProfileBibleSectionComponent {
  @Input() profileForm: any;
  @Input() languages: LanguageOption[] = [];
  @Input() availableBibles: BibleVersion[] = [];
  @Input() loadingBibles = false;
  @Input() selectedBibleId = '';
  @Input() isEsvSelected = false;
  @Input() active = false;
  @Output() fieldChange = new EventEmitter<void>();
  @Output() languageChange = new EventEmitter<void>();
  @Output() bibleChange = new EventEmitter<void>();

  @HostBinding('class.active') get isActive() {
    return this.active;
  }
}
