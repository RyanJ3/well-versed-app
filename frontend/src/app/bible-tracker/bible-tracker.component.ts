// frontend/src/app/bible-tracker/bible-tracker.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { BibleBook, BibleChapter, BibleData, BibleTestament, UserVerseDetail } from '../core/models/bible';
import { BibleGroup } from '../core/models/bible/bible-group.modle';
import { BibleService } from '../core/services/bible.service';
import { UserService } from '../core/services/user.service';
import { BibleVerse } from '../core/models/bible/bible-verse.model';
import { ModalService } from '../core/services/modal.service';

@Component({
  selector: 'app-bible-tracker',
  templateUrl: './bible-tracker.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogsModule, ButtonsModule],
  styleUrls: ['./bible-tracker.component.scss'],
})
export class BibleTrackerComponent implements OnInit, OnDestroy, AfterViewInit {
  private bibleData: BibleData;
  private subscriptions: Subscription = new Subscription();
  private testamentCharts: { [key: string]: Chart } = {};
  private totalProgressChart: Chart | null = null;
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

  selectedTestament: BibleTestament | null = null;
  selectedGroup: BibleGroup | null = null;
  selectedBook: BibleBook | null = null;
  selectedChapter: BibleChapter | null = null;

  userVerses: UserVerseDetail[] = [];
  isLoading = true;
  isSavingBulk = false;
  userId = 1; // Default test user
  includeApocrypha = false;


  constructor(
    private bibleService: BibleService,
    private userService: UserService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.bibleData = this.bibleService.getBibleData();
    this.selectedTestament = this.defaultTestament;
    if (this.selectedTestament?.groups.length > 0) {
      this.setGroup(this.defaultGroup);
    }
  }

  ngOnInit() {
    const userSub = this.userService.currentUser$.subscribe(user => {
      if (user) {
        const newSetting = user.includeApocrypha || false;
        if (this.includeApocrypha !== newSetting) {
          this.includeApocrypha = newSetting;
          this.loadUserVerses();
        } else if (!this.userVerses.length) {
          this.loadUserVerses();
        }
      } else {
        this.loadUserVerses();
      }
    });

    this.subscriptions.add(userSub);
    this.userService.fetchCurrentUser();
  }

