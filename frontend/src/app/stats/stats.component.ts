// src/app/stats/stats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { UserService } from '../services/user.service';
import { BibleService } from '../services/bible.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, ButtonsModule],
  template: `
    <div class="stats-container">
      <h1 class="page-title">My Scripture Stats</h1>
      
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your statistics...</p>
      </div>

      <div *ngIf="!isLoading" class="stats-content">
        <!-- Overview Cards -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-number">{{ totalVerses }}</div>
            <div class="stat-label">Total Verses</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ memorizedVerses }}</div>
            <div class="stat-label">Memorized</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ Math.round(completionPercentage) }}%</div>
            <div class="stat-label">Complete</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ booksStarted }}</div>
            <div class="stat-label">Books Started</div>
          </div>
        </div>

        <!-- Test Kendo Button -->
        <div class="kendo-test">
          <h2 class="section-title">Kendo Integration Test</h2>
          <button kendoButton (click)="refreshStats()" [primary]="true">
            Refresh Stats
          </button>
        </div>

        <!-- Chart Section -->
        <div class="chart-section">
          <h2 class="section-title">Progress by Testament</h2>
          <div class="custom-chart">
            <div *ngFor="let item of chartData" class="chart-bar">
              <div class="chart-label">{{ item.testament }}</div>
              <div class="bar-container">
                <div class="bar memorized" [style.width.%]="getBarPercentage(item.memorized, item.memorized + item.remaining)">
                  <span class="bar-label">{{ item.memorized }} memorized</span>
                </div>
                <div class="bar remaining" [style.width.%]="getBarPercentage(item.remaining, item.memorized + item.remaining)">
                  <span class="bar-label">{{ item.remaining }} remaining</span>
                </div>
              </div>
              <div class="chart-stats">
                {{ item.memorized }} / {{ item.memorized + item.remaining }} verses
                ({{ Math.round((item.memorized / (item.memorized + item.remaining)) * 100) }}%)
              </div>
            </div>
          </div>
        </div>

        <!-- Book Groups Progress -->
        <div class="book-groups-section">
          <h2 class="section-title">Progress by Book Group</h2>
          <div class="book-groups-grid">
            <div *ngFor="let group of bookGroupsData" class="group-card">
              <h3 class="group-name">{{ group.name }}</h3>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="group.percentage"></div>
              </div>
              <div class="group-stats">
                <span>{{ group.memorized }} / {{ group.total }} verses</span>
                <span class="percentage">{{ Math.round(group.percentage) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 2rem;
      text-align: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background-color: white;
      padding: 2rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      text-align: center;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      color: #2563eb;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #4b5563;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.875rem;
    }

    .chart-section {
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 2rem;
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .chart-container {
      height: 400px;
    }

    .custom-chart {
      padding: 1rem 0;
    }

    .chart-bar {
      margin-bottom: 2rem;
    }

    .chart-label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .bar-container {
      display: flex;
      height: 40px;
      background-color: #f3f4f6;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .bar {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      transition: width 0.3s ease;
    }

    .bar.memorized {
      background-color: #3b82f6;
    }

    .bar.remaining {
      background-color: #9ca3af;
    }

    .bar-label {
      white-space: nowrap;
      overflow: hidden;
    }

    .chart-stats {
      font-size: 0.875rem;
      color: #4b5563;
      text-align: center;
    }

    .book-groups-section {
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 2rem;
    }

    .book-groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .group-card {
      background-color: #f9fafb;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .group-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .progress-bar {
      width: 100%;
      height: 0.75rem;
      background-color: #e5e7eb;
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      background-color: #3b82f6;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .group-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .percentage {
      font-weight: 600;
      color: #2563eb;
    }

    @media (max-width: 768px) {
      .stats-container {
        padding: 1rem;
      }

      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
      }

      .stat-number {
        font-size: 2rem;
      }

      .chart-container {
        height: 300px;
      }
    }
  `]
})
export class StatsComponent implements OnInit {
  isLoading = true;
  totalVerses = 0;
  memorizedVerses = 0;
  completionPercentage = 0;
  booksStarted = 0;
  
  chartData: any[] = [];
  bookGroupsData: any[] = [];
  
  categoryAxisItems = [{
    categories: ['Old Testament', 'New Testament']
  }];
  
  valueAxisItems = [{
    labels: {
      format: '{0}'
    }
  }];

  // Expose Math for template
  Math = Math;

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  getBarPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  refreshStats() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    
    // Get user data and Bible data
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.memorizedVerses = user.versesMemorized || 0;
        this.booksStarted = user.booksStarted || 0;
      }
    });

    // Load user verses to calculate detailed stats
    this.bibleService.getUserVerses(1, true).subscribe(verses => {
      this.calculateStats(verses);
      this.isLoading = false;
    });
  }

  calculateStats(userVerses: any[]) {
    const bibleData = this.bibleService.getBibleData();
    
    // Calculate totals
    this.totalVerses = bibleData.totalVerses;
    this.memorizedVerses = userVerses.length;
    this.completionPercentage = this.totalVerses > 0 ? (this.memorizedVerses / this.totalVerses) * 100 : 0;
    
    // Get testaments
    const oldTestament = bibleData.getTestamentByName('OLD');
    const newTestament = bibleData.getTestamentByName('NEW');
    
    // Calculate testament stats
    const oldTestamentVerses = userVerses.filter(v => v.verse.book_id <= 39);
    const newTestamentVerses = userVerses.filter(v => v.verse.book_id >= 40);
    
    this.chartData = [
      {
        testament: 'Old Testament',
        memorized: oldTestamentVerses.length,
        remaining: oldTestament.totalVerses - oldTestamentVerses.length
      },
      {
        testament: 'New Testament',
        memorized: newTestamentVerses.length,
        remaining: newTestament.totalVerses - newTestamentVerses.length
      }
    ];

    // Calculate book groups stats
    const allGroups = oldTestament.groups.concat(newTestament.groups);
    this.bookGroupsData = allGroups.map(group => {
      const groupVerses = userVerses.filter(v => {
        const book = bibleData.getBookById(v.verse.book_id);
        return book && book.group.name === group.name;
      });
      
      return {
        name: group.name,
        memorized: groupVerses.length,
        total: group.totalVerses,
        percentage: group.totalVerses > 0 ? (groupVerses.length / group.totalVerses) * 100 : 0
      };
    });
  }
}