import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class ScriptureAtlasComponent {
  constructor() {}
}