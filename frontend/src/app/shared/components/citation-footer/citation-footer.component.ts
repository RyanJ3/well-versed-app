import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BibleService } from '../../../core/services/bible.service';
import { Subject, takeUntil } from 'rxjs';

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  isPublicDomain: boolean;
  copyright?: string;
  copyrightUrl?: string;
}

@Component({
  selector: 'app-citation-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './citation-footer.component.html',
  styleUrls: ['./citation-footer.component.scss']
})
export class CitationFooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentBibleVersion: BibleVersion = {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version',
    abbreviation: 'KJV',
    isPublicDomain: true
  };
  
  showTooltip = false;
  tooltipX = 0;
  tooltipY = 0;

  constructor(private bibleService: BibleService) {}

  ngOnInit() {
    // Subscribe to current Bible version changes
    this.bibleService.currentBibleVersion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(version => {
        if (version) {
          this.currentBibleVersion = version;
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

  isEsv(): boolean {
    return this.currentBibleVersion.abbreviation?.toUpperCase() === 'ESV';
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
    if (this.currentBibleVersion.isPublicDomain) {
      return `Scripture quotations from ${this.currentBibleVersion.abbreviation} (Public Domain)`;
    }
    return `Scripture quotations from ${this.currentBibleVersion.abbreviation}`;
  }
}
