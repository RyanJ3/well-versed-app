import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleData, BibleTestament } from '../../core/models/bible';
import { BibleGroup } from '../../core/models/bible/bible-group.modle';

export interface ProgressSegment {
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
  /** Bible data with memorization progress */
  @Input() bibleData!: BibleData;

  progressViewMode: 'testament' | 'groups' = 'testament';

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
    if (!this.bibleData) {
      return [];
    }

    const totalVerses = this.bibleData.totalVerses;
    const memorizedVerses = this.bibleData.memorizedVerses;

    if (this.progressViewMode === 'testament') {
      const otMem = this.bibleData.getTestamentByName('OLD').memorizedVerses;
      const ntMem = this.bibleData.getTestamentByName('NEW').memorizedVerses;
      const otPercent = Math.round((otMem / totalVerses) * 100);
      const ntPercent = Math.round((ntMem / totalVerses) * 100);
      const remainingPercent = 100 - otPercent - ntPercent;
      return [
        {
          name: 'Old Testament',
          shortName: 'OT',
          percent: otPercent,
          color: this.colors['Old Testament'],
          verses: otMem
        },
        {
          name: 'New Testament',
          shortName: 'NT',
          percent: ntPercent,
          color: this.colors['New Testament'],
          verses: ntMem
        },
        {
          name: 'Remaining',
          shortName: 'Remaining',
          percent: remainingPercent,
          color: this.colors['Remaining'],
          verses: totalVerses - memorizedVerses
        }
      ];
    }

    const result: ProgressSegment[] = [];
    const groupMap = new Map<string, { memorized: number }>();
    this.bibleData.testaments.forEach((testament: BibleTestament) => {
      testament.groups.forEach((group: BibleGroup) => {
        const current = groupMap.get(group.name) || { memorized: 0 };
        groupMap.set(group.name, { memorized: current.memorized + group.memorizedVerses });
      });
    });

    let accountedPercent = 0;
    for (const [name, info] of groupMap.entries()) {
      const percent = Math.round((info.memorized / totalVerses) * 100);
      accountedPercent += percent;
      result.push({
        name,
        shortName: this.getShortName(name),
        percent,
        color: this.colors[name],
        verses: info.memorized
      });
    }
    const remainingPercent = 100 - accountedPercent;
    result.push({
      name: 'Remaining',
      shortName: 'Remaining',
      percent: remainingPercent,
      color: this.colors['Remaining'],
      verses: totalVerses - memorizedVerses
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
