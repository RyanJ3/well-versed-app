import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseBuilderStateService } from './course-builder-state.service';
import { VersePickerComponent } from '../../../../shared/components/verse-range-picker/verse-range-picker.component';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VersePickerComponent],
  templateUrl: './course-builder.component.html',
  styleUrls: ['./course-builder.component.scss'],
})
export class CourseBuilderComponent implements OnInit {
  constructor(
    public state: CourseBuilderStateService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.state.init();
  }

  get courseForm() {
    return this.state.courseForm;
  }

  get lessonForm() {
    return this.state.lessonForm;
  }

  get lessons() {
    return this.state.lessons;
  }

  get selectedLessonIndex() {
    return this.state.selectedLessonIndex;
  }

  get steps() {
    return this.state.steps;
  }

  get currentStep() {
    return this.state.currentStep;
  }

  get selectedTags() {
    return this.state.selectedTags;
  }

  get availableTags() {
    return this.state.availableTags;
  }

  addLesson() {
    this.state.addLesson();
  }

  saveLessonToMemory() {
    this.state.saveLessonToMemory();
  }

  selectLesson(i: number) {
    this.state.selectLesson(i);
  }

  nextStep() {
    this.state.nextStep();
  }

  previousStep() {
    this.state.previousStep();
  }

  goToStep(step: number) {
    this.state.goToStep(step);
  }

  saveCourse() {
    this.state.saveCourse();
  }

  cancel() {
    this.state.cancel();
  }

  @HostListener('document:click', ['$event'])
  onAnyButtonClick(event: Event) {
    const target = event.target as HTMLElement;
    if (
      target.closest('button') &&
      this.state.currentStep === 2 &&
      this.state.selectedLessonIndex !== null
    ) {
      this.state.saveLessonToMemory();
    }
  }

  @HostListener('document:keydown')
  onAnyKey() {
    if (this.state.currentStep === 2 && this.state.selectedLessonIndex !== null) {
      this.state.saveLessonToMemory();
    }
  }
}
