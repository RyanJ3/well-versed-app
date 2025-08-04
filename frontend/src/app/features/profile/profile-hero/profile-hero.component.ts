import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@models/user';

@Component({
  selector: 'app-profile-hero',
  templateUrl: './profile-hero.component.html',
  styleUrls: ['./profile-hero.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfileHeroComponent {
  @Input() user: User | null = null;

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
