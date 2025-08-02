import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flow-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-progress.component.html',
  styleUrls: ['./flow-progress.component.scss']
})
export class FlowProgressComponent {
  @Input() memorizedCount = 0;
  @Input() totalCount = 0;
  
  get progressPercent(): number {
    return this.totalCount > 0 
      ? Math.round((this.memorizedCount / this.totalCount) * 100)
      : 0;
  }
}
