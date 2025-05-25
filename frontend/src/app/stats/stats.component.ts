// src/app/stats/stats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { ChartsModule } from '@progress/kendo-angular-charts';
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
    LayoutModule
  ],
  templateUrl: './stats.component.html',
  styleUrls: [
    './stats.component.scss',
    './styles/cards.scss',
    './styles/charts.scss',
    './styles/heatmap.scss'
  ]
})
export class StatsComponent implements OnInit {
  isLoading = true;
  
  // Overview stats with icons and trends
  overviewStats = [
    { label: 'TOTAL VERSES', value: '31,177', icon: '📖', change: 0 },
    { label: 'MEMORIZED', value: '2,963', icon: '✓', change: 12 },
    { label: 'COMPLETE', value: '10%', icon: '📊', change: 3 },
    { label: 'BOOKS STARTED', value: '37', icon: '📚', change: -2 }
  ];
  
  // Daily activity data
  dailyActivityData = [
    { date: 'Mon', verses: 15 },
    { date: 'Tue', verses: 23 },
    { date: 'Wed', verses: 8 },
    { date: 'Thu', verses: 32 },
    { date: 'Fri', verses: 19 },
    { date: 'Sat', verses: 45 },
    { date: 'Sun', verses: 38 }
  ];

  // Books heatmap
  booksHeatmapData: any[] = [];

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  getHeatmapColor(percentage: number): string {
    if (percentage === 0) return '#f3f4f6';
    if (percentage < 25) return '#fbbf24';
    if (percentage < 50) return '#f59e0b';
    if (percentage < 75) return '#10b981';
    return '#059669';
  }

  loadStats() {
    this.isLoading = true;
    
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.overviewStats[1].value = user.versesMemorized?.toLocaleString() || '0';
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

    // Generate heatmap data
    this.booksHeatmapData = bibleData.books.map(book => ({
      name: book.name,
      abbr: book.name.substring(0, 3).toUpperCase(),
      percentage: book.percentComplete,
      verses: `${book.memorizedVerses}/${book.totalVerses}`
    }));
  }
}