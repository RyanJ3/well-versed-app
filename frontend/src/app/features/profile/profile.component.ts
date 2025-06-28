// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalService } from '../../core/services/modal.service';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { BibleService } from '../../core/services/bible.service';

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

  // Form data (always available for editing)
  profileForm: any = {
    firstName: '',
    lastName: '',
    denomination: '',
    preferredBible: '',
    includeApocrypha: false
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
  
  bibleOptions = [
    { text: 'Select Bible Translation', value: '' },
    { text: 'King James Version (KJV)', value: 'KJV' },
    { text: 'New International Version (NIV)', value: 'NIV' },
    { text: 'English Standard Version (ESV)', value: 'ESV' },
    { text: 'New American Standard Bible (NASB)', value: 'NASB' },
    { text: 'New Living Translation (NLT)', value: 'NLT' },
    { text: 'Christian Standard Bible (CSB)', value: 'CSB' },
    { text: 'New King James Version (NKJV)', value: 'NKJV' },
    { text: 'Revised Standard Version (RSV)', value: 'RSV' },
    { text: 'The Message (MSG)', value: 'MSG' },
    { text: 'Amplified Bible (AMP)', value: 'AMP' }
  ];
  
  constructor(
    private userService: UserService,
    private bibleService: BibleService,
    private router: Router,
    private modalService: ModalService
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
          // Initialize the form fields with user data
          this.initializeForm(user);
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
  
  // Initialize form with user data
  initializeForm(user: User): void {
    const nameParts = user.name.split(' ');
    
    this.profileForm = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      denomination: user.denomination || '',
      preferredBible: user.preferredBible || '',
      includeApocrypha: user.includeApocrypha !== undefined ? user.includeApocrypha : false
    };
    
    console.log('Profile form initialized with:', this.profileForm);
  }
  
  saveProfile(): void {
    if (!this.profileForm || this.isSaving) return;
    
    console.log('Saving profile with data:', this.profileForm);
    this.isSaving = true;
    
    // Create a clean user profile update object
    const profileUpdate = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      denomination: this.profileForm.denomination,
      preferredBible: this.profileForm.preferredBible,
      includeApocrypha: this.profileForm.includeApocrypha
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
        // TODO: Show error message using modal service
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