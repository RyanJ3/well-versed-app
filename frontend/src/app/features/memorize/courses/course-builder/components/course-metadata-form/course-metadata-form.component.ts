import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-metadata-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-metadata-form.component.html',
  styleUrls: ['./course-metadata-form.component.scss'],
})
export class CourseMetadataFormComponent {
  @Input() form!: FormGroup;
  @Input() availableTags: string[] = [];
  @Input() selectedTags: string[] = [];
  @Output() addTag = new EventEmitter<string>();
  @Output() removeTag = new EventEmitter<string>();
}
