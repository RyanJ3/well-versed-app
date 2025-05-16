import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  isEditing = false;
  editForm: any = {};
  
  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Subscribe to user changes
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
      this.isLoading = false;
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.fetchCurrentUser();
  }
  
  startEditing(): void {
    this.isEditing = true;
    this.editForm = {
      first_name: this.user?.name?.split(' ')[0] || '',
      last_name: this.user?.name?.split(' ')[1] || '',
      denomination: this.user?.denomination,
      preferred_bible: this.user?.preferredBible,
      include_apocrypha: this.user?.includeApocrypha
    };
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