import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { BibleService } from '../services/bible.service';
import { User } from '../models/user';

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
  
  // Chart data
  memorizationData = [
    { category: 'Genesis', count: 15 },
    { category: 'Psalms', count: 28 },
    { category: 'Proverbs', count: 12 },
    { category: 'John', count: 8 },
    { category: 'Romans', count: 10 }
  ];

  // Tab selection state
  selectedTab = 'current';
  
  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        
        if (user) {
          // Initialize the form fields with user data
          this.initializeForm(user);
        }
        
        this.isLoading = false;
        console.log('Loaded user profile:', user);
      },
      error: (error) => {
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
      // FIXED: Handle boolean correctly - don't use || with booleans
      includeApocrypha: user.includeApocrypha !== undefined ? user.includeApocrypha : false
    };
    
    console.log('Profile form initialized with:', this.profileForm);
  }
  
  saveProfile(): void {
    if (!this.profileForm) return;
    
    console.log('Saving profile with data:', this.profileForm);
    this.isLoading = true;
    
    this.userService.updateUser(this.profileForm).subscribe({
      next: (updatedUser) => {
        console.log('Profile updated successfully:', updatedUser);
        
        // Update Bible service with new apocrypha setting
        if (updatedUser && updatedUser.includeApocrypha !== undefined) {
          this.bibleService.updateUserPreferences(updatedUser.includeApocrypha);
        }
        
        // Show success message
        this.showSuccess = true;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          this.dismissSuccess();
        }, 5000);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isLoading = false;
      }
    });
  }
  
  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }
  
  dismissSuccess(): void {
    this.showSuccess = false;
  }
}