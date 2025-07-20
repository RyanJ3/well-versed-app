import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { BibleService } from '../../core/services/bible.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  languages: any[];
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
  isSaving = false;
  loadingBibles = false;

  // Form data
  profileForm: any = {
    firstName: '',
    lastName: '',
    preferredBible: '',
    esvApiToken: ''
  };
  
  // Bible data
  availableBibles: BibleVersion[] = [];
  selectedBibleId: string = '';
  showEsvTokenField: boolean = false;
  
  private readonly BIBLE_CACHE_KEY = 'wellversed_bible_list';
  private readonly BIBLE_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  constructor(
    private userService: UserService,
    private bibleService: BibleService,
    private router: Router,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe({
      next: (user: any) => {
        this.user = user;
        
        if (user) {
          this.initializeForm(user);
          this.loadAvailableBibles();
        }
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading user profile:', error);
        this.isLoading = false;
      }
    });
    
    this.userService.fetchCurrentUser();
  }

  loadAvailableBibles(): void {
    // Check cache first
    const cached = this.getCachedBibles();
    if (cached) {
      this.availableBibles = cached;
      this.matchCurrentBible();
      return;
    }

    // Load from API
    this.loadingBibles = true;
    const url = `${environment.apiUrl}/bibles/available`;
    
    this.http.get<AvailableBiblesResponse>(url).subscribe({
      next: (response) => {
        if (response.bibles && Array.isArray(response.bibles)) {
          this.availableBibles = response.bibles;
          this.cacheBibles(response.bibles);
          this.matchCurrentBible();
        }
        this.loadingBibles = false;
      },
      error: (error) => {
        console.error('Error loading available Bibles:', error);
        this.availableBibles = [];
        this.loadingBibles = false;
      }
    });
  }

  getCachedBibles(): BibleVersion[] | null {
    try {
      const cached = localStorage.getItem(this.BIBLE_CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - timestamp > this.BIBLE_CACHE_DURATION) {
        localStorage.removeItem(this.BIBLE_CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading Bible cache:', error);
      return null;
    }
  }

  cacheBibles(bibles: BibleVersion[]): void {
    try {
      const cacheData = {
        data: bibles,
        timestamp: Date.now()
      };
      localStorage.setItem(this.BIBLE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching Bibles:', error);
    }
  }

  onBibleChange(): void {
    const selectedBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible
    );
    
    if (selectedBible) {
      this.selectedBibleId = selectedBible.id;
      
      // Show ESV token field if ESV is selected
      this.showEsvTokenField = selectedBible.abbreviation === 'ESV' || 
                              selectedBible.name.toLowerCase().includes('english standard');
      
      // Update the Bible service
      this.bibleService.setCurrentBibleVersion({
        id: selectedBible.id,
        name: selectedBible.name,
        abbreviation: selectedBible.abbreviation,
        isPublicDomain: !selectedBible.name.toLowerCase().includes('esv'),
        copyright: selectedBible.description
      });
    }
  }

  matchCurrentBible(): void {
    if (!this.profileForm.preferredBible) return;
    
    const matchingBible = this.availableBibles.find(
      b => b.abbreviation === this.profileForm.preferredBible ||
           b.abbreviationLocal === this.profileForm.preferredBible
    );
    
    if (matchingBible) {
      this.selectedBibleId = matchingBible.id;
      this.profileForm.preferredBible = matchingBible.abbreviation;
      
      // Check if ESV to show token field
      this.showEsvTokenField = matchingBible.abbreviation === 'ESV' || 
                              matchingBible.name.toLowerCase().includes('english standard');
    }
  }
  
  initializeForm(user: User): void {
    const nameParts = user.name.split(' ');

    this.profileForm = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      preferredBible: user.preferredBible || '',
      esvApiToken: user.esvApiToken || ''
    };
    
    // Check if ESV is selected
    if (user.preferredBible) {
      this.showEsvTokenField = user.preferredBible === 'ESV' || 
                              user.useEsvApi === true;
    }
  }
  
  saveProfile(): void {
    if (!this.profileForm || this.isSaving) return;
    
    this.isSaving = true;
    
    const profileUpdate = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      preferredBible: this.profileForm.preferredBible,
      useEsvApi: this.showEsvTokenField && this.profileForm.esvApiToken ? true : false,
      esvApiToken: this.showEsvTokenField ? this.profileForm.esvApiToken : ''
    };
    
    this.userService.updateUser(profileUpdate).subscribe({
      next: (updatedUser: any) => {
        this.notificationService.notify({
          type: 'success',
          text: 'Profile updated successfully!'
        });
        
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.isSaving = false;
        this.modalService.alert('Error', 'Failed to update profile. Please try again.', 'danger');
      }
    });
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
        this.notificationService.notify({
          type: 'success',
          text: 'All memorization data has been cleared.'
        });
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        console.error('Error clearing data:', error);
        this.modalService.alert('Error', 'Failed to clear data. Please try again.', 'danger');
      }
    });
  }
}