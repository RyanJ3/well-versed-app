// frontend/src/app/features/profile/components/bible-section/bible-section.component.ts
import { Component, EventEmitter, HostBinding, Input, Output, OnInit } from '@angular/core';
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
export class ProfileBibleSectionComponent implements OnInit {
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

  displayedToken = '';
  tokenExists = false;

  ngOnInit(): void {
    if (this.profileForm?.esvApiToken) {
      this.displayedToken = '********' + this.profileForm.esvApiToken.slice(-4);
      this.tokenExists = true;
    }
  }

  onTokenChange(value: string) {
    if (this.tokenExists && value === this.displayedToken) {
      return;
    }
    this.tokenExists = false;
    this.displayedToken = value;
    if (value && value.length >= 10) {
      this.profileForm.esvApiToken = value;
      this.fieldChange.emit();
    }
  }
}
