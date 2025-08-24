// frontend/src/app/features/profile/components/bible-section/bible-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
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
export class ProfileBibleSectionComponent implements OnChanges {
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

  // Display helpers for ESV token
  esvTokenDisplay = '';
  isTokenMasked = false;

  @HostBinding('class.active') get isActive() {
    return this.active;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profileForm'] && this.profileForm?.esvApiToken) {
      const token = this.profileForm.esvApiToken;
      if (token && token.length > 4) {
        this.esvTokenDisplay = '•'.repeat(token.length - 4) + token.slice(-4);
        this.isTokenMasked = true;
      } else {
        this.esvTokenDisplay = token;
        this.isTokenMasked = false;
      }
    }
  }

  onEsvTokenFocus() {
    if (this.isTokenMasked) {
      this.esvTokenDisplay = '';
      this.isTokenMasked = false;
    }
  }

  onEsvTokenChange(value: string) {
    this.profileForm.esvApiToken = value;
    this.esvTokenDisplay = value;
    this.fieldChange.emit();
  }
}
