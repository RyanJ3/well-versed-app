// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '../../core/services/utils/modal.service';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/api/user.service';
import { BibleService } from '../../core/services/api/bible.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';

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
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {

  user: User | null = null;
  isLoading = true;
  showSuccess = false;
  isSaving = false;
  loadingBibles = false;
  isInitialLoad = true;
  private userDataLoaded = false;
  private destroy$ = new Subject<void>();

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

  // Language and Bible data
  languages: LanguageOption[] = [];
  availableBibles: BibleVersion[] = [];
  allBiblesForLanguage: BibleVersion[] = [];
  selectedBibleId: string = '';

  // Store initial values
  private originalFormData: any = {};

  // ESV Bible option
  private readonly ESV_BIBLE: BibleVersion = {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    abbreviationLocal: 'ESV',
    language: 'English',
    languageId: 'eng',
    description: 'Requires API token from api.esv.org'
  };

  // Dropdown options
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
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  loadUserProfile(): void {
    this.isLoading = true;

    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          if (!user) {
            console.log('No user data yet, waiting...');
            return;
          }

          // Only process user data once
          if (this.userDataLoaded) return;

          console.log('Received user data:', user);
          this.userDataLoaded = true;
          this.user = user;

          // Initialize the form fields with user data
          this.initializeForm(user);

          // Load available Bibles after user is loaded
          this.loadInitialBibleData();

          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading user profile:', error);
          this.isLoading = false;
        }
      });

    // Ensure we fetch the current user
    this.userService.fetchCurrentUser();
  }

  initializeForm(user: any): void {
    console.log('Initializing form with user:', user);

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

    // Store original values for comparison
    this.originalFormData = { ...this.profileForm };

    console.log('Profile form initialized:', this.profileForm);
    console.log('User preferred Bible:', user.preferredBible);
    console.log('User uses ESV:', user.useEsvApi);
  }

  loadInitialBibleData(): void {
    this.loadingBibles = true;

    console.log('Loading initial Bible data...');

    this.http.get<AvailableBiblesResponse>(`${environment.apiUrl}/bibles/available`).subscribe({
      next: (response) => {
        console.log('Initial Bible data response:', response);

        // Set languages
        if (response.languages && Array.isArray(response.languages)) {
          this.languages = response.languages;
          console.log(`Loaded ${this.languages.length} languages`);
        }

        // Load Bibles for the user's preferred language
        if (this.profileForm.preferredLanguage) {
          this.loadBiblesForLanguage(this.profileForm.preferredLanguage, true);
        } else {
          this.loadingBibles = false;
          this.isInitialLoad = false;
        }
      },
      error: (error) => {
        console.error('Error loading initial Bible data:', error);
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
    console.log(`Loading Bibles for language: ${language}, current selection: ${currentBible}`);

    this.http.get<AvailableBiblesResponse>(url).subscribe({
      next: (response) => {
        if (response.bibles && Array.isArray(response.bibles)) {
          this.allBiblesForLanguage = response.bibles;
          console.log(`Loaded ${this.allBiblesForLanguage.length} Bibles for language ${language}`);

          this.updateAvailableBibles();

          // Restore selection after Bibles are loaded
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
      error: (error) => {
        console.error('Error loading Bibles for language:', error);
        this.allBiblesForLanguage = [];
        this.availableBibles = [];
        this.loadingBibles = false;
        this.isInitialLoad = false;
      }
    });
  }

  private restoreBibleSelection(bibleName: string): void {
    console.log('Attempting to restore Bible selection:', bibleName);

    // Check if it's ESV
    if (bibleName === 'ESV' && this.profileForm.preferredLanguage === 'eng') {
      this.profileForm.preferredBible = 'ESV';
      this.selectedBibleId = 'esv';
      console.log('Restored ESV selection');
      return;
    }

    // Find in available Bibles
    const matchingBible = this.availableBibles.find(
      b => b.abbreviation === bibleName || b.abbreviationLocal === bibleName
    );

    if (matchingBible) {
      this.profileForm.preferredBible = matchingBible.abbreviation;
      this.selectedBibleId = matchingBible.id;
      console.log('Restored Bible selection:', matchingBible.abbreviation);
    } else {
      console.log('Could not find Bible:', bibleName);
    }
  }

  updateAvailableBibles(): void {
    let bibles = [...this.allBiblesForLanguage];

    // Add ESV option if English is selected
    if (this.profileForm.preferredLanguage === 'eng') {
      const esvExists = bibles.some(b => b.abbreviation === 'ESV');
      if (!esvExists) {
        bibles.push(this.ESV_BIBLE);
      }
    }

    // Sort alphabetically by name
    bibles.sort((a, b) => a.name.localeCompare(b.name));

    this.availableBibles = bibles;
    console.log('Available Bibles updated:', this.availableBibles.length);
  }

  onLanguageChange(): void {
    console.log('Language changed to:', this.profileForm.preferredLanguage);

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
      console.log('Bible selected:', selectedBible.abbreviation, 'ID:', selectedBible.id);

      // Clear token if not ESV
      if (!this.isEsvSelected) {
        this.profileForm.esvApiToken = '';
      }
    }
  }

  saveProfile(): void {
    if (!this.profileForm || this.isSaving || !this.isFormValid) return;

    console.log('Saving profile with data:', this.profileForm);
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

    console.log('Profile update payload:', profileUpdate);

    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        console.log('Profile updated successfully:', updatedUser);

        // Update local user reference
        this.user = updatedUser;

        // Update original form data
        this.originalFormData = { ...this.profileForm };

        // Update Bible service preferences
        if (updatedUser && updatedUser.includeApocrypha !== undefined) {
          this.bibleService.updateUserPreferences(updatedUser.includeApocrypha);
        }

        // Update Bible version in service
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

        // Show success message
        this.showSuccess = true;
        setTimeout(() => {
          this.dismissSuccess();
        }, 5000);

        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
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
      error: (error: any) => {
        console.error('Error clearing data:', error);
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

      // Reload Bible data if language was changed
      if (this.profileForm.preferredLanguage) {
        this.loadBiblesForLanguage(this.profileForm.preferredLanguage, true);
      }
    }
  }

  getDisplayName(): string {
    if (!this.user) return '';

    if (this.user.firstName || this.user.lastName) {
      return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
    }

    return this.user.name || 'User';
  }

  getInitial(): string {
    if (this.user?.firstName) {
      return this.user.firstName.charAt(0).toUpperCase();
    } else if (this.user?.name) {
      return this.user.name.charAt(0).toUpperCase();
    }
    return 'U';
  }
}