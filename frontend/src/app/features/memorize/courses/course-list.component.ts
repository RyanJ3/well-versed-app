import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CourseService } from '../../../core/services/api/course.service';
import { UserService } from '../../../core/services/api/user.service';
import { Course } from '../../../core/models/course.model';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="landing-container">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div>
            <h1 class="title">Course Library</h1>
            <p class="subtitle">
              Build your faith through structured learning paths
            </p>
          </div>

          <div class="actions">
            <button class="trending-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 17l6-6 4 4 8-8"
                />
              </svg>
              Trending
            </button>
            <button class="create-btn" (click)="navigateToCreate()">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New
            </button>
          </div>
        </div>

        <div class="search-filter">
          <div class="search-wrapper">
            <svg
              class="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search courses, topics, or creators..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="searchCourses()"
            />
          </div>

          <div class="view-toggle">
            <button
              (click)="toggleView('list')"
              [class.active]="viewMode === 'list'"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <button
              (click)="toggleView('grid')"
              [class.active]="viewMode === 'grid'"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v7H4v-7zm9 0h7v7h-7v-7z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="quick-filters">
          <button class="pill">All Courses</button>
          <button class="pill">In Progress</button>
          <button class="pill">Completed</button>
          <button class="pill">Recommended</button>
          <div class="divider"></div>
          <ng-container *ngFor="let tag of availableTags.slice(0, 5)">
            <button
              class="pill"
              [class.selected]="selectedTags.includes(tag)"
              (click)="toggleTag(tag)"
            >
              {{ formatTag(tag) }}
            </button>
          </ng-container>
          <button class="pill more">
            More
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div class="results-count" *ngIf="!loading">
          Showing {{ courses.length }} of {{ totalPages * perPage }} courses
          <button
            *ngIf="selectedTags.length > 0"
            class="clear-btn"
            (click)="clearTags()"
          >
            Clear filters
          </button>
        </div>
      </div>

      <!-- Courses Grid -->
      <div
        class="grid-view"
        *ngIf="viewMode === 'grid' && !loading && courses.length > 0"
      >
        <div
          class="grid-card"
          *ngFor="let course of courses"
          (click)="viewCourse(course)"
        >
          <div class="grid-thumb">
            <img
              *ngIf="course.thumbnail_url"
              [src]="course.thumbnail_url"
              alt=""
            />
            <div *ngIf="!course.thumbnail_url" class="thumb-placeholder">
              {{ getCourseIcon(course) }}
            </div>
            <div *ngIf="isEnrolled(course.id)" class="grid-progress">
              <div class="progress-bar">
                <div
                  class="progress"
                  [style.width.%]="getProgress(course.id)"
                ></div>
              </div>
              <span class="progress-label"
                >{{ getProgress(course.id) }}% Complete</span
              >
            </div>
          </div>
          <div class="grid-content">
            <h3 class="grid-title">{{ course.title }}</h3>
            <p class="grid-desc">{{ course.description }}</p>
            <div class="grid-meta">
              <span>{{ course.lesson_count }} lessons</span>
              <span *ngIf="getDuration(course)">{{
                getDuration(course)
              }}</span>
            </div>
            <div class="grid-tags">
              <span *ngFor="let tag of course.tags.slice(0, 3)">{{
                formatTag(tag)
              }}</span>
            </div>
            <div class="grid-footer">
              <div class="creator">
                <div class="avatar">{{ course.creator_name.charAt(0) }}</div>
                <span class="creator-name">{{ course.creator_name }}</span>
              </div>
              <button
                class="action-btn"
                (click)="handleActionClick($event, course)"
                [class.enrolled]="isEnrolled(course.id)"
              >
                {{ isEnrolled(course.id) ? 'Continue' : 'Enroll' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Courses List -->
      <div
        class="list"
        *ngIf="viewMode === 'list' && !loading && courses.length > 0"
      >
        <div class="course-item" *ngFor="let course of courses">
          <div class="item-main" (click)="toggleExpanded(course.id)">
            <div class="thumb">
              <span *ngIf="!course.thumbnail_url">{{
                getCourseIcon(course)
              }}</span>
              <img
                *ngIf="course.thumbnail_url"
                [src]="course.thumbnail_url"
                alt=""
              />
            </div>

            <div class="info">
              <div class="info-header">
                <h3 class="item-title">{{ course.title }}</h3>
                <span
                  class="completed"
                  *ngIf="
                    isEnrolled(course.id) && getProgress(course.id) === 100
                  "
                  >Completed</span
                >
              </div>
              <p class="item-desc">{{ course.description }}</p>

              <div class="meta">
                <span class="meta-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  {{ course.lesson_count }} lessons
                </span>
                <span class="meta-item" *ngIf="getDuration(course)">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ getDuration(course) }}
                </span>
                <span class="meta-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {{ course.enrolled_count }} enrolled
                </span>
                <span class="creator">by {{ course.creator_name }}</span>
              </div>

              <div *ngIf="isEnrolled(course.id)" class="progress-wrapper">
                <div class="progress-bar">
                  <div
                    class="progress"
                    [style.width.%]="getProgress(course.id)"
                  ></div>
                </div>
                <span class="progress-label"
                  >{{ getProgress(course.id) }}%</span
                >
              </div>
            </div>

            <button
              class="action-btn"
              (click)="handleActionClick($event, course)"
              [class.enrolled]="isEnrolled(course.id)"
            >
              {{ isEnrolled(course.id) ? 'Continue' : 'Start Learning' }}
            </button>
          </div>

          <div class="item-expanded" *ngIf="expandedId === course.id">
            <div class="expanded-content">
              <div class="lesson-overview">
                <h4>Lesson Overview</h4>
                <div
                  class="lesson"
                  *ngFor="let n of [1, 2, 3, 4]; let i = index"
                >
                  <div
                    class="lesson-number"
                    [class.done]="isEnrolled(course.id) && i < 2"
                  >
                    {{ isEnrolled(course.id) && i < 2 ? '✓' : i + 1 }}
                  </div>
                  <span [class.strike]="isEnrolled(course.id) && i < 2"
                    >Lesson {{ i + 1 }}</span
                  >
                </div>
              </div>
              <div class="learn-overview">
                <h4>What You'll Learn</h4>
                <ul>
                  <li>Core theological concepts</li>
                  <li>Historical context</li>
                  <li>Practical application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading and Empty States -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading courses...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && courses.length === 0">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3>No courses found</h3>
        <p>Try adjusting your search or filters</p>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="page-button"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          Previous
        </button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          class="page-button"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  enrolledCourses: Map<number, any> = new Map();
  loading = false;
  searchQuery = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];
  currentUser: User | null = null;

  currentPage = 1;
  totalPages = 1;
  perPage = 20;

  expandedId: number | null = null;
  viewMode: 'list' | 'grid' = 'list';

  constructor(
    private courseService: CourseService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadAvailableTags();
    this.loadCourses();

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
        courses.forEach((w) => {
          this.enrolledCourses.set(w.id, {
            progress: 0,
            completedLessons: 0,
          });
        });
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

  clearTags() {
    this.selectedTags = [];
    this.searchCourses();
  }

  formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTagsDisplay(tags: string[]): string {
    return tags
      .slice(0, 2)
      .map((tag) => this.formatTag(tag))
      .join(', ');
  }

  viewCourse(course: Course) {
    this.router.navigate(['/courses', course.id]);
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledCourses.has(courseId);
  }

  getProgress(courseId: number): number {
    return this.enrolledCourses.get(courseId)?.progress || 0;
  }

  getCompletedLessons(courseId: number): number {
    return this.enrolledCourses.get(courseId)?.completedLessons || 0;
  }

  getDuration(course: Course): string {
    const hours = Math.ceil(course.lesson_count * 0.5);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  getCourseIcon(course: Course): string {
    const icons = ['📖', '🙏', '✝️', '🕊️', '💫', '🌟'];
    return icons[course.id % icons.length];
  }

  handleActionClick(event: Event, course: Course) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isEnrolled(course.id)) {
      this.viewCourse(course);
    } else {
      const userId =
        typeof this.currentUser.id === 'string'
          ? parseInt(this.currentUser.id)
          : this.currentUser.id;

      this.courseService.enrollInCourse(course.id).subscribe({
        next: () => {
          this.enrolledCourses.set(course.id, {
            progress: 0,
            completedLessons: 0,
          });
          this.viewCourse(course);
        },
      });
    }
  }

  navigateToCreate() {
    this.router.navigate(['/courses/create']);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadCourses();
  }

  toggleExpanded(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode = mode;
  }
}