  ngAfterViewInit() {
    // Initialize charts after view is initialized
    setTimeout(() => {
      this.initializeAllCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    // Destroy all charts
    Object.values(this.testamentCharts).forEach(chart => chart.destroy());
    if (this.totalProgressChart) {
      this.totalProgressChart.destroy();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    Object.values(this.testamentCharts).forEach(chart => {
      chart.resize();
    });
    if (this.totalProgressChart) {
      this.totalProgressChart.resize();
    }
  }

  loadUserVerses() {
    this.isLoading = true;

    this.bibleService.getUserVerses(this.userId, this.includeApocrypha).subscribe({
      next: (verses: any) => {
        this.userVerses = verses;
        this.isLoading = false;
        this.initializeAllCharts();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading verses:', error);
        this.isLoading = false;
        this.modalService.alert(
          'Error Loading Verses',
          'Unable to load your saved verses. Please check your connection and try again.',
          'danger'
        );
        this.cdr.detectChanges();
      }
    });
  }

  private initializeAllCharts() {
    // Initialize testament charts
    this.initializeTestamentCharts();
    this.initializeTotalProgressChart();
  }

  private initializeTestamentCharts() {
    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      this.testaments.forEach(testament => {
        this.createTestamentChart(testament);
      });
    }, 0);
  }

  private createTestamentChart(testament: BibleTestament) {
    const chartId = this.getTestamentChartId(testament);
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    
    if (!canvas) return;

    // Destroy existing chart if it exists
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

    // Add percentage text
    const container = canvas.parentElement;
    if (container) {
      // Remove existing percentage text if any
      const existingText = container.querySelector('.testament-percent-text');
      if (existingText) {
        existingText.remove();
      }

      const percentText = document.createElement('div');
      percentText.className = 'testament-percent-text';
      percentText.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; font-weight: 700; color: #1f2937;';
      percentText.textContent = testament.percentComplete + '%';
      container.appendChild(percentText);
    }
  }


  private getTestamentChartData(testament: BibleTestament) {
    const groups = testament.groups;
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    // Calculate memorized verses for each group
    groups.forEach(group => {
      if (group.memorizedVerses > 0) {
        labels.push(group.name);
        data.push(group.memorizedVerses);
        colors.push(this.getGroupColor(group.name));
      }
    });

    // Add "Not Memorized" section
    const totalMemorized = data.reduce((a, b) => a + b, 0);
    const notMemorized = testament.totalVerses - totalMemorized;
    if (notMemorized > 0) {
      labels.push('Not Memorized');
      data.push(notMemorized);
      colors.push('#e5e7eb');
    }

    return { labels, data, colors };
  }

  private updateTestamentCharts() {
    this.testaments.forEach(testament => {
      this.createTestamentChart(testament);
    });
    this.initializeTotalProgressChart();
  }

  private initializeTotalProgressChart() {
    const canvas = document.getElementById('totalProgressChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.totalProgressChart) {
      this.totalProgressChart.destroy();
    }

    const monthlyData = this.generateMonthlyData();

    this.totalProgressChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Verses Memorized',
          data: monthlyData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx: any) => `${ctx.parsed.y} verses`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private generateMonthlyData(): number[] {
    const currentMonth = new Date().getMonth();
    const totalMemorized = this.memorizedVerses;
    const monthlyData: number[] = [];

    for (let i = 0; i <= currentMonth; i++) {
      const progress = (i + 1) / (currentMonth + 1);
      monthlyData.push(Math.round(totalMemorized * progress));
    }

    for (let i = currentMonth + 1; i < 12; i++) {
      monthlyData.push(0);
    }

    return monthlyData;
  }

  toggleAndSaveVerse(verse: BibleVerse): void {
    verse.toggle();
    this.saveVerse(verse);
  }

  saveVerse(verse: BibleVerse) {
    if (!verse.chapter || !verse.book) {
      console.error('Verse missing required data');
      return;
    }

    if (verse.memorized) {
      const practiceCount = 1;
      this.bibleService.saveVerse(
        this.userId,
        verse.book.id,
        verse.chapter.chapterNumber,
        verse.verseNumber,
        practiceCount
      ).subscribe({
        next: (response: any) => {
          console.log('Verse saved successfully');
          verse.practiceCount = practiceCount;
          verse.lastPracticed = new Date();
          this.updateTestamentCharts();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error saving verse:', error);
          verse.toggle();
          this.modalService.alert(
            'Error Saving Verse',
            'Unable to save this verse. Please try again.',
            'danger'
          );
          this.cdr.detectChanges();
        }
      });
    } else {
      this.bibleService.deleteVerse(
        this.userId,
        verse.book.id,
        verse.chapter.chapterNumber,
        verse.verseNumber
      ).subscribe({
        next: (response: any) => {
          console.log('Verse deleted successfully');
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
          this.updateTestamentCharts();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error deleting verse:', error);
          verse.toggle();
          this.modalService.alert(
            'Error Removing Verse',
            'Unable to remove this verse. Please try again.',
            'danger'
          );
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Navigation methods
  setTestament(testament: BibleTestament): void {
    this.selectedTestament = testament;
    if (testament.groups.length > 0) {
      this.setGroup(testament.groups[0]);
    }
  }

  setGroup(group: BibleGroup): void {
    this.selectedGroup = group;
    if (group.books.length > 0) {
      this.setBook(group.books[0]);
    }
  }

  setBook(book: BibleBook): void {
    this.selectedBook = book;
    const visibleChapters = this.getVisibleChapters(book);
    if (visibleChapters.length > 0) {
      this.setChapter(visibleChapters[0]);
    }
  }

  setChapter(chapter: BibleChapter): void {
    this.selectedChapter = chapter;
  }

  refreshVerses() {
    this.loadUserVerses();
  }

  // Chapter-level operations
  selectAllVerses(): void {
    if (!this.selectedChapter || !this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.saveChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = true;
          verse.practiceCount = 1;
          verse.lastPracticed = new Date();
        });
        this.isSavingBulk = false;
        this.updateTestamentCharts();
        this.modalService.success(
          'Chapter Saved',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been marked as memorized.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error saving chapter:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Chapter',
          'Unable to save all verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  async clearAllVerses(): Promise<void> {
    if (!this.selectedChapter || !this.selectedBook) return;

    const confirmed = await this.modalService.danger(
      'Clear All Verses?',
      `Are you sure you want to clear all memorized verses in ${this.selectedBook.name} ${this.selectedChapter.chapterNumber}? This action cannot be undone.`,
      'Clear Verses'
    );

    if (!confirmed) return;

    this.isSavingBulk = true;

    this.bibleService.clearChapter(
      this.userId,
      this.selectedBook.id,
      this.selectedChapter.chapterNumber
    ).subscribe({
      next: () => {
        this.selectedChapter!.verses.forEach(verse => {
          verse.memorized = false;
          verse.practiceCount = 0;
          verse.lastPracticed = undefined;
        });
        this.isSavingBulk = false;
        this.updateTestamentCharts();
        this.modalService.success(
          'Chapter Cleared',
          `All verses in ${this.selectedBook!.name} ${this.selectedChapter!.chapterNumber} have been cleared.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error clearing chapter:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Clearing Chapter',
          'Unable to clear verses in this chapter. Please try again.',
          'danger'
        );
      }
    });
  }

  // Book-level operation
  selectAllChapters(): void {
    if (!this.selectedBook) return;

    this.isSavingBulk = true;

    this.bibleService.saveBook(
      this.userId,
      this.selectedBook.id
    ).subscribe({
      next: () => {
        this.selectedBook!.chapters.forEach(ch => ch.selectAllVerses());
        this.isSavingBulk = false;
        this.updateTestamentCharts();
        this.modalService.success(
          'Book Saved',
          `${this.selectedBook!.name} has been marked as memorized.`
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error saving book:', error);
        this.isSavingBulk = false;
        this.modalService.alert(
          'Error Saving Book',
          'Unable to save all chapters in this book. Please try again.',
          'danger'
        );
      }
    });
  }

  // Helper methods
  isChapterVisible(chapter: BibleChapter): boolean {
    return this.includeApocrypha || !chapter.isApocryphal;
  }

  getVisibleChapters(book: BibleBook): BibleChapter[] {
    return book.chapters.filter(chapter => this.isChapterVisible(chapter));
  }

  hasApocryphalChapters(book: BibleBook): boolean {
    return book.chapters.some(chapter => chapter.isApocryphal);
  }

  goToSettings(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  getTestamentClass(testament: BibleTestament): string {
    return testament.name === 'Old Testament' ? 'old-testament' : 'new-testament';
  }

  isApocryphalBook(book: BibleBook): boolean {
    return book.canonicalAffiliation !== 'All' &&
      (book.canonicalAffiliation === 'Catholic' ||
        book.canonicalAffiliation === 'Eastern Orthodox');
  }

  // Chart helper methods
  getTestamentChartId(testament: BibleTestament): string {
    return testament.name.toLowerCase().replace(' ', '-') + '-chart';
  }

  getTestamentGroups(testament: BibleTestament): BibleGroup[] {
    return testament.groups.filter(group => group.memorizedVerses > 0);
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

  getGroupBooksList(group: BibleGroup): string {
    const bookNames = group.books.slice(0, 3).map(b => b.name).join(', ');
    return group.books.length > 3 ? `${bookNames}...` : bookNames;
  }

  getHeatmapClass(chapter: BibleChapter): string {
    const percent = chapter.percentComplete;
    if (percent === 0) return 'heatmap-cell heat-0';
    if (percent <= 20) return 'heatmap-cell heat-1';
    if (percent <= 40) return 'heatmap-cell heat-2';
    if (percent <= 60) return 'heatmap-cell heat-3';
    if (percent <= 80) return 'heatmap-cell heat-4';
    if (percent < 100) return 'heatmap-cell heat-5';
    return 'heatmap-cell heat-complete';
  }

  getBookProgressColor(book: BibleBook): string {
    const percent = book.percentComplete;
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#3b82f6';
    if (percent >= 20) return '#8b5cf6';
    return '#f59e0b';
  }

  getConsecutiveVerses(): string {
    if (!this.selectedChapter) return '';
    
    const memorizedVerses = this.selectedChapter.verses
      .filter(v => v.memorized)
      .map(v => v.verseNumber)
      .sort((a, b) => a - b);
    
    if (memorizedVerses.length === 0) return '';
    
    let longestStart = memorizedVerses[0];
    let longestLength = 1;
    let currentStart = memorizedVerses[0];
    let currentLength = 1;
    
    for (let i = 1; i < memorizedVerses.length; i++) {
      if (memorizedVerses[i] === memorizedVerses[i - 1] + 1) {
        currentLength++;
        if (currentLength > longestLength) {
          longestLength = currentLength;
          longestStart = currentStart;
        }
      } else {
        currentStart = memorizedVerses[i];
        currentLength = 1;
      }
    }
    
    if (longestLength >= 3) {
      return `${longestStart}-${longestStart + longestLength - 1}`;
    }
    return '';
  }

  // Getters
  get testaments(): BibleTestament[] {
    return this.bibleData.testaments;
  }

  get oldTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('OLD');
  }

  get newTestament(): BibleTestament {
    return this.bibleData.getTestamentByName('NEW');
  }

  get defaultTestament(): BibleTestament {
    return this.oldTestament;
  }

  get defaultGroup(): BibleGroup {
    return this.defaultBook.group;
  }

  get defaultBook(): BibleBook {
    return this.bibleData.getBookByName("Genesis");
  }

  get percentComplete(): number {
    return this.bibleData.percentComplete;
  }

  get totalVerses(): number {
    return this.bibleData.totalVerses;
  }

  get memorizedVerses(): number {
    return this.bibleData.memorizedVerses;
  }
}