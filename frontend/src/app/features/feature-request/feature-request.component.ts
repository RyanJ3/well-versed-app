// frontend/src/app/features/feature-request/feature-request.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { FeatureRequestService } from '../../core/services/feature-request.service';
import { UserService } from '../../core/services/user.service';
import { ModalService } from '../../core/services/modal.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { 
  FeatureRequest, 
  CreateFeatureRequest, 
  RequestType, 
  RequestStatus 
} from '../../core/models/feature-request.model';
import { User } from '../../core/models/user';

@Component({
  selector: 'app-feature-request',
  templateUrl: './feature-request.component.html',
  styleUrls: ['./feature-request.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent
  ]
})
export class FeatureRequestComponent implements OnInit, OnDestroy {
  // Component state
  isLoading = true;
  showCreateModal = false;
  isEditing = false;
  currentUser: User | null = null;

  // Request data
  requests: FeatureRequest[] = [];
  totalRequests = 0;
  currentPage = 1;
  perPage = 10;
  totalPages = 1;

  // Filters
  selectedType: string = '';
  selectedStatus: string = '';
  sortBy: string = 'upvotes';
  searchQuery: string = '';

  // Stats
  stats = {
    openBugs: 0,
    totalRequests: 0,
    completed: 0,
    trending: 0
  };

  // Form data with guaranteed tags array
  newRequest: CreateFeatureRequest & { tags: string[] } = {
    title: '',
    description: '',
    type: RequestType.FEATURE,
    tags: [] // Always initialized
  };
  tagInput: string = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private featureRequestService: FeatureRequestService,
    private userService: UserService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.userService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Set up search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadRequests();
    });

    // Listen for updates
    this.featureRequestService.requestsUpdated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      if (updated) {
        this.loadRequests();
      }
    });

    // Initial load
    this.loadRequests();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRequests(): void {
    this.isLoading = true;

    const type = this.selectedType as RequestType || undefined;
    const status = this.selectedStatus as RequestStatus || undefined;

    this.featureRequestService.getFeatureRequests(
      this.currentPage,
      this.perPage,
      type,
      status,
      this.sortBy,
      this.searchQuery
    ).subscribe({
      next: (response) => {
        this.requests = response.requests;
        this.totalRequests = response.total;
        this.totalPages = Math.ceil(response.total / this.perPage);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.isLoading = false;
        this.modalService.alert('Error', 'Failed to load feature requests', 'danger');
      }
    });
  }

  loadStats(): void {
    // In a real app, this would be a separate API call
    // For now, we'll calculate from loaded data
    this.featureRequestService.getFeatureRequests(1, 1000).subscribe({
      next: (response) => {
        const allRequests = response.requests;
        this.stats.totalRequests = response.total;
        this.stats.openBugs = allRequests.filter(r => 
          r.type === RequestType.BUG && r.status === RequestStatus.OPEN
        ).length;
        this.stats.completed = allRequests.filter(r => 
          r.status === RequestStatus.COMPLETED
        ).length;
        // Trending would be calculated server-side based on recent upvotes
        this.stats.trending = Math.min(5, allRequests.length);
      }
    });
  }

  vote(request: FeatureRequest): void {
    if (!this.currentUser) {
      this.modalService.alert('Login Required', 'Please log in to vote on feature requests', 'info');
      return;
    }

    if (request.user_vote === 'up') {
      // Remove vote
      this.featureRequestService.removeVote(request.id, this.currentUser.id as number).subscribe({
        next: () => {
          // Update local state
          request.upvotes--;
          request.user_vote = null;
          request.has_voted = false;
        },
        error: (error) => {
          console.error('Error removing vote:', error);
          this.modalService.alert('Error', 'Failed to remove vote', 'danger');
        }
      });
    } else {
      // Add or change vote
      this.featureRequestService.voteOnRequest(request.id, 'up', this.currentUser.id as number).subscribe({
        next: () => {
          // Update local state
          if (request.user_vote === 'up') {
            request.upvotes--;
          }
          request.upvotes++;

          request.user_vote = 'up';
          request.has_voted = true;
        },
        error: (error) => {
          console.error('Error voting:', error);
          this.modalService.alert('Error', 'Failed to submit vote', 'danger');
        }
      });
    }
  }

  downvote(request: FeatureRequest): void {
    if (!this.currentUser || request.user_vote !== 'up') return;

    this.featureRequestService.removeVote(request.id, this.currentUser.id as number).subscribe({
      next: () => {
        request.upvotes--;
        request.user_vote = null;
        request.has_voted = false;
      },
      error: (error) => {
        console.error('Error removing vote:', error);
        this.modalService.alert('Error', 'Failed to remove vote', 'danger');
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRequests();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRequests();
    }
  }

  openCreateModal(): void {
    if (!this.currentUser) {
      this.modalService.alert('Login Required', 'Please log in to create feature requests', 'info');
      return;
    }

    this.showCreateModal = true;
    this.isEditing = false;
    this.resetForm();
  }

  closeModal(event?: MouseEvent): void {
    if (!event || event.target === event.currentTarget) {
      this.showCreateModal = false;
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newRequest = {
      title: '',
      description: '',
      type: RequestType.FEATURE,
      tags: [] // Always initialize tags array
    };
    this.tagInput = '';
  }

  submitRequest(): void {
    if (!this.isFormValid() || !this.currentUser) return;

    this.featureRequestService.createFeatureRequest(
      this.newRequest, 
      this.currentUser.id as number
    ).subscribe({
      next: (created) => {
        this.modalService.success('Success', 'Your request has been submitted successfully!');
        this.closeModal();
        this.loadRequests();
      },
      error: (error) => {
        console.error('Error creating request:', error);
        this.modalService.alert('Error', 'Failed to submit request. Please try again.', 'danger');
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newRequest.title?.trim() &&
      this.newRequest.description?.trim() &&
      this.newRequest.type
    );
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.tagInput.trim().toLowerCase();
    
    if (tag && !this.newRequest.tags.includes(tag) && this.newRequest.tags.length < 5) {
      this.newRequest.tags.push(tag);
      this.tagInput = '';
    }
  }

  removeTag(index: number): void {
    this.newRequest.tags.splice(index, 1);
  }

  addSuggestedTag(tag: string): void {
    if (!this.newRequest.tags.includes(tag) && this.newRequest.tags.length < 5) {
      this.newRequest.tags.push(tag);
    }
  }

  getSuggestedTags(): string[] {
    return this.featureRequestService.getSuggestedTags()
      .filter(tag => !this.newRequest.tags.includes(tag))
      .slice(0, 8);
  }

  viewDetails(request: FeatureRequest): void {
    // In a full implementation, this would navigate to a detail page
    // For now, we'll just show an alert
    this.modalService.alert(
      request.title,
      `${request.description}\n\nVotes: ${request.upvotes - request.downvotes}\nStatus: ${this.formatStatus(request.status)}`,
      'info'
    );
  }

  // Formatting helpers
  formatType(type: RequestType): string {
    const typeMap = {
      [RequestType.BUG]: 'Bug',
      [RequestType.ENHANCEMENT]: 'Enhancement',
      [RequestType.FEATURE]: 'Feature'
    };
    return typeMap[type] || type;
  }

  formatStatus(status: RequestStatus): string {
    const statusMap = {
      [RequestStatus.OPEN]: 'Open',
      [RequestStatus.IN_PROGRESS]: 'In Progress',
      [RequestStatus.COMPLETED]: 'Completed',
      [RequestStatus.CLOSED]: 'Closed',
      [RequestStatus.DUPLICATE]: 'Duplicate'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  }
}