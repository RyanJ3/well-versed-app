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
  
  // New chart data
  bookCompletionData: any[] = [];
  dailyAverage = 0;
  chapterSizeData: any[] = [];
  weeklyPatternData: any[] = [];
  categoryProgressData: any[] = [];
  currentStreak = 0;
  streakCalendarData: any[] = [];
  speedTrendData: any[] = [];

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

    // Book Completion Status (Donut)
    const completedBooks = this.bibleData.books.filter(b => b.percentComplete === 100).length;
    const inProgressBooks = this.bibleData.books.filter(b => b.percentComplete > 0 && b.percentComplete < 100).length;
    const notStartedBooks = this.bibleData.books.filter(b => b.percentComplete === 0).length;
    
    this.bookCompletionData = [
      { category: 'Completed', value: completedBooks },
      { category: 'In Progress', value: inProgressBooks },
      { category: 'Not Started', value: notStartedBooks }
    ];

    // Daily Average (mock data)
    this.dailyAverage = Math.round(this.totalVerses / 180); // Assuming 6 months

    // Chapter Size Distribution
    this.chapterSizeData = [
      { range: '1-20 verses', verses: 450 },
      { range: '21-40 verses', verses: 890 },
      { range: '41-60 verses', verses: 650 },
      { range: '61-80 verses', verses: 320 },
      { range: '80+ verses', verses: 504 }
    ];

    // Weekly Pattern (replacing heatmap)
    this.weeklyPatternData = [
      { day: 'Monday', average: 12 },
      { day: 'Tuesday', average: 18 },
      { day: 'Wednesday', average: 15 },
      { day: 'Thursday', average: 20 },
      { day: 'Friday', average: 8 },
      { day: 'Saturday', average: 25 },
      { day: 'Sunday', average: 30 }
    ];

    // Category Progress Radar
    this.categoryProgressData = [
      { category: 'Law', progress: 15 },
      { category: 'History', progress: 8 },
      { category: 'Wisdom', progress: 35 },
      { category: 'Prophets', progress: 5 },
      { category: 'Gospels', progress: 45 },
      { category: 'Epistles', progress: 65 }
    ];

    // Current Streak
    this.currentStreak = 23;

    // Streak Calendar (last 3 months)
    this.streakCalendarData = this.generateStreakCalendar();

    // Speed Trend
    this.speedTrendData = months.map((month, index) => ({
      month,
      versesPerDay: Math.floor(Math.random() * 15) + 5,
      movingAverage: Math.floor(Math.random() * 10) + 8
    }));
  }

  private generateStreakCalendar(): any[] {
    const months = ['November', 'December', 'January'];
    return months.map(month => ({
      name: month,
      days: Array.from({ length: 30 }, (_, i) => ({
        date: i + 1,
        active: Math.random() > 0.3,
        verses: Math.floor(Math.random() * 20),
        isToday: month === 'January' && i === 22
      }))
    }));
  }

  getMonths(): string[] {
    return this.memorializationTrendData.map(d => d.category);
  }
}