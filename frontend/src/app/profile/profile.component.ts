// src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
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
  isEditing = false;
  
  // Form data
  editForm: any = {
    first_name: '',
    last_name: '',
    denomination: '',
    preferred_bible: '',
    include_apocrypha: false
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
  
  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.isLoading = false;
      }
    });
    
    this.userService.fetchCurrentUser();
  }
  
  startEditing(): void {
    if (!this.user) return;
    
    const nameParts = this.user.name.split(' ');
    
    this.editForm = {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      denomination: this.user.denomination || '',
      preferred_bible: this.user.preferredBible || '',
      include_apocrypha: this.user.includeApocrypha || false
    };
    
    this.isEditing = true;
  }
  
  saveProfile(): void {
    if (!this.editForm) return;
    
    this.isLoading = true;
    
    this.userService.updateUser(this.editForm).subscribe({
      next: () => {
        this.isEditing = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isLoading = false;
      }
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
  }
  
  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }
}