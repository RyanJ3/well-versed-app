import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseBuilderStateService } from './course-builder-state.service';
import { VersePickerComponent } from '../../../components/bible/verse-range-picker/verse-range-picker.component';

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

  get isEditMode() {
    return this.state.isEditMode;
  }

  get saving() {
    return this.state.saving;
  }

  get draggedLessonIndex() {
    return this.state.draggedLessonIndex;
  }

  get draggedCardIndex() {
    return this.state.draggedCardIndex;
  }

  get estimatedDuration() {
    return this.state.estimatedDuration;
  }

  get pieSlices() {
    return this.state.pieSlices;
  }

  get selectedTags() {
    return this.state.selectedTags;
  }

  get availableTags() {
    return this.state.availableTags;
  }

  get quizCards() {
    return this.state.quizCards;
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

  getStepStatus(step: number) {
    return this.state.getStepStatus(step);
  }

  addTag(tag: string) {
    this.state.addTag(tag);
  }

  removeTag(tag: string) {
    this.state.removeTag(tag);
  }

  formatTag(tag: string) {
    return this.state.formatTag(tag);
  }

  canProceed() {
    return this.state.canProceed();
  }

  isLessonComplete(lesson: any) {
    return this.state.isLessonComplete(lesson);
  }

  onLessonDragStart(index: number) {
    this.state.onLessonDragStart(index);
  }

  onLessonDragOver(index: number, event: DragEvent) {
    this.state.onLessonDragOver(index, event);
  }

  onLessonDrop(index: number) {
    this.state.onLessonDrop(index);
  }

  onLessonDragEnd() {
    this.state.onLessonDragEnd();
  }

  getLessonIcon(type: string) {
    return this.state.getLessonIcon(type);
  }

  getLessonTypeLabel(type: string) {
    return this.state.getLessonTypeLabel(type);
  }

  deleteLesson(index: number) {
    this.state.deleteLesson(index);
  }

  onCardDragStart(index: number) {
    this.state.onCardDragStart(index);
  }

  onCardDragOver(index: number, event: DragEvent) {
    this.state.onCardDragOver(index, event);
  }

  onCardDrop(index: number) {
    this.state.onCardDrop(index);
  }

  onCardDragEnd() {
    this.state.onCardDragEnd();
  }

  getMaxVersesForCard(index: number) {
    return this.state.getMaxVersesForCard(index);
  }

  applyQuizSelection(index: number, sel: any) {
    this.state.applyQuizSelection(index, sel);
  }

  removeQuizCard(index: number) {
    this.state.removeQuizCard(index);
  }

  getTotalQuizVerses() {
    return this.state.getTotalQuizVerses();
  }

  addQuizCard() {
    this.state.addQuizCard();
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
