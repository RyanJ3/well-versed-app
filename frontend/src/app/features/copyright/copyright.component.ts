import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BibleService } from '../../core/services/bible.service';

interface BibleVersionInfo {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  copyright: string;
  copyrightUrl?: string;
  ipHolder: string;
  ipHolderUrl?: string;
  isPublicDomain: boolean;
  description?: string;
  notes?: string;
}

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './copyright.component.html',
  styleUrls: ['./copyright.component.scss']
})
export class CopyrightComponent implements OnInit {
  bibleVersions: BibleVersionInfo[] = [
    {
      id: 'de4e12af7f28f599-02',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'English',
      copyright: 'Public Domain',
      isPublicDomain: true,
      ipHolder: 'Public Domain',
      description: 'The King James Version (KJV) is a public domain English translation of the Bible.'
    },
    {
      id: '9879dbb7cfe39e4d-01',
      name: 'World English Bible',
      abbreviation: 'WEB',
      language: 'English', 
      copyright: 'Public Domain',
      isPublicDomain: true,
      ipHolder: 'Public Domain',
      description: 'The World English Bible is a public domain Modern English translation.'
    },
    {
      id: '06125adad2d5898a-01',
      name: 'American Standard Version',
      abbreviation: 'ASV',
      language: 'English',
      copyright: 'Public Domain',
      isPublicDomain: true,
      ipHolder: 'Public Domain',
      description: 'The American Standard Version (1901) is in the public domain.'
    }
    // Note: Add more versions as they become available in your app
  ];
  
  currentVersionId: string | null = null;
  currentVersion?: BibleVersionInfo;

  constructor(
    private route: ActivatedRoute,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    // Get current version from query params
    this.route.queryParams.subscribe(params => {
      this.currentVersionId = params['version'] || null;
      if (this.currentVersionId) {
        this.currentVersion = this.bibleVersions.find(v => v.id === this.currentVersionId);
      }
    });
    
    // Subscribe to current Bible version
    this.bibleService.currentBibleVersion$.subscribe(version => {
      if (version && !this.currentVersionId) {
        this.currentVersion = this.bibleVersions.find(v => v.id === version.id);
      }
    });
  }
  
  isCurrentVersion(version: BibleVersionInfo): boolean {
    return this.currentVersion?.id === version.id;
  }
  
  getCopyrightClass(version: BibleVersionInfo): string {
    if (version.isPublicDomain) return 'public-domain';
    return 'copyrighted';
  }
}
