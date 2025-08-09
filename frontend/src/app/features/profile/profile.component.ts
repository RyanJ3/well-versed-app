// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ProfilePersonalSectionComponent } from './components/personal-section/personal-section.component';
import { ProfileBibleSectionComponent } from './components/bible-section/bible-section.component';
import { ProfileStudySectionComponent } from './components/study-section/study-section.component';
import { ProfileDisplaySectionComponent } from './components/display-section/display-section.component';
import { ClearDataModalComponent } from './components/clear-data-modal/clear-data-modal.component';
import { ModalService } from '@services/utils/modal.service';
import { User } from '@models/user';
import { UserService } from '@services/api/user.service';
import { BibleService } from '@services/api/bible.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

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

interface ProfileSection {
  id: 'personal' | 'bible' | 'study' | 'display';
  label: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ProfilePersonalSectionComponent,
    ProfileBibleSectionComponent,
    ProfileStudySectionComponent,
    ProfileDisplaySectionComponent,
    ClearDataModalComponent
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild(ProfileBibleSectionComponent) bibleSection?: ProfileBibleSectionComponent;

  // User and loading states
  user: User | null = null;
  isLoading = true;
  showSuccess = false;
  isSaving = false;
  loadingBibles = false;
  isInitialLoad = true;
  private userDataLoaded = false;
  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();

  // Add property to store last known token
  private lastKnownEsvToken: string | null = null;

  // Section management
  activeSection: ProfileSection['id'] = 'personal';
  mobileSidebarOpen = false;
  autoSaveEnabled = false;
  
  // Modal states
  showClearDataModal = false;
  isClearing = false;
  
  sections: ProfileSection[] = [
    { id: 'personal', label: 'Personal Info', icon: 'user' },
    { id: 'bible', label: 'Bible & Reading', icon: 'book' },
    { id: 'study', label: 'Study Preferences', icon: 'brain' },
    { id: 'display', label: 'Theme & Display', icon: 'palette' }
  ];

