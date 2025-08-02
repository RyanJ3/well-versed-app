import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson } from '../../models/course-builder.types';

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-preview.component.html',
  styleUrls: ['./course-preview.component.scss'],
})
export class CoursePreviewComponent {
  @Input() lessons: Lesson[] = [];
}
