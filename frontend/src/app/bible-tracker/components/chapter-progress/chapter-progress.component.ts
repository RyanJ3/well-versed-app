import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';
import { VerseSelectorComponent } from '../verse-selector/verse-selector.component';

@Component({
  selector: 'app-chapter-progress',
  templateUrl: './chapter-progress.component.html',
  styleUrls: ['./chapter-progress.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    VerseSelectorComponent
  ]
})
export class ChapterProgressComponent extends BibleStatsComponent {

  constructor() {
    super();
  }
  
}