// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { BibleService } from '../../core/services/bible.service';
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

  // Form data (always available for editing)
  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    preferredLanguage: '',
    includeApocrypha: false,
    esvApiToken: ''
  };
  
  // Language and Bible data
  languages: LanguageOption[] = [];
  availableBibles: BibleVersion[] = [];
  allBiblesForLanguage: BibleVersion[] = []; // Store original list before adding ESV
  selectedBibleId: string = '';
  
  // Store initial values to preserve during loading
  private initialPreferredBible: string = '';
  private initialPreferredLanguage: string = '';
  
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
  
  // Form validation
  get isFormValid(): boolean {
    // Required fields: firstName, preferredLanguage, preferredBible, and esvApiToken (if ESV selected)
    // lastName and denomination are optional
    return !!(
      this.profileForm.firstName && 
      this.profileForm.firstName.trim() &&
      this.profileForm.preferredLanguage &&
      this.profileForm.preferredBible &&
      (!this.isEsvSelected || (this.profileForm.esvApiToken && this.profileForm.esvApiToken.trim()))
    );
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
          // Only process user data once
          if (this.userDataLoaded || !user) return;
          
          this.userDataLoaded = true;
          this.user = user;
          
          // Initialize the form fields with user data
          this.initializeForm(user);
          
          // Store initial values
          this.initialPreferredBible = this.profileForm.preferredBible;
          this.initialPreferredLanguage = this.profileForm.preferredLanguage;
          
          console.log('User profile loaded with preferences:', {
            language: this.initialPreferredLanguage,
            bible: this.initialPreferredBible
          });
          
          // Load available Bibles after user is loaded
          this.loadInitialBibleData();
          
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading user profile:', error);
          this.isLoading = false;
        }
      });
    
    this.userService.fetchCurrentUser();
  }

  // Initialize form with user data
  initializeForm(user: any): void {
    this.profileForm = {
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      denomination: user.denomination || '',
      preferredBible: user.preferredBible || '',
      preferredLanguage: user.preferredLanguage || 'eng',
      includeApocrypha: user.includeApocrypha !== undefined ? user.includeApocrypha : false,
      esvApiToken: user.esvApiToken || ''
    };
    
    console.log('Profile form initialized with:', this.profileForm);
  }

  loadInitialBibleData(): void {
    // First load all languages
    this.loadingBibles = true;
    
    // Store current form values to preserve them
    const currentLanguage = this.profileForm.preferredLanguage;
    const currentBible = this.profileForm.preferredBible;
    
    console.log('Loading initial Bible data. Current values:', {
      language: currentLanguage,
      bible: currentBible
    });
    
    this.http.get<AvailableBiblesResponse>(`${environment.apiUrl}/bibles/available`).subscribe({
      next: (response) => {
        console.log('Initial Bible data response:', response);
        
        // Set languages
        if (response.languages && Array.isArray(response.languages)) {
          this.languages = response.languages;
          console.log(`Loaded ${this.languages.length} languages`);
          
          // Use setTimeout to ensure the value is set after options are rendered
          setTimeout(() => {
            if (currentLanguage && this.languages.some(l => l.id === currentLanguage)) {
              this.profileForm.preferredLanguage = currentLanguage;
              console.log('Restored language selection:', currentLanguage);
            }
          }, 0);
        }
        
        // If user has a preferred language, load Bibles for that language
        if (this.initialPreferredLanguage && this.initialPreferredLanguage !== '') {
          setTimeout(() => {
            this.loadBiblesForLanguage(this.initialPreferredLanguage, true);
          }, 100); // Small delay to ensure language dropdown is set
        } else {
          // No preferred language, just show all Bibles
          if (response.bibles && Array.isArray(response.bibles)) {
            this.allBiblesForLanguage = response.bibles;
            this.updateAvailableBibles();
            
            // Restore Bible selection after options are set
            setTimeout(() => {
              if (currentBible) {
                this.profileForm.preferredBible = currentBible;
                this.matchCurrentBible();
              }
            }, 0);
          }
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
    
    // Store current Bible selection
    const currentBible = preserveSelection ? (this.initialPreferredBible || this.profileForm.preferredBible) : '';
    
    console.log(`Loading Bibles for language: ${language}, preserving: ${currentBible}`);
    
    this.http.get<AvailableBiblesResponse>(url).subscribe({
      next: (response) => {
        if (response.bibles && Array.isArray(response.bibles)) {
          this.allBiblesForLanguage = response.bibles;
          console.log(`Loaded ${this.allBiblesForLanguage.length} Bibles for language ${language}`);
          
          this.updateAvailableBibles();
          
          // Use setTimeout to ensure values are set after options are rendered
          setTimeout(() => {
            if (preserveSelection && currentBible) {
              // Try to restore the user's Bible selection
              const matchingBible = this.availableBibles.find(
                b => b.abbreviation === currentBible || b.abbreviationLocal === currentBible
              );
              
              if (matchingBible) {
                this.profileForm.preferredBible = matchingBible.abbreviation;
                this.selectedBibleId = matchingBible.id;
                console.log('Restored Bible selection:', matchingBible.abbreviation);
              }
            } else if (this.availableBibles.length === 1 && !this.profileForm.preferredBible) {
              // Auto-select if only one Bible available
              this.profileForm.preferredBible = this.availableBibles[0].abbreviation;
              this.selectedBibleId = this.availableBibles[0].id;
            }
          }, 50);
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

  updateAvailableBibles(): void {
    // Start with all Bibles for the language
    let bibles = [...this.allBiblesForLanguage];
    
    // Add ESV option if English is selected
    if (this.profileForm.preferredLanguage === 'eng') {
      // Check if ESV already exists (shouldn't happen with API.Bible, but just in case)
      const esvExists = bibles.some(b => b.abbreviation === 'ESV');
      if (!esvExists) {
        bibles.push(this.ESV_BIBLE);
      }
    }
    
    // Sort alphabetically by name
    bibles.sort((a, b) => a.name.localeCompare(b.name));
    
    this.availableBibles = bibles;
  }

  onLanguageChange(): void {
    console.log('Language changed to:', this.profileForm.preferredLanguage);
    
    // Only reset Bible selection if this is a user-initiated change (not initial load)
    if (!this.isInitialLoad && !this.loadingBibles) {
      this.profileForm.preferredBible = '';
      this.selectedBibleId = '';
      this.loadBiblesForLanguage(this.profileForm.preferredLanguage, false);
    }
    // During initial load, language change is triggered by form initialization
    // so we don't want to clear the Bible selection
  }

  onBibleChange(): void {
    // Find the selected Bible and store its ID
    const selectedBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible
    );
    
    if (selectedBible) {
      this.selectedBibleId = selectedBible.id;
      console.log('Bible selected:', selectedBible.abbreviation, 'ID:', selectedBible.id);
      
      // If ESV is deselected, clear the token
      if (!this.isEsvSelected) {
        this.profileForm.esvApiToken = '';
      }
      
      // Update the Bible service with the selected version
      this.bibleService.setCurrentBibleVersion({
        id: selectedBible.id,
        name: selectedBible.name,
        abbreviation: selectedBible.abbreviation,
        isPublicDomain: true,
        copyright: selectedBible.description
      });
    }
  }

  matchCurrentBible(): void {
    if (!this.profileForm.preferredBible) return;
    
    // Try to find the Bible by abbreviation
    const matchingBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible ||
           b.abbreviationLocal === this.profileForm.preferredBible
    );
    
    if (matchingBible) {
      this.selectedBibleId = matchingBible.id;
      // Use setTimeout to ensure the value is set after change detection
      setTimeout(() => {
        this.profileForm.preferredBible = matchingBible.abbreviation;
        console.log('Matched existing Bible:', matchingBible.abbreviation);
      }, 0);
    } else {
      console.log('Could not match Bible:', this.profileForm.preferredBible);
      // Clear the selection if no match found
      setTimeout(() => {
        this.profileForm.preferredBible = '';
        this.selectedBibleId = '';
      }, 0);
    }
  }
  
  saveProfile(): void {
    if (!this.profileForm || this.isSaving || !this.isFormValid) return;
    
    console.log('Saving profile with data:', this.profileForm);
    console.log('Selected Bible ID:', this.selectedBibleId);
    this.isSaving = true;
    
    // Create a clean user profile update object
    const profileUpdate = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      denomination: this.profileForm.denomination,
      preferredBible: this.profileForm.preferredBible,
      preferredLanguage: this.profileForm.preferredLanguage,
      includeApocrypha: this.profileForm.includeApocrypha,
      esvApiToken: this.isEsvSelected ? this.profileForm.esvApiToken : null
    };
    
    console.log('Profile update payload:', profileUpdate);
    
    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        console.log('Profile updated successfully:', updatedUser);
        
        // Update Bible service with new apocrypha setting
        if (updatedUser && updatedUser.includeApocrypha !== undefined) {
          console.log(`Updating BibleService with includeApocrypha=${updatedUser.includeApocrypha}`);
          this.bibleService.updateUserPreferences(updatedUser.includeApocrypha);
        }
        
        // Update stored initial values
        this.initialPreferredBible = this.profileForm.preferredBible;
        this.initialPreferredLanguage = this.profileForm.preferredLanguage;
        
        // Show success message
        this.showSuccess = true;
        
        // Auto-dismiss after 5 seconds
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
}