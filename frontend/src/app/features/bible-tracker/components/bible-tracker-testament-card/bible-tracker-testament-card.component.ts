import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleTestament } from '../../../../models/bible';
import { BibleGroup } from '../../../../models/bible/bible-group.modle';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-bible-tracker-testament-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-tracker-testament-card.component.html',
  styleUrls: ['./bible-tracker-testament-card.component.scss'],
})
export class BibleTrackerTestamentCardComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() testament!: BibleTestament;
  @Input() isActive: boolean = false;
  @Input() groupColors: { [key: string]: string } = {};
  @Output() testamentSelected = new EventEmitter<BibleTestament>();

  private chart: Chart | null = null;

  ngAfterViewInit() {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.createChart();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['testament'] && !changes['testament'].firstChange) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
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
    return this.testament.groups.filter((group) => group.memorizedVerses > 0);
  }

  getGroupColor(groupName: string): string {
    return this.groupColors[groupName] || '#6b7280';
  }

  getGroupShortName(groupName: string): string {
    const shortNames: { [key: string]: string } = {
      Law: 'Law',
      History: 'History',
      Wisdom: 'Wisdom',
      'Major Prophets': 'Major',
      'Minor Prophets': 'Minor',
      Gospels: 'Gospels',
      Acts: 'Acts',
      'Pauline Epistles': 'Pauline',
      'General Epistles': 'General',
      Revelation: 'Rev',
    };
    return shortNames[groupName] || groupName;
  }

  getGroupPercent(group: BibleGroup): number {
    return Math.round(
      (group.memorizedVerses / this.testament.totalVerses) * 100,
    );
  }

  selectTestament(): void {
    this.testamentSelected.emit(this.testament);
  }

  private createChart(): void {
    const canvasId = this.getChartId();
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found:', canvasId);
      return;
    }

    // Set canvas dimensions explicitly
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    const existing = Chart.getChart(canvasId);
    existing?.destroy();

    const chartData = this.getChartData();
    
    if (chartData.data.length === 0) {
      console.warn('No chart data available for:', this.testament.name);
      return;
    }

    try {
      this.chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.data,
              backgroundColor: chartData.colors,
              borderWidth: 3,
              borderColor: '#ffffff',
              hoverBorderWidth: 4,
              hoverBorderColor: '#ffffff',
              hoverBackgroundColor: chartData.colors.map(color => 
                this.adjustColorBrightness(color, 20)
              ),
            },
          ],
        },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: { weight: 600, size: 13 },
            bodyFont: { weight: 500, size: 12 },
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toLocaleString()} verses (${percentage}%)`;
              },
            },
          },
        },
        cutout: '72%',
        rotation: -90,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeInOutQuart'
        },
        elements: {
          arc: {
            borderJoinStyle: 'round'
          }
        }
      }
    });
      console.log('Chart created successfully for:', this.testament.name);
    } catch (error) {
      console.error('Error creating chart for', this.testament.name, error);
    }
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
    const groups = this.testament.groups || [];
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    groups.forEach((group) => {
      if (group.memorizedVerses > 0) {
        labels.push(group.name);
        data.push(group.memorizedVerses);
        colors.push(this.getGroupColor(group.name));
      }
    });

    const totalMemorized = data.reduce((a, b) => a + b, 0);
    const notMemorized = Math.max(0, (this.testament.totalVerses || 0) - totalMemorized);
    
    // Always ensure there's at least some data to display
    if (data.length === 0) {
      // If no memorized verses, show the full circle as "not memorized"
      labels.push('Not Memorized');
      data.push(this.testament.totalVerses || 1);
      colors.push('#e5e7eb');
    } else if (notMemorized > 0) {
      labels.push('Not Memorized');
      data.push(notMemorized);
      colors.push('#e5e7eb');
    }

    console.log('Chart data for', this.testament.name, { labels, data, colors });

    return { labels, data, colors };
  }

  private adjustColorBrightness(color: string, amount: number): string {
    // Handle hex colors
    if (color.startsWith('#')) {
      const num = parseInt(color.slice(1), 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    // Return original color if not hex
    return color;
  }
}
