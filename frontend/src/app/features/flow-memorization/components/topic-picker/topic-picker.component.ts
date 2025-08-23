import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { BibleService } from '@services/api/bible.service';

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
  verse_count: number;
  category?: string;
}

@Component({
  selector: 'app-topic-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topic-picker">
      <div class="topic-picker-header">
        <h3>Choose a Topic</h3>
        <p>Explore verses organized by biblical themes</p>
      </div>

      <div class="search-section">
        <input 
          type="text" 
          class="search-input"
          placeholder="Search topics..."
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
        />
      </div>

      <div class="topics-grid" *ngIf="!isLoading">
        <div 
          *ngFor="let topic of displayedTopics" 
          class="topic-card"
          (click)="selectTopic(topic)"
          [class.selected]="selectedTopicId === topic.topic_id"
        >
          <div class="topic-header">
            <h4>{{ topic.topic_name }}</h4>
            <span class="verse-count">{{ topic.verse_count }} verses</span>
          </div>
          <p class="topic-description" *ngIf="topic.description">
            {{ topic.description }}
          </p>
          <div class="topic-category" *ngIf="topic.category">
            <span class="category-tag">{{ topic.category }}</span>
          </div>
        </div>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading topics...</p>
      </div>

      <div class="empty-state" *ngIf="!isLoading && displayedTopics.length === 0">
        <p>No topics found</p>
      </div>
    </div>
  `,
  styleUrls: ['./topic-picker.component.scss']
})
export class TopicPickerComponent implements OnInit, OnDestroy {
  @Input() selectedTopicId: number | null = null;
  @Output() topicSelected = new EventEmitter<any>();

  topics: Topic[] = [];
  displayedTopics: Topic[] = [];
  searchQuery = '';
  isLoading = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private bibleService: BibleService) {}

  ngOnInit() {
    this.loadTopics();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterTopics(query);
    });
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  private filterTopics(query: string) {
    if (!query.trim()) {
      this.displayedTopics = this.topics;
    } else {
      const lowercaseQuery = query.toLowerCase();
      this.displayedTopics = this.topics.filter(topic =>
        topic.topic_name.toLowerCase().includes(lowercaseQuery) ||
        (topic.description && topic.description.toLowerCase().includes(lowercaseQuery)) ||
        (topic.category && topic.category.toLowerCase().includes(lowercaseQuery))
      );
    }
  }

  private loadTopics() {
    this.isLoading = true;
    
    this.bibleService.getTopics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (topics) => {
          this.topics = topics;
          this.displayedTopics = topics;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading topics:', error);
          this.isLoading = false;
        }
      });
  }

  selectTopic(topic: Topic) {
    this.selectedTopicId = topic.topic_id;
    this.topicSelected.emit({
      topicId: topic.topic_id,
      topicName: topic.topic_name,
      description: topic.description,
      verseCount: topic.verse_count,
      category: topic.category
    });
  }
}