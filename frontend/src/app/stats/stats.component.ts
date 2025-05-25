// src/app/stats/stats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { ChartsModule } from '@progress/kendo-angular-charts';
import { ProgressBarModule } from '@progress/kendo-angular-progressbar';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { UserService } from '../services/user.service';
import { BibleService } from '../services/bible.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonsModule, 
    ChartsModule, 
    ProgressBarModule,
    LayoutModule
  ],
  template: `
    <div class="stats-container">
      <h1 class="page-title">My Scripture Stats</h1>
      
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your statistics...</p>
      </div>

      <div *ngIf="!isLoading" class="stats-content">
        <!-- Overview Cards with Kendo Cards -->
        <div class="stats-overview">
          <kendo-card class="stat-card" *ngFor="let stat of overviewStats">
            <kendo-card-body>
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </kendo-card-body>
          </kendo-card>
        </div>

        <!-- Kendo Integration Test Section -->
        <kendo-card class="kendo-test-section">
          <kendo-card-header>
            <h2>Kendo Integration Test</h2>
          </kendo-card-header>
          <kendo-card-body>
            <kendo-buttongroup>
              <button kendoButton (click)="refreshStats()" [primary]="true" [icon]="'refresh'">
                Refresh Stats
              </button>
              <button kendoButton (click)="exportData()" [look]="'outline'" [icon]="'file-excel'">
                Export Data
              </button>
              <button kendoButton (click)="viewDetails()" [look]="'flat'" [icon]="'hyperlink-open'">
                View Details
              </button>
            </kendo-buttongroup>
          </kendo-card-body>
        </kendo-card>

        <!-- Progress by Testament with Kendo Progress Bars -->
        <kendo-card class="chart-section">
          <kendo-card-header>
            <h2>Progress by Testament</h2>
          </kendo-card-header>
          <kendo-card-body>
            <div class="testament-progress">
              <div *ngFor="let testament of testamentData" class="testament-item">
                <div class="testament-header">
                  <span class="testament-name">{{ testament.name }}</span>
                  <span class="testament-stats">{{ testament.memorized }} / {{ testament.total }} verses ({{ testament.percentage }}%)</span>
                </div>
                <kendo-progressbar 
                  [value]="testament.percentage" 
                  [max]="100"
                  [animation]="true"
                  class="testament-progress-bar">
                </kendo-progressbar>
              </div>
            </div>
          </kendo-card-body>
        </kendo-card>

        <!-- Book Groups Progress with Kendo Chart -->
        <kendo-card class="book-groups-section">
          <kendo-card-header>
            <h2>Progress by Book Group</h2>
          </kendo-card-header>
          <kendo-card-body>
            <kendo-chart [style.height.px]="400">
              <kendo-chart-series>
                <kendo-chart-series-item
                  [data]="bookGroupsChartData"
                  type="bar"
                  [field]="'percentage'"
                  [categoryField]="'name'"
                  [color]="'#3b82f6'">
                  <kendo-chart-series-item-labels
                    [visible]="true"
                    [format]="'{0}%'"
                    [position]="'insideEnd'">
                  </kendo-chart-series-item-labels>
                </kendo-chart-series-item>
              </kendo-chart-series>
              <kendo-chart-category-axis>
                <kendo-chart-category-axis-item>
                  <kendo-chart-category-axis-item-labels
                    [rotation]="-45">
                  </kendo-chart-category-axis-item-labels>
                </kendo-chart-category-axis-item>
              </kendo-chart-category-axis>
              <kendo-chart-value-axis>
                <kendo-chart-value-axis-item
                  [max]="100"
                  [title]="{ text: 'Percentage Complete' }">
                </kendo-chart-value-axis-item>
              </kendo-chart-value-axis>
              <kendo-chart-tooltip [visible]="true" [format]="'{0}% complete'"></kendo-chart-tooltip>
            </kendo-chart>
          </kendo-card-body>
        </kendo-card>

        <!-- Additional Stats with Kendo Donut Chart -->
        <kendo-card class="additional-stats">
          <kendo-card-header>
            <h2>Memorization Overview</h2>
          </kendo-card-header>
          <kendo-card-body>
            <kendo-chart [style.height.px]="300">
              <kendo-chart-series>
                <kendo-chart-series-item
                  type="donut"
                  [data]="donutData"
                  [field]="'value'"
                  [categoryField]="'category'"
                  [startAngle]="150">
                  <kendo-chart-series-item-labels
                    [visible]="true"
                    [position]="'outsideEnd'"
                    [format]="'{0:N0}'">
                  </kendo-chart-series-item-labels>
                </kendo-chart-series-item>
              </kendo-chart-series>
              <kendo-chart-legend [position]="'bottom'"></kendo-chart-legend>
            </kendo-chart>
          </kendo-card-body>
        </kendo-card>
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
    }

    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      color: #2563eb;
      line-height: 1;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .stat-label {
      color: #4b5563;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.875rem;
      text-align: center;
    }

    .kendo-test-section, .chart-section, .book-groups-section, .additional-stats {
      margin-bottom: 2rem;
    }

    .kendo-test-section h2, .chart-section h2, .book-groups-section h2, .additional-stats h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .testament-progress {
      padding: 1rem 0;
    }

    .testament-item {
      margin-bottom: 2rem;
    }

    .testament-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .testament-name {
      font-weight: 600;
      color: #1f2937;
    }

    .testament-stats {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .testament-progress-bar {
      height: 24px;
    }

    :host ::ng-deep .k-progressbar-value {
      background-color: #3b82f6;
    }

    :host ::ng-deep .k-button-group {
      display: flex;
      gap: 0.5rem;
    }

    :host ::ng-deep .k-card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    :host ::ng-deep .k-card-header {
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    :host ::ng-deep .k-chart {
      font-family: inherit;
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

      :host ::ng-deep .k-button-group {
        flex-direction: column;
      }

      :host ::ng-deep .k-button {
        width: 100%;
      }
    }
  `]
})
export class StatsComponent implements OnInit {
  isLoading = true;
  
