// Workaround for Kendo localize requirement
(globalThis as any).$localize = (strings: TemplateStringsArray, ...values: any[]) => {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += values[i] + strings[i + 1];
  }
  return result;
};

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartsModule } from '@progress/kendo-angular-charts';
import { IntlModule } from '@progress/kendo-angular-intl';
import { BibleService } from '../services/bible.service';
import { UserService } from '../services/user.service';
import { BibleData } from '../models/bible';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, ChartsModule, IntlModule],
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.scss']
})
export class UserStatsComponent implements OnInit {
  bibleData: BibleData;
  isLoading = true;

  // Chart data
  testamentProgressData: any[] = [];
  bookGroupProgressData: any[] = [];
  topMemorizedBooksData: any[] = [];
  memorializationTrendData: any[] = [];

  // Stats
  totalVerses = 0;
  totalChapters = 0;
  totalBooks = 0;
  percentComplete = 0;

  // Pie chart label configuration
  pieLabelOptions = {
    visible: true,
    format: '{0}%',
    position: 'outsideEnd' as const
  };

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {
    this.bibleData = this.bibleService.getBibleData();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.bibleService.getUserVerses(1, user.includeApocrypha).subscribe({
          next: () => {
            this.prepareChartData();
            this.isLoading = false;
          },
          error: () => {
            this.prepareChartData();
            this.isLoading = false;
          }
        });
      } else {
        this.isLoading = false;
      }
    });

    this.userService.fetchCurrentUser();
  }

  prepareChartData(): void {
    // Calculate overall stats
    this.totalVerses = this.bibleData.memorizedVerses;
    this.totalChapters = this.bibleData.books.reduce((sum, book) => 
      sum + book.chapters.filter(ch => ch.percentComplete === 100).length, 0
    );
    this.totalBooks = this.bibleData.books.filter(book => book.percentComplete === 100).length;
    this.percentComplete = this.bibleData.percentComplete;

    // Testament Progress Data (for pie chart)
    this.testamentProgressData = this.bibleData.testaments.map(testament => ({
      category: testament.name,
      value: testament.percentComplete || 0
    }));

    // Book Group Progress Data (for column chart)
    this.bookGroupProgressData = this.bibleData.testaments
      .flatMap(testament => testament.groups)
      .map(group => ({
        category: group.name,
        value: group.memorizedVerses || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Top 10 Most Memorized Books
    this.topMemorizedBooksData = this.bibleData.books
      .map(book => ({
        category: book.name,
        value: book.memorizedVerses || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Memorization Trend (mock data - replace with real data later)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.memorializationTrendData = months.map((month, index) => ({
      category: month,
      value: Math.floor(Math.random() * 100) + index * 50
    }));
  }

  getMonths(): string[] {
    return this.memorializationTrendData.map(d => d.category);
  }
}