// frontend/src/app/features/courses/browse/browse-courses.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CourseService } from '@services/course.service';
import { UserService } from '@services/user.service';
import { Course } from '@models/course.model';
import { User } from '@models/user';

@Component({
  selector: 'app-browse-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './browse-courses.component.html',
  styleUrls: ['./browse-courses.component.scss'],
})
export class BrowseCoursesComponent implements OnInit {
  courses: Course[] = [];
  enrolledCourseIds: number[] = [];
  loading = false;
  searchQuery = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];
  currentUser: User | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  perPage = 12;

  constructor(
    private courseService: CourseService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadAvailableTags();
    this.loadCourses();

    // Subscribe to current user
    this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadEnrolledCourses();
      }
    });
  }

  loadAvailableTags() {
    this.availableTags = this.courseService.getSuggestedTags();
  }

  loadCourses() {
    this.loading = true;

    this.courseService
      .getPublicCourses(
        this.currentPage,
        this.perPage,
        this.searchQuery,
        this.selectedTags,
      )
      .subscribe({
        next: (response) => {
          this.courses = response.courses;
          this.totalPages = Math.ceil(response.total / this.perPage);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.loading = false;
        },
      });
  }

  loadEnrolledCourses() {
    if (!this.currentUser) return;

    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

    this.courseService.getEnrolledCourses(userId).subscribe({
      next: (courses) => {
        this.enrolledCourseIds = courses.map((w) => w.id);
      },
      error: (error) => {
        console.error('Error loading enrolled courses:', error);
      },
    });
  }

  searchCourses() {
    this.currentPage = 1;
    this.loadCourses();
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.searchCourses();
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  viewCourse(course: Course) {
    this.router.navigate(['/courses', course.id]);
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledCourseIds.includes(courseId);
  }

  toggleEnrollment(event: Event, course: Course) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const userId =
      typeof this.currentUser.id === 'string'
        ? parseInt(this.currentUser.id)
        : this.currentUser.id;

    if (this.isEnrolled(course.id)) {
      // If enrolled, navigate to the course
      this.viewCourse(course);
    } else {
      // Enroll in the course
      this.courseService.enrollInCourse(course.id, userId).subscribe({
        next: () => {
          this.enrolledCourseIds.push(course.id);
          // Navigate to the course after enrollment
          this.viewCourse(course);
        },
        error: (error) => {
          console.error('Error enrolling in course:', error);
        },
      });
    }
  }

  getCreatorInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  navigateToCreate() {
    this.router.navigate(['/courses/create']);
  }
}
