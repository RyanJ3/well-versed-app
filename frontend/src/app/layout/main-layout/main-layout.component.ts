// frontend/src/app/layouts/main-layout/main-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { CitationFooterComponent } from './citation-footer/citation-footer.component';
import { UserService } from '@services/api/user.service';
import { BibleService } from '@services/api/bible.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigationComponent, CitationFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    // Ensure user is loaded and initialize Bible preferences
    this.userService.ensureUserLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.userService.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
            if (user && user.includeApocrypha !== undefined) {
              // Initialize Bible service with user's Apocrypha preference
              this.bibleService.updateUserPreferences(user.includeApocrypha === true);
            }
          });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
