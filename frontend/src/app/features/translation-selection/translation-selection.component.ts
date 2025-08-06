import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '@services/api/user.service';

interface BibleOption {
  abbreviation: string;
  name: string;
}

@Component({
  selector: 'app-translation-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="translation-modal">
      <div class="modal-content">
        <h2>Please select a Bible translation to continue</h2>
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label>Language</label>
            <select [(ngModel)]="language" name="language">
              <option value="eng">English</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bible Translation</label>
            <select [(ngModel)]="translation" name="translation" required>
              <option value="">Select Translation</option>
              <option *ngFor="let b of bibleOptions" [value]="b.abbreviation">{{ b.name }} ({{ b.abbreviation }})</option>
            </select>
          </div>
          <div class="form-group" *ngIf="translation === 'ESV'">
            <label>ESV API Token</label>
            <input [(ngModel)]="esvToken" name="esvToken" />
          </div>
          <button type="submit" [disabled]="!isValid()">Continue</button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `.translation-modal {position: fixed; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:2000;}`,
    `.modal-content {background:#fff; padding:20px; border-radius:8px; width:90%; max-width:400px;}`,
    `h2 {margin-top:0;}`,
    `.form-group {margin-bottom:12px;}`,
    `button[disabled] {opacity:0.5; cursor:not-allowed;}`
  ]
})
export class TranslationSelectionComponent {
  language = 'eng';
  translation = '';
  esvToken = '';
  bibleOptions: BibleOption[] = [
    { abbreviation: 'KJV', name: 'King James Version' },
    { abbreviation: 'ESV', name: 'English Standard Version' }
  ];

  constructor(private userService: UserService, private router: Router) {}

  isValid(): boolean {
    if (!this.translation) return false;
    if (this.translation === 'ESV') {
      return this.esvToken.trim().length > 0;
    }
    return true;
  }

  submit(): void {
    const payload: any = {
      preferredBible: this.translation,
      preferredLanguage: this.language,
      useEsvApi: this.translation === 'ESV',
      esvApiToken: this.translation === 'ESV' ? this.esvToken.trim() : null,
    };

    this.userService.updateUser(payload).subscribe(() => {
      const redirectUrl = sessionStorage.getItem('redirectAfterTranslation');
      if (redirectUrl) {
        this.router.navigateByUrl(redirectUrl);
      } else {
        this.router.navigate(['/']);
      }
      sessionStorage.removeItem('redirectAfterTranslation');
    });
  }
}
