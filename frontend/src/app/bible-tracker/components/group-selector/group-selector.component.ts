import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BibleStatsComponent } from '../../bible-stats.component';

@Component({
  selector: 'app-group-selector',
  templateUrl: './group-selector.component.html',
  styleUrls: ['./group-selector.component.scss'],
  imports: [CommonModule]
})
export class GroupSelectorComponent extends BibleStatsComponent {

  constructor() {
    super();
  }


}