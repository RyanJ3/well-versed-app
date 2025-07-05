import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RequestStats {
  openBugs: number;
  totalRequests: number;
  completed: number;
  trending: number;
}

@Component({
  selector: 'app-request-stats',
  templateUrl: './request-stats.component.html',
  styleUrls: ['./request-stats.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class RequestStatsComponent {
  @Input() stats: RequestStats = {
    openBugs: 0,
    totalRequests: 0,
    completed: 0,
    trending: 0
  };
}
