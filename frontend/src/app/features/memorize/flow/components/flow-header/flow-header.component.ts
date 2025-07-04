import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-flow-header',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './flow-header.component.html',
  styleUrls: ['./flow-header.component.scss']
})
export class FlowHeaderComponent {}
