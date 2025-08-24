import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Renamed Components (from flow-* to workspace-*)
import { WorkspaceHeaderComponent } from '../components/workspace-header/workspace-header.component';
import { WorkspaceFiltersComponent } from '../components/workspace-filters/workspace-filters.component';
import { WorkspaceContextMenuComponent } from '../components/workspace-context-menu/workspace-context-menu.component';
import { ChapterNavigationComponent } from '../components/chapter-navigation/chapter-navigation.component';
import { TopicPickerComponent } from '../components/topic-picker/topic-picker.component';
import { VerseCardComponent } from '../components/verse-card/verse-card.component';
import { VerseGridComponent } from '../components/verse-grid/verse-grid.component';

// Directives
import { VirtualScrollDirective } from '../directives/virtual-scroll.directive';

const SHARED_COMPONENTS = [
  WorkspaceHeaderComponent,
  WorkspaceFiltersComponent,
  WorkspaceContextMenuComponent,
  ChapterNavigationComponent,
  TopicPickerComponent,
  VerseCardComponent,
  VerseGridComponent
];

const SHARED_DIRECTIVES = [
  VirtualScrollDirective
];

@NgModule({
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_DIRECTIVES
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ...SHARED_COMPONENTS,
    ...SHARED_DIRECTIVES,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }