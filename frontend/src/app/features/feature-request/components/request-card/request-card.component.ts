import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureRequest, RequestType, RequestStatus } from '../../../../core/models/feature-request.model';
import { User } from '../../../../core/models/user';

@Component({
  selector: 'app-request-card',
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class RequestCardComponent {
  @Input() request!: FeatureRequest;
  @Input() currentUser: User | null = null;
  
  @Output() voteClick = new EventEmitter<FeatureRequest>();
  @Output() downvoteClick = new EventEmitter<FeatureRequest>();
  @Output() viewDetails = new EventEmitter<FeatureRequest>();

  onVote(): void {
    this.voteClick.emit(this.request);
  }

  onDownvote(): void {
    this.downvoteClick.emit(this.request);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.request);
  }

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
