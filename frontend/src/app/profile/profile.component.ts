// profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div *ngIf="isLoading" class="loading">Loading...</div>
    
    <div *ngIf="!isLoading && user" class="profile">
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
      
      <div *ngIf="!isEditing" class="info-section">
        <p><strong>Denomination:</strong> {{ user.denomination || 'Not specified' }}</p>
        <p><strong>Preferred Bible:</strong> {{ user.preferredBible || 'Not specified' }}</p>
        <p><strong>Include Apocrypha:</strong> {{ user.includeApocrypha ? 'Yes' : 'No' }}</p>
        
        <button (click)="startEditing()">Edit Profile</button>
      </div>
      
      <div *ngIf="isEditing" class="edit-form">
        <form (ngSubmit)="saveProfile()">
          <div>
            <label for="firstName">First Name:</label>
            <input id="firstName" [(ngModel)]="editForm.first_name" name="firstName">
          </div>
          
          <div>
            <label for="lastName">Last Name:</label>
            <input id="lastName" [(ngModel)]="editForm.last_name" name="lastName">
          </div>
          
          <div>
            <label for="denomination">Denomination:</label>
            <select id="denomination" [(ngModel)]="editForm.denomination" name="denomination">
              <option value="">Select Denomination</option>
              <option value="Non-denominational">Non-denominational</option>
              <option value="Catholic">Catholic</option>
              <option value="Protestant">Protestant</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label for="preferredBible">Preferred Bible:</label>
            <select id="preferredBible" [(ngModel)]="editForm.preferred_bible" name="preferredBible">
              <option value="">Select Translation</option>
              <option value="KJV">King James Version (KJV)</option>
              <option value="NIV">New International Version (NIV)</option>
              <option value="ESV">English Standard Version (ESV)</option>
            </select>
          </div>
          
          <div>
            <label>
              <input type="checkbox" [(ngModel)]="editForm.include_apocrypha" name="includeApocrypha">
              Include Apocrypha
            </label>
          </div>
          
          <div class="actions">
            <button type="submit">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .loading {
      text-align: center;
      padding: 40px;
    }
    
    form div {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    input, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
    }
    
    button[type="button"] {
      background: #e5e7eb;
      color: #4b5563;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  isEditing = false;
  editForm: any = {};
  
  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
      this.isLoading = false;
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
}