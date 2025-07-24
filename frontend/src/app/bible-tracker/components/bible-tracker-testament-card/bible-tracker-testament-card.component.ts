import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleTestament } from '../../../core/models/bible';
import { BibleGroup } from '../../../core/models/bible/bible-group.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-bible-tracker-testament-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-testament-card.component.html',
  styleUrls: ['./bible-tracker-testament-card.component.scss']
})
export class BibleTrackerTestamentCardComponent implements AfterViewInit, OnChanges {
  @Input() testament!: BibleTestament;
  @Input() isActive: boolean = false;
  @Input() groupColors: { [key: string]: string } = {};
  @Output() testamentSelected = new EventEmitter<BibleTestament>();
  
  private chart: Chart | null = null;
  
  ngAfterViewInit() {
    this.createChart();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['testament'] && !changes['testament'].firstChange) {
      this.updateChart();
    }
  }
  
  getTestamentClass(): string {
    if (this.testament.name === 'Old Testament') return 'old-testament';
    if (this.testament.name === 'New Testament') return 'new-testament';
    return 'apocrypha-testament';
  }
  
  getChartId(): string {
    return this.testament.name.toLowerCase().replace(' ', '-') + '-chart';
  }
  
  getTestamentGroups(): BibleGroup[] {
    return this.testament.groups.filter(group => group.memorizedVerses > 0);
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
  
  getGroupPercent(group: BibleGroup): number {
    return Math.round((group.memorizedVerses / this.testament.totalVerses) * 100);
  }
  
  selectTestament(): void {
    this.testamentSelected.emit(this.testament);
  }
  
  private createChart(): void {
    const canvas = document.getElementById(this.getChartId()) as HTMLCanvasElement;
    if (!canvas) return;
    
    const chartData = this.getChartData();
    
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: chartData.colors,
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
  
  private updateChart(): void {
    if (this.chart) {
      const chartData = this.getChartData();
      this.chart.data.labels = chartData.labels;
      this.chart.data.datasets[0].data = chartData.data;
      this.chart.data.datasets[0].backgroundColor = chartData.colors;
      this.chart.update();
    }
  }
  
  private getChartData() {
    const groups = this.testament.groups;
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    groups.forEach(group => {
      if (group.memorizedVerses > 0) {
        labels.push(group.name);
        data.push(group.memorizedVerses);
        colors.push(this.getGroupColor(group.name));
      }
    });

    const totalMemorized = data.reduce((a, b) => a + b, 0);
    const notMemorized = this.testament.totalVerses - totalMemorized;
    if (notMemorized > 0) {
      labels.push('Not Memorized');
      data.push(notMemorized);
      colors.push('#e5e7eb');
    }

    return { labels, data, colors };
  }
}