  overviewStats = [
    { label: 'TOTAL VERSES', value: '31,177' },
    { label: 'MEMORIZED', value: '2,963' },
    { label: 'COMPLETE', value: '10%' },
    { label: 'BOOKS STARTED', value: '37' }
  ];

  testamentData = [
    { name: 'Old Testament', memorized: 919, total: 27930, percentage: 3 },
    { name: 'New Testament', memorized: 2044, total: 7958, percentage: 26 }
  ];
  
  bookGroupsChartData: any[] = [];
  donutData = [
    { category: 'Memorized', value: 2963 },
    { category: 'Remaining', value: 28214 }
  ];

  Math = Math;

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  refreshStats() {
    console.log('Refreshing stats...');
    this.loadStats();
  }

  exportData() {
    console.log('Exporting data...');
    // TODO: Implement export functionality
  }

  viewDetails() {
    console.log('Viewing details...');
    // TODO: Navigate to detailed view
  }

  loadStats() {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.overviewStats[1].value = user.versesMemorized?.toString() || '0';
        this.overviewStats[3].value = user.booksStarted?.toString() || '0';
      }
    });

    this.bibleService.getUserVerses(1, true).subscribe(verses => {
      this.calculateStats(verses);
      this.isLoading = false;
    });
  }

  calculateStats(userVerses: any[]) {
    const bibleData = this.bibleService.getBibleData();
    
    const totalVerses = bibleData.totalVerses;
    const memorizedVerses = userVerses.length;
    const completionPercentage = totalVerses > 0 ? Math.round((memorizedVerses / totalVerses) * 100) : 0;
    
    this.overviewStats[0].value = totalVerses.toLocaleString();
    this.overviewStats[1].value = memorizedVerses.toLocaleString();
    this.overviewStats[2].value = `${completionPercentage}%`;
    
    this.donutData = [
      { category: 'Memorized', value: memorizedVerses },
      { category: 'Remaining', value: totalVerses - memorizedVerses }
    ];

    const oldTestament = bibleData.getTestamentByName('OLD');
    const newTestament = bibleData.getTestamentByName('NEW');
    
    const oldTestamentVerses = userVerses.filter(v => v.verse.book_id <= 39);
    const newTestamentVerses = userVerses.filter(v => v.verse.book_id >= 40);
    
    this.testamentData = [
      {
        name: 'Old Testament',
        memorized: oldTestamentVerses.length,
        total: oldTestament.totalVerses,
        percentage: Math.round((oldTestamentVerses.length / oldTestament.totalVerses) * 100)
      },
      {
        name: 'New Testament',
        memorized: newTestamentVerses.length,
        total: newTestament.totalVerses,
        percentage: Math.round((newTestamentVerses.length / newTestament.totalVerses) * 100)
      }
    ];

    const allGroups = oldTestament.groups.concat(newTestament.groups);
    this.bookGroupsChartData = allGroups.map(group => {
      const groupVerses = userVerses.filter(v => {
        const book = bibleData.getBookById(v.verse.book_id);
        return book && book.group.name === group.name;
      });
      
      return {
        name: group.name,
        memorized: groupVerses.length,
        total: group.totalVerses,
        percentage: Math.round(group.totalVerses > 0 ? (groupVerses.length / group.totalVerses) * 100 : 0)
      };
    });
  }
}