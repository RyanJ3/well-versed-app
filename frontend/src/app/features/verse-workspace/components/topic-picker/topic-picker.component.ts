import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BibleService } from '@services/api/bible.service';

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
  verse_count: number;
  passage_count?: number;
  category?: string;
}

@Component({
  selector: 'app-topic-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topic-controls">
        <label class="topic-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Topic:
        </label>
        <div class="topic-dropdown">
          <div class="topic-input-wrapper">
            <input 
              type="text"
              class="topic-input"
              [(ngModel)]="searchText"
              (focus)="onFocus()"
              (blur)="onBlur()"
              (input)="onSearchInput()"
              [placeholder]="isLoading ? 'Loading topics...' : 'Search ' + topics.length + ' topics...'"
              [disabled]="isLoading"
            />
            <svg 
              *ngIf="selectedTopic" 
              class="clear-icon"
              (click)="clearSelection()"
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          
          <div class="topic-dropdown-menu" *ngIf="showDropdown">
            <div 
              *ngFor="let topic of filteredTopics" 
              class="topic-option"
              [class.selected]="topic.topic_id === selectedTopicId"
              (mousedown)="selectTopic(topic)"
            >
              <div class="topic-name">{{ topic.topic_name }}</div>
              <div class="topic-meta">
                <span class="topic-category" *ngIf="topic.category && topic.category !== 'General'">{{ topic.category }}</span>
                <span class="topic-verse-count">{{ topic.passage_count || topic.verse_count }} passages</span>
              </div>
            </div>
            <div class="no-results" *ngIf="searchText && filteredTopics.length === 0">
              No topics found
            </div>
          </div>
        </div>
        
        <div class="verse-count-badge" *ngIf="selectedTopic">
          {{ selectedTopic.passage_count || selectedTopic.verse_count }} passages
        </div>
      </div>
  `,
  styleUrls: ['./topic-picker.component.scss']
})
export class TopicPickerComponent implements OnInit, OnDestroy {
  @Input() selectedTopicId: number | null = null;
  @Output() topicSelected = new EventEmitter<any>();

  topics: Topic[] = [];
  filteredTopics: Topic[] = [];
  selectedTopic: Topic | null = null;
  searchText = '';
  showDropdown = false;
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(private bibleService: BibleService) {}

  ngOnInit() {
    this.loadTopics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFocus() {
    this.showDropdown = true;
    // Show all topics when focused if search is empty
    if (!this.searchText.trim()) {
      this.filteredTopics = [...this.topics];
    } else {
      this.filterTopics();
    }
  }

  onBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  onSearchInput() {
    this.showDropdown = true;
    this.filterTopics();
  }

  filterTopics() {
    if (!this.searchText.trim()) {
      // Show all topics when search is empty
      this.filteredTopics = [...this.topics];
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredTopics = this.topics.filter(topic => 
      topic.topic_name.toLowerCase().includes(searchLower) ||
      (topic.description && topic.description.toLowerCase().includes(searchLower)) ||
      (topic.category && topic.category.toLowerCase().includes(searchLower))
    );
    
    // Show dropdown if we have results
    if (this.filteredTopics.length > 0) {
      this.showDropdown = true;
    }
  }

  clearSelection() {
    this.selectedTopic = null;
    this.selectedTopicId = null;
    this.searchText = '';
    this.filteredTopics = [];
    this.topicSelected.emit(null);
  }

  private loadTopics() {
    this.isLoading = true;
    
    this.bibleService.getTopics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (topics) => {
          this.topics = topics;
          // Don't show any topics initially (until user focuses)
          this.filteredTopics = [];
          this.isLoading = false;
          
          // If there was a selected topic ID, find and set it
          if (this.selectedTopicId) {
            const topic = topics.find(t => t.topic_id === this.selectedTopicId);
            if (topic) {
              this.selectedTopic = topic;
              this.searchText = topic.topic_name;
            }
          }
        },
        error: (error) => {
          console.error('Error loading topics:', error);
          this.isLoading = false;
        }
      });
  }

  selectTopic(topic: Topic) {
    this.selectedTopic = topic;
    this.selectedTopicId = topic.topic_id;
    this.searchText = topic.topic_name;
    this.showDropdown = false;
    this.topicSelected.emit({
      topicId: topic.topic_id,
      topicName: topic.topic_name,
      description: topic.description,
      verseCount: topic.verse_count,
      category: topic.category
    });
  }
}