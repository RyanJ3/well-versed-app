// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { BibleService } from '../../core/services/bible.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  showSuccess = false;
  isSaving = false;
  loadingBibles = false;

  // Form data (always available for editing)
  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    preferredLanguage: '', // Don't default to eng - let user data populate it
    includeApocrypha: false,
    useEsvApi: false,
    esvApiToken: ''
  };
  
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
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe({
      next: (user: any) => {
        this.user = user;
        
        if (user) {
          // Initialize the form fields with user data
          this.initializeForm(user);
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
          
          // If only one Bible available, auto-select it
          if (this.availableBibles.length === 1) {
            this.profileForm.preferredBible = this.availableBibles[0].abbreviation;
            this.selectedBibleId = this.availableBibles[0].id;
          } else {
            // Try to match current preferred Bible
            this.matchCurrentBible();
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
      
      // Update the Bible service with the selected version
      this.bibleService.setCurrentBibleVersion({
        id: selectedBible.id,
        name: selectedBible.name,
        abbreviation: selectedBible.abbreviation,
        isPublicDomain: true, // You might want to determine this from the API
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
      this.profileForm.preferredBible = matchingBible.abbreviation;
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
    
    // Don't load language-specific Bibles here - let ngOnInit handle the initial load
    // to ensure languages dropdown is populated
  }
  
  saveProfile(): void {
    if (!this.profileForm || this.isSaving) return;
    
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