// components/chapter-selector.component.ts
import { NgClass, NgForOf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-chapter-selector',
  standalone: true,
  imports: [FormsModule, NgClass, NgForOf],
  templateUrl: './chapter-selector.component.html',
  styleUrls: ['./chapter-selector.component.scss'],
})
export class ChapterSelectorComponent extends BibleStatsComponent {

  constructor() {
    super();
  }

}
