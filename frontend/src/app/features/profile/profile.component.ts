// frontend/src/app/features/profile/profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@models/user';
import { UserService } from '@services/api/user.service';
import { Subject, takeUntil } from 'rxjs';
import { ProfileHeroComponent } from './profile-hero/profile-hero.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ProfileHeroComponent, ProfileSettingsComponent]
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          if (!user) return;
          this.user = user;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });

    this.userService.fetchCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUserUpdated(updated: User): void {
    this.user = updated;
  }
}
