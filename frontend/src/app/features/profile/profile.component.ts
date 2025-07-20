// frontend/src/app/features/profile/profile.component.ts
/**
 * Profile Component - Fixed Issues:
 * 1. Form values persist after save (formInitialized flag prevents re-loading)
 * 2. Bible version only updates globally on save (pendingBibleInfo stores selection)
 * 3. Both language and Bible translation are required fields
 * 4. UI spacing fixed for toggle switches (CSS updated)
 * 5. Form stability maintained - only loads once on init
 */
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
  
  // Track if form has been initialized to prevent re-loading
  private formInitialized = false;
  private destroy$ = new Subject<void>();

  // Form data (always available for editing)
  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    preferredLanguage: '', 
    includeApocrypha: false,
    useEsvApi: false,
    esvApiToken: ''
  };
  
  // Store the original Bible info to only update on save
  private pendingBibleInfo: BibleVersion | null = null;
  
  // Language and Bible data
  languages: LanguageOption[] = [];
  availableBibles: BibleVersion[] = [];
  selectedBibleId: string = '';
  
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
    // Load user profile first, then load Bibles
    this.loadUserProfile();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadUserProfile(): void {
    if (this.formInitialized) {
      console.log('Form already initialized, skipping reload');
      return;
    }
    
    this.isLoading = true;
    
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          // Only initialize if not already done
          if (!this.formInitialized && user) {
            this.user = user;
            this.initializeForm(user);
            this.formInitialized = true;
            // After user is loaded and form initialized, load available Bibles
            this.loadAvailableBibles();
          }
          
          this.isLoading = false;
          console.log('Loaded user profile:', user);
        },
        error: (error: any) => {
          console.error('Error loading user profile:', error);
          this.isLoading = false;
        }
      });
    
    this.userService.fetchCurrentUser();
  }

  loadAvailableBibles(language?: string): void {
    this.loadingBibles = true;
    
    const url = language 
      ? `${environment.apiUrl}/bibles/available?language=${language}`
      : `${environment.apiUrl}/bibles/available`;
    
    console.log(`Loading Bibles from: ${url}`);
    
    this.http.get<AvailableBiblesResponse>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Only update languages when fetching all (not filtered by language)
        if (!language) {
          if (response.languages && Array.isArray(response.languages)) {
            this.languages = response.languages;
            console.log(`Loaded ${this.languages.length} languages:`, this.languages);
          } else {
            console.warn('No languages array in response:', response);
          }
          
          // After loading languages, load Bibles for user's preferred language if set
          if (this.profileForm.preferredLanguage && this.profileForm.preferredLanguage !== '') {
            console.log(`Loading Bibles for preferred language: ${this.profileForm.preferredLanguage}`);
            this.loadAvailableBibles(this.profileForm.preferredLanguage);
            return; // Exit early to avoid setting loadingBibles to false
          }
        }
        
        if (response.bibles && Array.isArray(response.bibles)) {
          this.availableBibles = response.bibles;
          console.log(`Loaded ${this.availableBibles.length} Bibles${language ? ` for language ${language}` : ''}`);
          
          // Try to match current preferred Bible
          this.matchCurrentBible();
          
          // If no Bible is matched and user has a preference, show error
          if (this.profileForm.preferredBible && !this.selectedBibleId) {
            this.modalService.alert(
              'Bible Translation Not Found',
              `Your preferred Bible translation "${this.profileForm.preferredBible}" is not available. Please select a different translation.`,
              'warning'
            );
          }
        } else {
          console.warn('No bibles array in response:', response);
          this.availableBibles = [];
        }
        
        this.loadingBibles = false;
      },
      error: (error) => {
        console.error('Error loading available Bibles:', error);
        this.availableBibles = [];
        if (!language) {
          this.languages = [];
        }
        this.loadingBibles = false;
      }
    });
  }

  onLanguageChange(): void {
    console.log('Language changed to:', this.profileForm.preferredLanguage);
    this.profileForm.preferredBible = ''; // Reset Bible selection
    this.selectedBibleId = '';
    this.pendingBibleInfo = null;
    this.loadAvailableBibles(this.profileForm.preferredLanguage);
  }

  onBibleChange(): void {
    // Find the selected Bible and store its ID
    const selectedBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible
    );
    
    if (selectedBible) {
      this.selectedBibleId = selectedBible.id;
      console.log('Bible selected:', selectedBible.abbreviation, 'ID:', selectedBible.id);
      
      // Store the pending Bible info but DON'T update the service yet
      this.pendingBibleInfo = selectedBible;
    } else {
      // Clear pending Bible info if nothing selected
      this.pendingBibleInfo = null;
      this.selectedBibleId = '';
    }
  }

  matchCurrentBible(): void {
    if (!this.profileForm.preferredBible) {
      console.warn('No preferred Bible set in user profile');
      return;
    }
    
    // Try to find the Bible by abbreviation
    const matchingBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible ||
           b.abbreviationLocal === this.profileForm.preferredBible
    );
    
    if (matchingBible) {
      this.selectedBibleId = matchingBible.id;
      // Store as pending Bible info
      this.pendingBibleInfo = matchingBible;
      console.log('Matched Bible:', matchingBible.abbreviation, 'ID:', matchingBible.id);
      
      // Initialize Bible service with current saved preference (not pending changes)
      if (this.user?.preferredBible) {
        this.bibleService.initializeBibleFromUserPreference(
          matchingBible.abbreviation,
          matchingBible.id
        );
      }
    } else {
      console.error(`Could not find Bible with abbreviation: ${this.profileForm.preferredBible}`);
      // Clear the invalid selection
      this.profileForm.preferredBible = '';
      this.selectedBibleId = '';
      this.pendingBibleInfo = null;
    }
  }
  
  // Initialize form with user data
  initializeForm(user: User): void {
    const nameParts = user.name.split(' ');

    this.profileForm = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      denomination: user.denomination || '',
      preferredBible: user.preferredBible || '',
      preferredLanguage: user.preferredLanguage || 'eng',
      includeApocrypha: user.includeApocrypha !== undefined ? user.includeApocrypha : false,
      useEsvApi: user.useEsvApi || false,
      esvApiToken: user.esvApiToken || ''
    };
    
    console.log('Profile form initialized with:', this.profileForm);
  }
  
  saveProfile(): void {
    if (!this.profileForm || this.isSaving) return;
    
    // Validate required fields
    if (!this.profileForm.preferredLanguage) {
      this.modalService.alert(
        'Language Required', 
        'Please select a Bible language before saving.', 
        'warning'
      );
      return;
    }
    
    if (!this.profileForm.preferredBible) {
      this.modalService.alert(
        'Bible Translation Required', 
        'Please select a preferred Bible translation before saving.', 
        'warning'
      );
      return;
    }
    
    console.log('Saving profile with data:', this.profileForm);
    console.log('Selected Bible ID:', this.selectedBibleId);
    this.isSaving = true;
    
    // Create a clean user profile update object
    const profileUpdate = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      denomination: this.profileForm.denomination,
      preferredBible: this.profileForm.preferredBible, // Store abbreviation
      preferredLanguage: this.profileForm.preferredLanguage,
      includeApocrypha: this.profileForm.includeApocrypha,
      useEsvApi: this.profileForm.useEsvApi,
      esvApiToken: this.profileForm.esvApiToken
    };
    
    console.log('Profile update payload:', profileUpdate);
    
    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        console.log('Profile updated successfully:', updatedUser);
        
        // Update the current user object
        this.user = updatedUser;
        
        // NOW update the Bible service with the saved selection
        if (this.pendingBibleInfo) {
          this.bibleService.setCurrentBibleVersion({
            id: this.pendingBibleInfo.id,
            name: this.pendingBibleInfo.name,
            abbreviation: this.pendingBibleInfo.abbreviation,
            isPublicDomain: true,
            copyright: this.pendingBibleInfo.description
          });
        }
        
        // Update Bible service with new apocrypha setting
        if (updatedUser && updatedUser.includeApocrypha !== undefined) {
          console.log(`Explicitly updating BibleService with includeApocrypha=${updatedUser.includeApocrypha}`);
          this.bibleService.updateUserPreferences(updatedUser.includeApocrypha);
        }
        
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