// frontend/src/app/features/copyright/copyright.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  abbreviationLocal: string;
  language: string;
  languageId: string;
  description?: string;
  type: string;
}

interface LanguageGroup {
  language: string;
  languageId: string;
  bibles: BibleVersion[];
}

interface AvailableBiblesResponse {
  languages: any[];
  bibles: BibleVersion[];
  cacheExpiry: string;
}

@Component({
  selector: 'app-copyright',
  templateUrl: './copyright.component.html',
  styleUrls: ['./copyright.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CopyrightComponent implements OnInit {
  isLoading = true;
  languageGroups: LanguageGroup[] = [];
  expandedLanguages: Set<string> = new Set();
  searchTerm = '';
  filteredGroups: LanguageGroup[] = [];
  showScrollTop = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBibleVersions();
    this.setupScrollListener();
  }

  loadBibleVersions(): void {
    this.isLoading = true;
    
    this.http.get<AvailableBiblesResponse>(`${environment.apiUrl}/bibles/available`).subscribe({
      next: (response) => {
        console.log(`Loaded ${response.bibles.length} Bible versions`);
        this.organizeBiblesByLanguage(response.bibles);
        this.filteredGroups = [...this.languageGroups];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading Bible versions:', error);
        this.isLoading = false;
      }
    });
  }

  organizeBiblesByLanguage(bibles: BibleVersion[]): void {
    const languageMap = new Map<string, LanguageGroup>();
    
    bibles.forEach(bible => {
      const langId = bible.languageId;
      if (!languageMap.has(langId)) {
        languageMap.set(langId, {
          language: bible.language,
          languageId: langId,
          bibles: []
        });
      }
      languageMap.get(langId)!.bibles.push(bible);
    });
    
    // Sort by language name, with English first
    this.languageGroups = Array.from(languageMap.values()).sort((a, b) => {
      if (a.language === 'English') return -1;
      if (b.language === 'English') return 1;
      return a.language.localeCompare(b.language);
    });
    
    // Sort Bibles within each language
    this.languageGroups.forEach(group => {
      group.bibles.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Expand English by default
    this.expandedLanguages.add('English');
  }

  toggleLanguage(language: string): void {
    if (this.expandedLanguages.has(language)) {
      this.expandedLanguages.delete(language);
    } else {
      this.expandedLanguages.add(language);
    }
  }

  isExpanded(language: string): boolean {
    return this.expandedLanguages.has(language);
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredGroups = [...this.languageGroups];
      return;
    }
    
    this.filteredGroups = this.languageGroups
      .map(group => ({
        ...group,
        bibles: group.bibles.filter(bible => 
          bible.name.toLowerCase().includes(term) ||
          bible.abbreviation.toLowerCase().includes(term) ||
          bible.abbreviationLocal.toLowerCase().includes(term) ||
          (bible.description && bible.description.toLowerCase().includes(term))
        )
      }))
      .filter(group => group.bibles.length > 0);
    
    // Expand all groups with search results
    this.filteredGroups.forEach(group => {
      this.expandedLanguages.add(group.language);
    });
  }

  setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.showScrollTop = window.scrollY > 300;
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  expandAll(): void {
    this.filteredGroups.forEach(group => {
      this.expandedLanguages.add(group.language);
    });
  }

  collapseAll(): void {
    this.expandedLanguages.clear();
  }

  getCopyrightNotice(bible: BibleVersion): string {
    // Extract copyright info from description or provide default
    if (bible.description) {
      // Look for copyright information in the description
      const copyrightMatch = bible.description.match(/Copyright.*?(?=\.|$)/i);
      if (copyrightMatch) {
        return copyrightMatch[0];
      }
    }
    
    // Default copyright notices for known versions
    const copyrightMap: { [key: string]: string } = {
      'KJV': 'Public Domain',
      'ASV': 'Public Domain',
      'WEB': 'Public Domain',
      'BBE': 'Public Domain',
      'DRA': 'Public Domain',
      'YLT': 'Public Domain'
    };
    
    return copyrightMap[bible.abbreviation] || 'Copyright information available from publisher';
  }

  isPublicDomain(bible: BibleVersion) {
    const publicDomainVersions = ['KJV', 'ASV', 'WEB', 'BBE', 'DRA', 'YLT'];
    return publicDomainVersions.includes(bible.abbreviation) ||
           (bible.description && bible.description.toLowerCase().includes('public domain'));
  }

  getTotalBibleCount(): number {
    return this.filteredGroups.reduce((sum, group) => sum + group.bibles.length, 0);
  }
}