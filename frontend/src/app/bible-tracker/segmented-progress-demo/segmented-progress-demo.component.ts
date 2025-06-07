import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-segmented-progress-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segmented-progress-demo.component.html'
})
export class SegmentedProgressDemoComponent {
  progressViewMode: 'testament' | 'groups' = 'testament';

  // Mock data from the original demo
  totalVerses = 31102;
  memorizedVerses = 8432;
  percentComplete = 27;

  oldTestamentMemorized = 5596;
  newTestamentMemorized = 2836;

  groupColors: Record<string, string> = {
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

  groupsData = [
    { name: 'Law', memorizedVerses: 1879, shortName: 'Law' },
    { name: 'History', memorizedVerses: 1345, shortName: 'History' },
    { name: 'Wisdom', memorizedVerses: 892, shortName: 'Wisdom' },
    { name: 'Major Prophets', memorizedVerses: 756, shortName: 'Major' },
    { name: 'Minor Prophets', memorizedVerses: 724, shortName: 'Minor' },
    { name: 'Gospels', memorizedVerses: 1456, shortName: 'Gospels' },
    { name: 'Acts', memorizedVerses: 432, shortName: 'Acts' },
    { name: 'Pauline Epistles', memorizedVerses: 678, shortName: 'Pauline' },
    { name: 'General Epistles', memorizedVerses: 245, shortName: 'General' },
    { name: 'Revelation', memorizedVerses: 25, shortName: 'Rev' }
  ];

  toggleProgressView(): void {
    this.progressViewMode = this.progressViewMode === 'testament' ? 'groups' : 'testament';
  }

  get segments() {
    if (this.progressViewMode === 'testament') {
      const otPercent = Math.round((this.oldTestamentMemorized / this.totalVerses) * 100);
      const ntPercent = Math.round((this.newTestamentMemorized / this.totalVerses) * 100);
      const remainingPercent = 100 - otPercent - ntPercent;

      return [
        {
          name: 'Old Testament',
          shortName: 'OT',
          percent: otPercent,
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
          verses: this.oldTestamentMemorized
        },
        {
          name: 'New Testament',
          shortName: 'NT',
          percent: ntPercent,
          color: '#6366f1',
          gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          verses: this.newTestamentMemorized
        },
        {
          name: 'Remaining',
          shortName: '',
          percent: remainingPercent,
          color: '#e5e7eb',
          gradient: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
          verses: this.totalVerses - this.oldTestamentMemorized - this.newTestamentMemorized
        }
      ];
    }

    const segments = [] as Array<{ name: string; shortName: string; percent: number; color: string; gradient: string; verses: number }>; 
    let totalMemorized = 0;
    this.groupsData.forEach(group => {
      if (group.memorizedVerses > 0) {
        const percent = Math.round((group.memorizedVerses / this.totalVerses) * 100);
        const color = this.groupColors[group.name];
        segments.push({
          name: group.name,
          shortName: group.shortName,
          percent,
          color,
          gradient: `linear-gradient(135deg, ${color}, ${color}dd)`,
          verses: group.memorizedVerses
        });
        totalMemorized += group.memorizedVerses;
      }
    });

    const remainingPercent = Math.round(((this.totalVerses - totalMemorized) / this.totalVerses) * 100);
    if (remainingPercent > 0) {
      segments.push({
        name: 'Remaining',
        shortName: '',
        percent: remainingPercent,
        color: '#e5e7eb',
        gradient: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
        verses: this.totalVerses - totalMemorized
      });
    }
    return segments;
  }
}
