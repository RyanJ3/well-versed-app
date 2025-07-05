import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bible-tracker-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <h2 class="page-title">Bible Memory Tracker</h2>
      <p class="page-subtitle">Track your scripture memorization progress</p>
    </div>
  `,
  styles: [`
    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 1.75rem;
      color: #1f2937;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .page-subtitle {
      color: #6b7280;
    }
  `]
})
export class BibleTrackerHeaderComponent {
}
