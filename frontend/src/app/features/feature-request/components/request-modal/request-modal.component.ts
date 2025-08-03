import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateFeatureRequest, RequestType } from '@models/feature-request.model';
import { FeatureRequestService } from '@services/api/feature-request.service';

@Component({
  selector: 'app-request-modal',
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RequestModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() request: CreateFeatureRequest & { tags: string[] } = {
    title: '',
    description: '',
    type: RequestType.FEATURE,
    tags: []
  };
  
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<CreateFeatureRequest & { tags: string[] }>();

  tagInput: string = '';

  constructor(private featureRequestService: FeatureRequestService) {}

  ngOnInit(): void {
    if (!this.request.tags) {
      this.request.tags = [];
    }
  }

  onClose(event?: MouseEvent): void {
    if (!event || event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.submit.emit(this.request);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.request.title?.trim() &&
      this.request.description?.trim() &&
      this.request.type
    );
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.tagInput.trim().toLowerCase();
    
    if (tag && !this.request.tags.includes(tag) && this.request.tags.length < 5) {
      this.request.tags.push(tag);
      this.tagInput = '';
    }
  }

  removeTag(index: number): void {
    this.request.tags.splice(index, 1);
  }

  addSuggestedTag(tag: string): void {
    if (!this.request.tags.includes(tag) && this.request.tags.length < 5) {
      this.request.tags.push(tag);
    }
  }

  getSuggestedTags(): string[] {
    return this.featureRequestService.getSuggestedTags()
      .filter(tag => !this.request.tags.includes(tag))
      .slice(0, 8);
  }
}
