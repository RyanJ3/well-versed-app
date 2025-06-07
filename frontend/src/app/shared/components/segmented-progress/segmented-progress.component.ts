import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProgressSegment {
  name: string;
  shortName: string;
  percent: number;
  color: string;
  verses: number;
}

@Component({
  selector: 'app-segmented-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segmented-progress.component.html',
  styleUrls: ['./segmented-progress.component.css']
})
export class SegmentedProgressComponent {
  progressViewMode: 'testament' | 'groups' = 'testament';

  readonly totalVerses = 31102;
  readonly memorizedVerses = 8432;

  private readonly testamentData = {
    OT: 5596,
    NT: 2836
  };

  private readonly groupData: { [key: string]: number } = {
    'Law': 1500,
    'History': 1400,
    'Wisdom': 1200,
    'Major Prophets': 800,
    'Minor Prophets': 696,
    'Gospels': 1100,
    'Acts': 400,
    'Pauline Epistles': 800,
    'General Epistles': 336,
    'Revelation': 200
  };

  private readonly colors: { [key: string]: string } = {
    'Old Testament': '#3b82f6',
    'New Testament': '#10b981',
    'Remaining': '#e5e7eb',
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

  toggleView() {
    this.progressViewMode = this.progressViewMode === 'testament' ? 'groups' : 'testament';
  }

  get segments(): ProgressSegment[] {
    if (this.progressViewMode === 'testament') {
      const otPercent = Math.round((this.testamentData.OT / this.totalVerses) * 100);
      const ntPercent = Math.round((this.testamentData.NT / this.totalVerses) * 100);
      const remainingPercent = 100 - otPercent - ntPercent;
      return [
        {
          name: 'Old Testament',
          shortName: 'OT',
          percent: otPercent,
          color: this.colors['Old Testament'],
          verses: this.testamentData.OT
        },
        {
          name: 'New Testament',
          shortName: 'NT',
          percent: ntPercent,
          color: this.colors['New Testament'],
          verses: this.testamentData.NT
        },
        {
          name: 'Remaining',
          shortName: 'Remaining',
          percent: remainingPercent,
          color: this.colors['Remaining'],
          verses: this.totalVerses - this.memorizedVerses
        }
      ];
    }

    const result: ProgressSegment[] = [];
    let totalPercent = 0;
    for (const [name, verses] of Object.entries(this.groupData)) {
      const percent = Math.round((verses / this.totalVerses) * 100);
      totalPercent += percent;
      result.push({
        name,
        shortName: this.getShortName(name),
        percent,
        color: this.colors[name],
        verses
      });
    }
    const remainingPercent = 100 - totalPercent;
    result.push({
      name: 'Remaining',
      shortName: 'Remaining',
      percent: remainingPercent,
      color: this.colors['Remaining'],
      verses: this.totalVerses - this.memorizedVerses
    });
    return result;
  }

  private getShortName(name: string): string {
    const map: { [key: string]: string } = {
      'Old Testament': 'OT',
      'New Testament': 'NT',
      'Law': 'Law',
      'History': 'Hist',
      'Wisdom': 'Wis',
      'Major Prophets': 'Major',
      'Minor Prophets': 'Minor',
      'Gospels': 'Gospels',
      'Acts': 'Acts',
      'Pauline Epistles': 'Paul',
      'General Epistles': 'General',
      'Revelation': 'Rev'
    };
    return map[name] || name;
  }
}

export { ProgressSegment };
