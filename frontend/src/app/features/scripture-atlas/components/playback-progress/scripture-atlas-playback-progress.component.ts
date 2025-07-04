import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scripture-atlas-playback-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas-playback-progress.component.html',
  styleUrls: ['./scripture-atlas-playback-progress.component.scss']
})
export class ScriptureAtlasPlaybackProgressComponent {
  @Input() currentIndex = 0;
  @Input() total = 0;
  @Input() progress = 0;
}
