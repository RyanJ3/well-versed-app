import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson } from '@models/course-builder.types';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-list.component.html',
  styleUrls: ['./lesson-list.component.scss'],
})
export class LessonListComponent {
  @Input() lessons: Lesson[] = [];
  @Input() selectedIndex: number | null = null;
  @Output() select = new EventEmitter<number>();
  @Output() addLesson = new EventEmitter<void>();
}
