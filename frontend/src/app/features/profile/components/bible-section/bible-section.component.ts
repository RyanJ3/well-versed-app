// frontend/src/app/features/profile/components/bible-section/bible-section.component.ts
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit
} from '@angular/core';
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
export class ProfileBibleSectionComponent implements OnInit, OnChanges {
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

  // ESV Token state management
  esvTokenDisplay = '';
  private originalEsvToken = '';
  private hasTokenBeenModified = false;
  hasExistingToken = false;
  showTokenInput = false;
  isEditingToken = false;

  @HostBinding('class.active') get isActive() {
    return this.active;
  }

  ngOnInit() {
    this.initializeTokenState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profileForm']) {
      this.initializeTokenState();
    }

    if (changes['isEsvSelected'] && !changes['isEsvSelected'].firstChange) {
      if (!this.isEsvSelected) {
        this.resetTokenState();
      } else {
        this.initializeTokenState();
      }
    }
  }

  private initializeTokenState(): void {
    if (!this.profileForm) return;

    const token = this.profileForm.esvApiToken;
    this.originalEsvToken = token || '';
    this.hasTokenBeenModified = false;
    this.isEditingToken = false;

    if (token && token.trim() !== '') {
      this.hasExistingToken = true;
      this.showTokenInput = false;

      if (token.length > 4) {
        this.esvTokenDisplay = '•'.repeat(token.length - 4) + token.slice(-4);
      } else {
        this.esvTokenDisplay = '•'.repeat(token.length);
      }
    } else {
      this.hasExistingToken = false;
      this.showTokenInput = true;
      this.esvTokenDisplay = '';
    }

    console.log('Token state initialized:', {
      hasToken: this.hasExistingToken,
      originalLength: this.originalEsvToken.length,
      displayLength: this.esvTokenDisplay.length
    });
  }

  private resetTokenState(): void {
    this.originalEsvToken = '';
    this.esvTokenDisplay = '';
    this.hasExistingToken = false;
    this.showTokenInput = false;
    this.hasTokenBeenModified = false;
    this.isEditingToken = false;
  }

  onEsvTokenFocus(): void {
    if (!this.isEditingToken) {
      this.isEditingToken = true;
      if (this.hasExistingToken && !this.hasTokenBeenModified) {
        this.esvTokenDisplay = '';
      }
    }
  }

  onEsvTokenChange(value: string): void {
    this.esvTokenDisplay = value;

    if (!this.hasTokenBeenModified) {
      this.hasTokenBeenModified = true;
      console.log('Token marked as modified');
    }

    this.profileForm.esvApiToken = value;
    this.fieldChange.emit();
  }

  onEsvTokenBlur(): void {
    if (this.isEditingToken && !this.hasTokenBeenModified && this.hasExistingToken) {
      this.profileForm.esvApiToken = this.originalEsvToken;

      if (this.originalEsvToken && this.originalEsvToken.length > 4) {
        this.esvTokenDisplay =
          '•'.repeat(this.originalEsvToken.length - 4) +
          this.originalEsvToken.slice(-4);
      } else if (this.originalEsvToken) {
        this.esvTokenDisplay = '•'.repeat(this.originalEsvToken.length);
      }

      console.log('Token restored to original on blur');
    } else if (this.hasTokenBeenModified && !this.esvTokenDisplay.trim()) {
      this.profileForm.esvApiToken = '';
      this.hasExistingToken = false;
      this.showTokenInput = true;
      console.log('Token intentionally cleared');
    }

    this.isEditingToken = false;
  }

  onChangeTokenClick(): void {
    console.log('Change token clicked');
    this.showTokenInput = true;
    this.esvTokenDisplay = '';
    this.hasTokenBeenModified = false;
    this.isEditingToken = true;

    setTimeout(() => {
      const input = document.getElementById('esvApiToken') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }

  onCancelTokenChange(): void {
    console.log('Cancel token change');
    this.showTokenInput = false;
    this.hasTokenBeenModified = false;
    this.isEditingToken = false;

    this.profileForm.esvApiToken = this.originalEsvToken;

    if (this.originalEsvToken && this.originalEsvToken.length > 4) {
      this.esvTokenDisplay =
        '•'.repeat(this.originalEsvToken.length - 4) + this.originalEsvToken.slice(-4);
      this.hasExistingToken = true;
    } else if (this.originalEsvToken) {
      this.esvTokenDisplay = '•'.repeat(this.originalEsvToken.length);
      this.hasExistingToken = true;
    }
  }

  hasTokenChanged(): boolean {
    return this.profileForm.esvApiToken !== this.originalEsvToken;
  }

  updateOriginalToken(newToken: string): void {
    this.originalEsvToken = newToken;
    this.hasTokenBeenModified = false;
    console.log('Original token updated after save');
  }
}

