import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '@services/utils/modal.service';
import { User } from '@models/user';
import { UserService } from '@services/api/user.service';
import { BibleService } from '@services/api/bible.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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

interface AvailableBiblesResponse {
  languages: LanguageOption[];
  bibles: BibleVersion[];
  cacheExpiry: string;
}

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ProfileSettingsComponent implements OnChanges {
  @Input() user: User | null = null;
  @Output() userUpdated = new EventEmitter<User>();

  showSuccess = false;
  isSaving = false;
  loadingBibles = false;
  isInitialLoad = true;
  private userDataInitialized = false;

  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    preferredLanguage: 'eng',
    includeApocrypha: false,
    useEsvApi: false,
    esvApiToken: ''
  };

  languages: LanguageOption[] = [];
  availableBibles: BibleVersion[] = [];
  allBiblesForLanguage: BibleVersion[] = [];
  selectedBibleId = '';

  private originalFormData: any = {};

  private readonly ESV_BIBLE: BibleVersion = {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    abbreviationLocal: 'ESV',
    language: 'English',
    languageId: 'eng',
    description: 'Requires API token from api.esv.org'
  };

  denominationOptions = [
    { text: 'Select Denomination', value: '' },
    { text: 'Non-denominational', value: 'Non-denominational' },
    { text: 'Catholic', value: 'Catholic' },
    { text: 'Protestant', value: 'Protestant' },
    { text: 'Orthodox', value: 'Orthodox' },
    { text: 'Baptist', value: 'Baptist' },
    { text: 'Methodist', value: 'Methodist' },
    { text: 'Presbyterian', value: 'Presbyterian' },
    { text: 'Anglican/Episcopal', value: 'Anglican/Episcopal' },
    { text: 'Lutheran', value: 'Lutheran' },
    { text: 'Other', value: 'Other' }
  ];

  constructor(
    private userService: UserService,
    private bibleService: BibleService,
    private router: Router,
    private modalService: ModalService,
    private http: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user && !this.userDataInitialized) {
      this.userDataInitialized = true;
      this.initializeForm(this.user);
      this.loadInitialBibleData();
    }
  }

  get isFormValid(): boolean {
    const hasFirstName = this.profileForm.firstName && this.profileForm.firstName.trim();
    const hasLanguage = this.profileForm.preferredLanguage;
    const hasBible = this.profileForm.preferredBible;
    const esvRequirementsMet = !this.isEsvSelected ||
      (this.profileForm.esvApiToken && this.profileForm.esvApiToken.trim());
    return !!(hasFirstName && hasLanguage && hasBible && esvRequirementsMet);
  }

  get isEsvSelected(): boolean {
    return this.profileForm.preferredBible === 'ESV';
  }

  initializeForm(user: any): void {
    this.profileForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      denomination: user.denomination || '',
      preferredBible: user.preferredBible || '',
      preferredLanguage: user.preferredLanguage || 'eng',
      includeApocrypha: user.includeApocrypha === true,
      useEsvApi: user.useEsvApi === true,
      esvApiToken: user.esvApiToken || ''
    };
    this.originalFormData = { ...this.profileForm };
  }

  loadInitialBibleData(): void {
    this.loadingBibles = true;
    this.http.get<AvailableBiblesResponse>(`${environment.apiUrl}/bibles/available`).subscribe({
      next: (response) => {
        if (response.languages && Array.isArray(response.languages)) {
          this.languages = response.languages;
        }
        if (this.profileForm.preferredLanguage) {
          this.loadBiblesForLanguage(this.profileForm.preferredLanguage, true);
        } else {
          this.loadingBibles = false;
          this.isInitialLoad = false;
        }
      },
      error: () => {
        this.languages = [];
        this.availableBibles = [];
        this.loadingBibles = false;
        this.isInitialLoad = false;
      }
    });
  }

  loadBiblesForLanguage(language: string, preserveSelection: boolean = false): void {
    if (!language) {
      this.availableBibles = [];
      this.allBiblesForLanguage = [];
      this.loadingBibles = false;
      return;
    }
    this.loadingBibles = true;
    const url = `${environment.apiUrl}/bibles/available?language=${language}`;
    const currentBible = this.profileForm.preferredBible;
    this.http.get<AvailableBiblesResponse>(url).subscribe({
      next: (response) => {
        if (response.bibles && Array.isArray(response.bibles)) {
          this.allBiblesForLanguage = response.bibles;
          this.updateAvailableBibles();
          setTimeout(() => {
            if (preserveSelection && currentBible) {
              this.restoreBibleSelection(currentBible);
            }
          }, 0);
        } else {
          this.allBiblesForLanguage = [];
          this.availableBibles = [];
        }
        this.loadingBibles = false;
        this.isInitialLoad = false;
      },
      error: () => {
        this.allBiblesForLanguage = [];
        this.availableBibles = [];
        this.loadingBibles = false;
        this.isInitialLoad = false;
      }
    });
  }

  private restoreBibleSelection(bibleName: string): void {
    if (bibleName === 'ESV' && this.profileForm.preferredLanguage === 'eng') {
      this.profileForm.preferredBible = 'ESV';
      this.selectedBibleId = 'esv';
      return;
    }
    const matchingBible = this.availableBibles.find(
      b => b.abbreviation === bibleName || b.abbreviationLocal === bibleName
    );
    if (matchingBible) {
      this.profileForm.preferredBible = matchingBible.abbreviation;
      this.selectedBibleId = matchingBible.id;
    }
  }

  updateAvailableBibles(): void {
    let bibles = [...this.allBiblesForLanguage];
    if (this.profileForm.preferredLanguage === 'eng') {
      const esvExists = bibles.some(b => b.abbreviation === 'ESV');
      if (!esvExists) {
        bibles.push(this.ESV_BIBLE);
      }
    }
    bibles.sort((a, b) => a.name.localeCompare(b.name));
    this.availableBibles = bibles;
  }

  onLanguageChange(): void {
    if (!this.isInitialLoad && !this.loadingBibles) {
      this.profileForm.preferredBible = '';
      this.selectedBibleId = '';
      this.loadBiblesForLanguage(this.profileForm.preferredLanguage, false);
    }
  }

  onBibleChange(): void {
    const selectedBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible
    );
    if (selectedBible) {
      this.selectedBibleId = selectedBible.id;
      if (!this.isEsvSelected) {
        this.profileForm.esvApiToken = '';
      }
    }
  }

  saveProfile(): void {
    if (!this.profileForm || this.isSaving || !this.isFormValid) return;
    this.isSaving = true;
    const profileUpdate = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      denomination: this.profileForm.denomination,
      preferredBible: this.profileForm.preferredBible,
      preferredLanguage: this.profileForm.preferredLanguage,
      includeApocrypha: this.profileForm.includeApocrypha,
      useEsvApi: this.isEsvSelected,
      esvApiToken: this.isEsvSelected ? this.profileForm.esvApiToken : null
    };
    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        this.originalFormData = { ...this.profileForm };
        if (updatedUser && updatedUser.includeApocrypha !== undefined) {
          this.bibleService.updateUserPreferences(updatedUser.includeApocrypha);
        }
        if (this.profileForm.preferredBible) {
          const selectedBible = this.availableBibles.find(
            b => b.abbreviation === this.profileForm.preferredBible
          );
          if (selectedBible || this.isEsvSelected) {
            this.bibleService.setCurrentBibleVersion({
              id: selectedBible?.id || 'esv',
              name: selectedBible?.name || 'English Standard Version',
              abbreviation: this.profileForm.preferredBible,
              isPublicDomain: !this.isEsvSelected,
              copyright: selectedBible?.description || '© 2016 Crossway Bibles.'
            });
          }
        }
        this.showSuccess = true;
        setTimeout(() => this.dismissSuccess(), 5000);
        this.isSaving = false;
        this.userUpdated.emit(updatedUser);
      },
      error: () => {
        this.isSaving = false;
        this.modalService.alert('Error', 'Failed to update profile. Please try again.', 'danger');
      }
    });
  }

  dismissSuccess(): void {
    this.showSuccess = false;
  }

  async clearAllData(): Promise<void> {
    const confirmed = await this.modalService.danger(
      'Clear All Data',
      'This will remove all of your memorization progress. Your account will remain. This action cannot be undone.',
      'Clear Data'
    );
    if (!confirmed) return;
    this.userService.clearMemorizationData().subscribe({
      next: () => {
        this.modalService.success('Data Cleared', 'All memorization data has been removed.');
        this.router.navigate(['/']);
      },
      error: () => {
        this.modalService.alert('Error', 'Failed to clear data. Please try again.', 'danger');
      }
    });
  }

  hasUnsavedChanges(): boolean {
    if (!this.user || !this.originalFormData) return false;
    return JSON.stringify(this.profileForm) !== JSON.stringify(this.originalFormData);
  }

  cancelChanges(): void {
    if (this.originalFormData) {
      this.profileForm = { ...this.originalFormData };
      if (this.profileForm.preferredLanguage) {
        this.loadBiblesForLanguage(this.profileForm.preferredLanguage, true);
      }
    }
  }
}
