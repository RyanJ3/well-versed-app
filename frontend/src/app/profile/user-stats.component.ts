import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartsModule } from '@progress/kendo-angular-charts';

import { BibleService } from '../services/bible.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user';
import { BibleData } from '../models/bible';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ChartsModule
  ],
  templateUrl: './user-stats.component.html',
  styles: [`
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
  `]
})
export class UserStatsComponent implements OnInit {
  user: User | null = null;
  bibleData: BibleData;
  isLoading = true;

  // Chart data properties
  testamentProgressData: any[] = [];
  bookGroupProgressData: any[] = [];
  topMemorizedBooksData: any[] = [];
  memorializationTrendData: any[] = [];

  // Pie chart label configuration
  pieLabelOptions = {
    visible: true,
    content: this.formatPieLabel
  };

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {
    this.bibleData = this.bibleService.getBibleData();
  }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.prepareChartData();
      }
      this.isLoading = false;
    });
  }

  formatPieLabel(e: any): string {
    return `${e.category}: ${e.value}%`;
  }

  getMonths(): string[] {
    return this.memorializationTrendData.map(d => d.month);
  }

  prepareChartData(): void {
    // Testament Progress Data
    this.testamentProgressData = this.bibleData.testaments.map(testament => ({
      testament: testament.name,
      progress: testament.percentComplete
    }));

    // Book Group Progress Data
    this.bookGroupProgressData = this.bibleData.testaments
      .flatMap(testament => testament.groups)
      .map(group => ({
        group: group.name,
        verses: group.memorizedVerses
      }))
      .sort((a, b) => b.verses - a.verses);

    // Top 5 Most Memorized Books
    this.topMemorizedBooksData = this.bibleData.books
      .map(book => ({
        book: book.name,
        verses: book.memorizedVerses
      }))
      .sort((a, b) => b.verses - a.verses)
      .slice(0, 5);

    // Memorization Trend (mock data for now)
    this.memorializationTrendData = [
      { month: 'Jan', verses: 50 },
      { month: 'Feb', verses: 120 },
      { month: 'Mar', verses: 200 },
      { month: 'Apr', verses: 350 },
      { month: 'May', verses: 500 }
    ];
  }
}