  // Form data
  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    preferredLanguage: 'eng',
    includeApocrypha: false,
    useEsvApi: false,
    esvApiToken: '',
    studyPreferences: {
      preferredMemorizationMethod: 'flow',
      dailyGoal: 1,
      reminderEnabled: false,
      reminderTime: '09:00',
      preferredFontSize: 'medium'
    },
    displaySettings: {
      theme: 'light',
      reduceMotion: false,
      highContrast: false
    }
  };

  // Track changes by section
  private sectionChanges = new Set<ProfileSection['id']>();

  isSetupMode = false;
  showSetupBanner = false;

  private isBrowser: boolean;

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
    private http: HttpClient,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Restore token from multiple sources as failsafe
    this.restoreEsvTokenIfNeeded();

    this.loadUserProfile();
    this.loadSavedSection();
    this.setupAutoSave();

    if (this.isBrowser) {
      const savedAutoSave = localStorage.getItem('profileAutoSave');
      this.autoSaveEnabled = savedAutoSave === 'true';

      // Also check for saved token
      this.lastKnownEsvToken = localStorage.getItem('esvApiToken');
    }

    // Check for setup mode
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['setup'] === 'bible') {
        this.isSetupMode = true;
        this.showSetupBanner = true;
        this.activeSection = 'bible';
        this.saveSectionToLocalStorage('bible');

        // // Auto-scroll to bible section after view initializes
        // setTimeout(() => {
        //   const bibleSection = document.querySelector('[data-section="bible"]');
        //   if (bibleSection) {
        //     bibleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        //   }
        // }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    // Save current token state before destroying component
    if (this.profileForm?.esvApiToken && this.isBrowser) {
      localStorage.setItem('esvApiToken', this.profileForm.esvApiToken);
    }

    this.destroy$.next();
    this.destroy$.complete();
    this.autoSave$.complete();
  }

  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const currentIndex = this.sections.findIndex(s => s.id === this.activeSection);
      let newIndex: number;
      
      if (event.key === 'ArrowUp') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.sections.length - 1;
      } else {
        newIndex = currentIndex < this.sections.length - 1 ? currentIndex + 1 : 0;
      }
      
      this.setActiveSection(this.sections[newIndex].id);
      event.preventDefault();
    }
    
    // Close modal on Escape
    if (event.key === 'Escape' && this.showClearDataModal) {
      this.closeClearDataModal();
    }
  }

  get isFormValid(): boolean {
    const hasFirstName = this.profileForm.firstName && this.profileForm.firstName.trim();
    const hasLanguage = this.profileForm.preferredLanguage;
    const hasBible = this.profileForm.preferredBible;

    // In setup mode, only require Bible selection
    if (this.isSetupMode) {
      return !!(hasLanguage && hasBible && (
        !this.isEsvSelected ||
        (this.profileForm.esvApiToken && this.profileForm.esvApiToken.trim())
      ));
    }

    // Normal validation
    const esvRequirementsMet = !this.isEsvSelected ||
      (this.profileForm.esvApiToken && this.profileForm.esvApiToken.trim());

    return !!(hasFirstName && hasLanguage && hasBible && esvRequirementsMet);
  }

  get isEsvSelected(): boolean {
    return this.profileForm.preferredBible === 'ESV';
  }
  
  private restoreEsvTokenIfNeeded(): void {
    if (!this.isBrowser) return;

    let restoredToken: string | null = null;

    // Source 1: Direct localStorage
    const savedToken = localStorage.getItem('esvApiToken');
    if (savedToken) {
      restoredToken = savedToken;
      console.log('Found ESV token in direct storage');
    }

    // Source 2: Cached user data
    if (!restoredToken) {
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          if (user.esvApiToken || user.esv_api_token) {
            restoredToken = user.esvApiToken || user.esv_api_token;
            console.log('Found ESV token in cached user data');
          }
        } catch (e) {
          console.error('Error parsing cached user:', e);
        }
      }
    }

    if (restoredToken) {
      this.lastKnownEsvToken = restoredToken;
    }
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

          console.log('Received user data with ESV token:', {
            hasToken: !!(user.esvApiToken || user.esv_api_token),
            tokenLength: (user.esvApiToken || user.esv_api_token || '').length
          });

          // Always re-initialize the form when user data is received
          this.user = user;
          this.initializeForm(user);

          // Only load Bible data on first load
          if (!this.userDataLoaded) {
            this.userDataLoaded = true;
            this.loadInitialBibleData();
          }

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

    // Try to get ESV token from multiple sources
    let esvToken = user.esvApiToken || user.esv_api_token || '';

    // Fallback to last known token if current is empty but we had one before
    if (
      !esvToken &&
      this.lastKnownEsvToken &&
      (user.preferredBible === 'ESV' || user.preferred_bible === 'ESV')
    ) {
      console.warn('ESV token missing but found in backup, restoring...');
      esvToken = this.lastKnownEsvToken;
    }

    this.profileForm = {
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      denomination: user.denomination || '',
      preferredBible: user.preferredBible || user.preferred_bible || '',
      preferredLanguage: user.preferredLanguage || user.preferred_language || 'eng',
      includeApocrypha:
        user.includeApocrypha === true || user.include_apocrypha === true,
      useEsvApi: user.useEsvApi === true || user.use_esv_api === true,
      esvApiToken: esvToken,
      studyPreferences: user.studyPreferences || user.study_preferences || {
        preferredMemorizationMethod: 'flow',
        dailyGoal: 1,
        reminderEnabled: false,
        reminderTime: '09:00',
        preferredFontSize: 'medium'
      },
      displaySettings: user.displaySettings || user.display_settings || {
        theme: 'light',
        reduceMotion: false,
        highContrast: false
      }
    };

    // Save token if we have it
    if (esvToken && this.isBrowser) {
      localStorage.setItem('esvApiToken', esvToken);
      this.lastKnownEsvToken = esvToken;
    }

    // Store original values for comparison
    this.originalFormData = JSON.parse(JSON.stringify(this.profileForm));

    console.log('Profile form initialized:', {
      hasEsvToken: !!esvToken,
      tokenLength: esvToken ? esvToken.length : 0,
      isEsv: this.profileForm.preferredBible === 'ESV',
      tokenSource: !user.esvApiToken && esvToken ? 'restored' : 'user'
    });
  }

  loadInitialBibleData(): void {
    this.loadingBibles = true;

    console.log('Loading initial Bible data...');

    this.http.get<AvailableBiblesResponse>(`${environment.apiUrl}/bibles/available`).subscribe({
      next: (response) => {
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
    this.onFieldChange('bible');

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
    
    this.onFieldChange('bible');
  }

  // Section management
  setActiveSection(sectionId: ProfileSection['id']): void {
    if (this.activeSection === sectionId) return;
    this.activeSection = sectionId;
    this.saveSectionToLocalStorage(sectionId);
    this.closeMobileSidebar();
  }

  sectionHasChanges(sectionId: ProfileSection['id']): boolean {
    return this.sectionChanges.has(sectionId);
  }

  onFieldChange(section: ProfileSection['id']): void {
    this.sectionChanges.add(section);
    
    if (this.autoSaveEnabled) {
      this.autoSave$.next();
    }
  }

  shouldShowSaveButtons(sectionId: string): boolean {
    return ['personal', 'bible', 'study'].includes(sectionId);
  }

  // Auto-save functionality
  setupAutoSave(): void {
    this.autoSave$
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.hasUnsavedChanges() && this.isFormValid) {
          this.saveProfile();
        }
      });
  }

  onAutoSaveToggle(): void {
    if (this.isBrowser) {
      localStorage.setItem('profileAutoSave', this.autoSaveEnabled.toString());
    }
    
    if (this.autoSaveEnabled && this.hasUnsavedChanges() && this.isFormValid) {
      this.autoSave$.next();
    }
  }

  // Local storage management
  loadSavedSection(): void {
    if (!this.isBrowser) return;

    const savedSection = localStorage.getItem('profileActiveSection') as ProfileSection['id'];
    if (savedSection && this.sections.some(s => s.id === savedSection)) {
      this.activeSection = savedSection;
    }
  }

  saveSectionToLocalStorage(sectionId: ProfileSection['id']): void {
    if (!this.isBrowser) return;

    localStorage.setItem('profileActiveSection', sectionId);
  }

  // Mobile sidebar
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  // Clear data modal
  openClearDataModal(): void {
    this.showClearDataModal = true;
  }

  closeClearDataModal(): void {
    if (this.isClearing) return;
    this.showClearDataModal = false;
  }

  confirmClearData(): void {
    if (this.isClearing) return;

    this.isClearing = true;

    this.userService.clearMemorizationData().subscribe({
      next: () => {
        this.showClearDataModal = false;
        this.isClearing = false;
        this.modalService.success('Data Cleared', 'All memorization data has been removed.');
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        console.error('Error clearing data:', error);
        this.isClearing = false;
        this.modalService.alert('Error', 'Failed to clear data. Please try again.', 'danger');
      }
    });
  }

  // Save functionality
  saveProfile(): void {
    if (!this.profileForm || this.isSaving || !this.isFormValid) return;

    this.isSaving = true;

    // Save token before request if it exists
    if (this.profileForm.esvApiToken && this.isBrowser) {
      localStorage.setItem('esvApiToken', this.profileForm.esvApiToken);
      this.lastKnownEsvToken = this.profileForm.esvApiToken;
    }

    const profileUpdate: any = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      denomination: this.profileForm.denomination,
      preferredBible: this.profileForm.preferredBible,
      preferredLanguage: this.profileForm.preferredLanguage,
      includeApocrypha: this.profileForm.includeApocrypha,
      useEsvApi: this.isEsvSelected,
      studyPreferences: this.profileForm.studyPreferences,
      displaySettings: this.profileForm.displaySettings
    };

    // Only include token if it changed OR if we're setting ESV for first time
    if (this.isEsvSelected) {
      const tokenChanged =
        this.profileForm.esvApiToken !== this.originalFormData.esvApiToken;
      const isNewEsvSelection =
        this.originalFormData.preferredBible !== 'ESV' &&
        this.profileForm.preferredBible === 'ESV';

      if (tokenChanged || isNewEsvSelection) {
        profileUpdate.esvApiToken = this.profileForm.esvApiToken;
        console.log('Including ESV token in update:', tokenChanged ? 'changed' : 'new selection');
      }
    } else {
      profileUpdate.esvApiToken = null;
      profileUpdate.useEsvApi = false;

      if (this.isBrowser) {
        localStorage.removeItem('esvApiToken');
        this.lastKnownEsvToken = null;
      }
    }

    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        console.log('Profile updated successfully');

        this.user = updatedUser;

        // Get the token from response
        const returnedToken =
          updatedUser.esvApiToken || updatedUser.esv_api_token || '';

        // Ensure token is preserved
        if (this.isEsvSelected && !returnedToken && this.lastKnownEsvToken) {
          console.warn('Token missing in response, using last known token');
          this.profileForm.esvApiToken = this.lastKnownEsvToken;
        } else {
          this.profileForm.esvApiToken = returnedToken;

          if (returnedToken && this.isBrowser) {
            localStorage.setItem('esvApiToken', returnedToken);
            this.lastKnownEsvToken = returnedToken;
          }
        }

        this.originalFormData = JSON.parse(JSON.stringify(this.profileForm));

        // Update the bible section's original token reference
        if (this.bibleSection) {
          this.bibleSection.updateOriginalToken(this.profileForm.esvApiToken);
        }

        this.sectionChanges.clear();

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
        // Check if we came from setup mode and redirect
        if (this.isSetupMode && this.profileForm.preferredBible) {
          let redirectUrl: string | null = null;

          // Only access sessionStorage if in browser
          if (this.isBrowser) {
            redirectUrl = sessionStorage.getItem('redirectAfterTranslation');
            if (redirectUrl) {
              sessionStorage.removeItem('redirectAfterTranslation');
            }
          }

          if (redirectUrl) {
            this.router.navigate([redirectUrl]);
          } else {
            // Remove setup query param
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              queryParamsHandling: 'merge'
            });
          }
          this.isSetupMode = false;
        }

        // Apply theme changes if any
        if (this.profileForm.displaySettings) {
          this.applyThemeSettings(this.profileForm.displaySettings);
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

  private applyThemeSettings(settings: any): void {
    // Apply theme to body
    document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
    document.body.classList.add(`${settings.theme}-theme`);
    
    // Apply reduce motion
    if (settings.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
    
    // Apply high contrast
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  dismissSuccess(): void {
    this.showSuccess = false;
  }

  dismissSetupBanner(): void {
    this.showSetupBanner = false;
  }

  hasUnsavedChanges(): boolean {
    if (!this.user || !this.originalFormData) return false;

    return JSON.stringify(this.profileForm) !== JSON.stringify(this.originalFormData);
  }

  cancelChanges(): void {
    if (this.originalFormData) {
      this.profileForm = JSON.parse(JSON.stringify(this.originalFormData));
      this.sectionChanges.clear();

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