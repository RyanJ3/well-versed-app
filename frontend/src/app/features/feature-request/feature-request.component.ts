// frontend/src/app/features/feature-request/feature-request.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { FeatureRequestService } from '@services/api/feature-request.service';
import { UserService } from '@services/api/user.service';
import { ModalService } from '@services/utils/modal.service';
import {
  FeatureRequest,
  CreateFeatureRequest,
  RequestType,
  RequestStatus
} from '@models/feature-request.model';
import { User } from '@models/user';

// Import new components
import { RequestStatsComponent } from './components/request-stats/request-stats.component';
import { RequestFiltersComponent } from './components/request-filters/request-filters.component';
import { RequestCardComponent } from './components/request-card/request-card.component';
import { RequestModalComponent } from './components/request-modal/request-modal.component';

@Component({
  selector: 'app-feature-request',
  templateUrl: './feature-request.component.html',
  styleUrls: ['./feature-request.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RequestStatsComponent,
    RequestFiltersComponent,
    RequestCardComponent,
    RequestModalComponent
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

  // Form data for modal
  newRequest: CreateFeatureRequest & { tags: string[] } = {
    title: '',
    description: '',
    type: RequestType.FEATURE,
    tags: []
  };

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
        this.stats.trending = Math.min(5, allRequests.length);
      }
    });
  }

  // Filter handlers
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRequests();
  }

  // Vote handlers
  onVote(request: FeatureRequest): void {
    if (!this.currentUser) {
      this.modalService.alert('Login Required', 'Please log in to vote on feature requests', 'info');
      return;
    }

    if (request.user_vote === 'up') {
      // Remove vote
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
    } else {
      // Add vote
      this.featureRequestService.voteOnRequest(request.id, 'up', this.currentUser.id as number).subscribe({
        next: () => {
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

  onDownvote(request: FeatureRequest): void {
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

  // Modal handlers
  openCreateModal(): void {
    if (!this.currentUser) {
      this.modalService.alert('Login Required', 'Please log in to create feature requests', 'info');
      return;
    }

    this.showCreateModal = true;
    this.isEditing = false;
    this.resetForm();
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newRequest = {
      title: '',
      description: '',
      type: RequestType.FEATURE,
      tags: []
    };
  }

  submitRequest(request: CreateFeatureRequest & { tags: string[] }): void {
    if (!this.currentUser) return;

    this.featureRequestService.createFeatureRequest(
      request, 
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

  viewRequestDetails(request: FeatureRequest): void {
    // In a full implementation, this would navigate to a detail page
    this.modalService.alert(
      request.title,
      `${request.description}\n\nVotes: ${request.upvotes}\nStatus: ${request.status}`,
      'info'
    );
  }

  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRequests();
    }
  }
}
