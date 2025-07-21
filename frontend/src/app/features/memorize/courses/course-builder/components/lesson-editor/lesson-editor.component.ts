import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-lesson-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lesson-editor.component.html',
  styleUrls: ['./lesson-editor.component.scss'],
})
export class LessonEditorComponent {
  @Input() form!: FormGroup;
}
