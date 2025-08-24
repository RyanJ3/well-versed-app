import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BibleService } from '@services/api/bible.service';
import { User } from '@models/user';
import { UserService } from '@services/api/user.service';
import { Subject, takeUntil } from 'rxjs';

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  isPublicDomain: boolean;
  copyright?: string;
  copyrightUrl?: string;
}

const ESV_BIBLE_VERSION: BibleVersion = {
  id: '01b29f4b342acc35-01',
  name: 'English Standard Version',
  abbreviation: 'ESV',
  isPublicDomain: false,
  copyright: '© 2016 Crossway Bibles.',
  copyrightUrl: 'https://www.crossway.org'
};

@Component({
  selector: 'app-citation-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './citation-footer.component.html',
  styleUrls: ['./citation-footer.component.scss']
})
export class CitationFooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentBibleVersion: BibleVersion | null = null;
  hasTranslation = false;
  
  showTooltip = false;
  tooltipX = 0;
  tooltipY = 0;

  useEsvApi = false;

  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    // Watch for Bible version changes
    this.bibleService.currentBibleVersion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((version: BibleVersion | null) => {
        this.currentBibleVersion = version;
      });

    // Watch for user changes
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.useEsvApi = user?.useEsvApi ?? false;

        // Check if translation is fully configured
        const hasBasicTranslation = !!(user?.preferredBible);
        const isEsvConfigured =
          user?.preferredBible !== 'ESV' ||
          (!!user?.esvApiToken && user.esvApiToken.trim() !== '');

        this.hasTranslation = hasBasicTranslation && isEsvConfigured;

        // Sync Bible version if user has one but service doesn't
        if (user?.preferredBible && !this.currentBibleVersion && isEsvConfigured) {
          this.bibleService.setCurrentBibleVersion({
            id: user.preferredBible === 'ESV' ? 'esv' : user.preferredBible,
            name: user.preferredBible,
            abbreviation: user.preferredBible,
            isPublicDomain: user.preferredBible !== 'ESV'
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showCopyrightTooltip(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.tooltipX = rect.left + rect.width / 2;
    this.tooltipY = rect.top - 10;
    this.showTooltip = true;
  }

  hideCopyrightTooltip() {
    this.showTooltip = false;
  }

  goToProfileSetup(): void {
    this.router.navigate(['/profile'], { queryParams: { setup: 'bible' } });
  }

  isEsv(): boolean {
    return this.useEsvApi;
  }

  get displayBibleVersion(): BibleVersion {
    // If using ESV API
    if (this.isEsv()) {
      return ESV_BIBLE_VERSION;
    }

    // If we have a current Bible version, use it
    if (this.currentBibleVersion) {
      return this.currentBibleVersion;
    }

    // Return a placeholder object when no translation is selected
    return {
      id: '',
      name: 'No Translation Selected',
      abbreviation: '',
      isPublicDomain: true,
      copyright: ''
    };
  }

  get providerName(): string {
    return this.isEsv() ? 'Crossway' : 'API.Bible';
  }

  get providerUrl(): string {
    return this.isEsv()
      ? 'https://www.crossway.org'
      : 'https://scripture.api.bible';
  }

  getCitationText(): string {
    const version = this.displayBibleVersion;

    // Don't show citation text if no translation selected
    if (!version.abbreviation) {
      return '';
    }

    if (version.isPublicDomain) {
      return `Scripture quotations from ${version.abbreviation} (Public Domain)`;
    }
    return `Scripture quotations from ${version.abbreviation}`;
  }
}
