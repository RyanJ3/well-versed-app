// src/app/stats/stats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { BibleService } from '../../services/bible.service';
import { BibleBook, BibleData, BibleTestament, UserVerseDetail } from '../../models/bible';
import { BibleGroup } from '../../models/bible/bible-group.modle';
import Chart from 'chart.js/auto';
import { User } from '../../models/user';

interface TimeSeriesPoint {
  date: string;
  verses: number;
  dailyVerses: number;
  achievements: Achievement[];
}

interface Achievement {
  type: 'milestone' | 'book' | 'streak';
  name: string;
}

interface AlmostCompleteBook {
  name: string;
  percent: number;
  remaining: number;
  totalVerses: number;
  chapters: number;
}

interface AlmostCompleteChapter {
  book: string;
  chapter: number;
  percent: number;
  remaining: number;
  total: number;
}

interface SectionProgress {
  name: string;
  books: number;
  percent: number;
  verses: number;
  memorized: number;
  color: string;
  gradientEnd: string;
}

interface HeatmapDay {
  date: string;
  verses: number;
  intensity: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  // Loading state
  isLoading = true;

  // View state
  selectedTimeRange = '3m';
  hoveredPoint: TimeSeriesPoint | null = null;
  hoveredBook: string | null = null;
  timeRangeOptions = ['1m', '3m', '6m', '1y'];
  gridLineIndices = [0, 1, 2, 3, 4];
  
  // Data
  user: User | null = null;
  bibleData: BibleData | null = null;
  userVerses: UserVerseDetail[] = [];
  
  // Computed stats
  stats = {
    totalVerses: 31177,
    memorized: 0,
    percentComplete: 0,
    booksStarted: 0,
    booksCompleted: 0,
    currentStreak: 0,
    bestStreak: 21,
    versesToday: 0,
    avgPerDay: 0,
    monthlyGrowth: 0,
    projectedCompletion: 'Calculating...'
  };

  // Chart data
  timeSeriesData: TimeSeriesPoint[] = [];
  almostCompleteBooks: AlmostCompleteBook[] = [];
  almostCompleteChapters: AlmostCompleteChapter[] = [];
  sectionProgress: SectionProgress[] = [];
  heatmapData: HeatmapDay[] = [];

  private testamentCharts: { [key: string]: Chart } = {};
  private groupColors: { [key: string]: string } = {
    'Law': '#10b981',
    'History': '#3b82f6',
    'Wisdom': '#8b5cf6',
    'Major Prophets': '#f59e0b',
    'Minor Prophets': '#ef4444',
    'Gospels': '#10b981',
    'Acts': '#3b82f6',
    'Pauline Epistles': '#8b5cf6',
    'General Epistles': '#f59e0b',
    'Revelation': '#ef4444'
  };

  // Daily verse
  dailyVerse = {
    text: "Your word I have hidden in my heart, that I might not sin against You.",
    reference: "Psalm 119:11"
  };

  constructor(
    private userService: UserService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    // Load user data
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.stats.booksStarted = user.booksStarted || 0;
      }
    });

    // Load Bible data and user verses
    this.bibleService.getUserVerses(1, true).subscribe(verses => {
      this.userVerses = verses;
      this.bibleData = this.bibleService.getBibleData();
      this.calculateAllStats();
      this.isLoading = false;
    });
  }

  calculateAllStats() {
    if (!this.bibleData) return;

    // Basic stats
    this.stats.totalVerses = this.bibleData.totalVerses;
    this.stats.memorized = this.bibleData.memorizedVerses;
    this.stats.percentComplete = this.bibleData.percentComplete;

    // Calculate books completed
    this.stats.booksCompleted = this.bibleData.books.filter(book => book.isCompleted).length;

    // Calculate current streak (simplified for demo)
    this.calculateStreak();

    // Calculate average per day
    this.calculateAveragePerDay();

    // Generate chart data
    this.generateTimeSeriesData();
    this.findAlmostCompleteBooks();
    this.findAlmostCompleteChapters();
    this.calculateSectionProgress();
    this.generateHeatmapData();
    this.initializeTestamentCharts();

    // Calculate projections
    this.calculateProjections();
  }

  calculateStreak() {
    // Group verses by date
    const versesByDate = new Map<string, number>();
    this.userVerses.forEach(verse => {
      if (verse.last_practiced) {
        const date = new Date(verse.last_practiced).toISOString().split('T')[0];
        versesByDate.set(date, (versesByDate.get(date) || 0) + 1);
      }
    });

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (versesByDate.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    this.stats.currentStreak = streak;
    
    // Today's verses
    const todayStr = today.toISOString().split('T')[0];
    this.stats.versesToday = versesByDate.get(todayStr) || 0;
  }

  calculateAveragePerDay() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVerses = this.userVerses.filter(verse => {
      if (!verse.last_practiced) return false;
      const practiceDate = new Date(verse.last_practiced);
      return practiceDate >= thirtyDaysAgo;
    });
    
    this.stats.avgPerDay = Math.round(recentVerses.length / 30 * 10) / 10;
  }

  generateTimeSeriesData() {
    const ranges: Record<string, number> = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    };
    
    const days = ranges[this.selectedTimeRange];
    const data: TimeSeriesPoint[] = [];
    const today = new Date();
    
    // Create a map of cumulative verses by date
    const cumulativeByDate = new Map<string, number>();
    const dailyCountByDate = new Map<string, number>();
    
    // Count verses per day
    this.userVerses.forEach(verse => {
      if (verse.last_practiced) {
        const date = new Date(verse.last_practiced).toISOString().split('T')[0];
        dailyCountByDate.set(date, (dailyCountByDate.get(date) || 0) + 1);
      }
    });
    
    // Build cumulative totals
    let runningTotal = 0;
    const sortedDates = Array.from(dailyCountByDate.keys()).sort();
    sortedDates.forEach(date => {
      runningTotal += dailyCountByDate.get(date) || 0;
      cumulativeByDate.set(date, runningTotal);
    });
    
    // Generate data points for the selected range
    let lastKnownTotal = 0;
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get cumulative total for this date
      let cumulative = 0;
      for (const [date, total] of cumulativeByDate) {
        if (date <= dateStr) {
          cumulative = total;
        } else {
          break;
        }
      }
      
      const dailyVerses = dailyCountByDate.get(dateStr) || 0;
      
      // Add achievements
      const achievements: Achievement[] = [];
      if (cumulative > 0 && cumulative % 100 === 0 && cumulative !== lastKnownTotal) {
        achievements.push({ type: 'milestone', name: `${cumulative} verses memorized!` });
      }
      
      data.push({
        date: dateStr,
        verses: cumulative,
        dailyVerses,
        achievements
      });
      
      lastKnownTotal = cumulative;
    }
    
    this.timeSeriesData = data;
  }

  findAlmostCompleteBooks() {
    if (!this.bibleData) return;
    
    this.almostCompleteBooks = this.bibleData.books
      .filter(book => book.percentComplete >= 70 && book.percentComplete < 100)
      .sort((a, b) => b.percentComplete - a.percentComplete)
      .slice(0, 5)
      .map(book => ({
        name: book.name,
        percent: book.percentComplete,
        remaining: book.totalVerses - book.memorizedVerses,
        totalVerses: book.totalVerses,
        chapters: book.totalChapters
      }));
  }

  findAlmostCompleteChapters() {
    if (!this.bibleData) return;
    
    const chapters: AlmostCompleteChapter[] = [];
    
    this.bibleData.books.forEach(book => {
      book.chapters.forEach(chapter => {
        const percent = chapter.percentComplete;
        if (percent >= 70 && percent < 100) {
          chapters.push({
            book: book.name,
            chapter: chapter.chapterNumber,
            percent,
            remaining: chapter.totalVerses - chapter.memorizedVerses,
            total: chapter.totalVerses
          });
        }
      });
    });
    
    this.almostCompleteChapters = chapters
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }

  calculateSectionProgress() {
    if (!this.bibleData) return;
    
    const sections = [
      { name: 'Torah', books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'], color: '#3b82f6', gradientEnd: '#2563eb' },
      { name: 'Historical', books: ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'], color: '#10b981', gradientEnd: '#059669' },
      { name: 'Wisdom', books: ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'], color: '#f59e0b', gradientEnd: '#d97706' },
      { name: 'Major Prophets', books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'], color: '#8b5cf6', gradientEnd: '#7c3aed' },
      { name: 'Minor Prophets', books: ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'], color: '#ef4444', gradientEnd: '#dc2626' },
      { name: 'Gospels', books: ['Matthew', 'Mark', 'Luke', 'John'], color: '#ec4899', gradientEnd: '#db2777' },
      { name: 'Epistles', books: ['Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'], color: '#06b6d4', gradientEnd: '#0891b2' },
      { name: 'Apocalyptic', books: ['Revelation'], color: '#a855f7', gradientEnd: '#9333ea' }
    ];
    
    this.sectionProgress = sections.map(section => {
      const sectionBooks = this.bibleData!.books.filter(book => 
        section.books.includes(book.name)
      );
      
      const totalVerses = sectionBooks.reduce((sum, book) => sum + book.totalVerses, 0);
      const memorizedVerses = sectionBooks.reduce((sum, book) => sum + book.memorizedVerses, 0);
      const percent = totalVerses > 0 ? Math.round((memorizedVerses / totalVerses) * 100) : 0;
      
      return {
        name: section.name,
        books: sectionBooks.length,
        percent,
        verses: totalVerses,
        memorized: memorizedVerses,
        color: section.color,
        gradientEnd: section.gradientEnd
      };
    });
  }

  private initializeTestamentCharts() {
    setTimeout(() => {
      this.testaments.forEach(t => this.createTestamentChart(t));
    }, 0);
  }

  private createTestamentChart(testament: BibleTestament) {
    const chartId = this.getTestamentChartId(testament);
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.testamentCharts[chartId]) {
      this.testamentCharts[chartId].destroy();
    }

    const groupData = this.getTestamentChartData(testament);

    this.testamentCharts[chartId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: groupData.labels,
        datasets: [{
          data: groupData.data,
          backgroundColor: groupData.colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${percentage}%`;
              }
            }
          }
        },
        cutout: '75%',
        rotation: -90
      }
    });
  }

  private getTestamentChartData(testament: BibleTestament) {
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    testament.groups.forEach(group => {
      if (group.memorizedVerses > 0) {
        labels.push(group.name);
        data.push(group.memorizedVerses);
        colors.push(this.getGroupColor(group.name));
      }
    });

    const totalMemorized = data.reduce((a, b) => a + b, 0);
    const notMemorized = testament.totalVerses - totalMemorized;
    if (notMemorized > 0) {
      labels.push('Not Memorized');
      data.push(notMemorized);
      colors.push('#e5e7eb');
    }

    return { labels, data, colors };
  }

  getTestamentChartId(testament: BibleTestament): string {
    return testament.name.toLowerCase().replace(' ', '-') + '-chart';
  }

  getTestamentGroups(testament: BibleTestament): BibleGroup[] {
    return testament.groups.filter(g => g.memorizedVerses > 0);
  }

  getGroupColor(groupName: string): string {
    return this.groupColors[groupName] || '#6b7280';
  }

  getGroupShortName(groupName: string): string {
    const shortNames: { [key: string]: string } = {
      'Law': 'Law',
      'History': 'History',
      'Wisdom': 'Wisdom',
      'Major Prophets': 'Major',
      'Minor Prophets': 'Minor',
      'Gospels': 'Gospels',
      'Acts': 'Acts',
      'Pauline Epistles': 'Pauline',
      'General Epistles': 'General',
      'Revelation': 'Rev'
    };
    return shortNames[groupName] || groupName;
  }

  getGroupPercent(testament: BibleTestament, group: BibleGroup): number {
    return Math.round((group.memorizedVerses / testament.totalVerses) * 100);
  }

  get testaments(): BibleTestament[] {
    return this.bibleData ? this.bibleData.testaments : [];
  }

  get oldTestament(): BibleTestament {
    return this.bibleData!.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.bibleData!.getTestamentByName('NEW');
  }

  generateHeatmapData() {
    const data: HeatmapDay[] = [];
    const today = new Date();
    
    // Group verses by date
    const versesByDate = new Map<string, number>();
    this.userVerses.forEach(verse => {
      if (verse.last_practiced) {
        const date = new Date(verse.last_practiced).toISOString().split('T')[0];
        versesByDate.set(date, (versesByDate.get(date) || 0) + 1);
      }
    });
    
    // Generate 90-day heatmap
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const verses = versesByDate.get(dateStr) || 0;
      
      data.push({
        date: dateStr,
        verses,
        intensity: verses === 0 ? 0 : verses < 10 ? 1 : verses < 25 ? 2 : 3
      });
    }
    
    this.heatmapData = data;
  }

  calculateProjections() {
    if (this.stats.avgPerDay > 0) {
      const remainingVerses = this.stats.totalVerses - this.stats.memorized;
      const daysToComplete = Math.ceil(remainingVerses / this.stats.avgPerDay);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + daysToComplete);
      this.stats.projectedCompletion = completionDate.getFullYear().toString();
    }
    
    // Calculate monthly growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const versesThirtyDaysAgo = this.userVerses.filter(v => 
      v.last_practiced && new Date(v.last_practiced) < thirtyDaysAgo
    ).length;
    
    if (versesThirtyDaysAgo > 0) {
      const growth = ((this.stats.memorized - versesThirtyDaysAgo) / versesThirtyDaysAgo) * 100;
      this.stats.monthlyGrowth = Math.round(growth * 10) / 10;
    }
  }

  onTimeRangeChange(range: string) {
    this.selectedTimeRange = range;
    this.generateTimeSeriesData();
  }

  onPointHover(point: TimeSeriesPoint | null) {
    this.hoveredPoint = point;
  }

  getHeatmapColor(intensity: number): string {
    switch (intensity) {
      case 0: return '#f3f4f6';
      case 1: return '#ddd6fe';
      case 2: return '#a78bfa';
      case 3: return '#7c3aed';
      default: return '#f3f4f6';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Chart helper methods
  getMaxVerses(): number {
    if (this.timeSeriesData.length === 0) return 1;
    return Math.max(...this.timeSeriesData.map(p => p.verses), 1);
  }

  getChartX(index: number): number {
    if (this.timeSeriesData.length <= 1) return 350; // Center if only one point
    return index * (700 / (this.timeSeriesData.length - 1));
  }

  getChartY(verses: number): number {
    const maxVerses = this.getMaxVerses();
    if (maxVerses === 0) return 260; // Bottom of chart
    return 260 - (verses / maxVerses * 260);
  }

  getAreaPath(): string {
    if (this.timeSeriesData.length === 0) return '';
    
    const points = this.timeSeriesData.map((d, i) => 
      `L ${this.getChartX(i)} ${this.getChartY(d.verses)}`
    ).join(' ');
    
    return `M 0 260 ${points} L 700 260 Z`;
  }

  getLinePath(): string {
    if (this.timeSeriesData.length === 0) return '';
    
    return this.timeSeriesData.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${this.getChartX(i)} ${this.getChartY(d.verses)}`
    ).join(' ');
  }

  // Title helper for heatmap
  getHeatmapTitle(day: HeatmapDay): string {
    return `${day.date}: ${day.verses} verses`;
  }

  getGridLineY(index: number): number {
    return 260 - (index * 65);
  }
}