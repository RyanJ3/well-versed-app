import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

// Main Modal Component
import { MemorizationModalComponent } from './memorization-modal.component';

// Stage Components
import { SetupStageComponent } from './stages/setup-stage.component';
import { PracticeStageComponent } from './stages/practice-stage.component';
import { CompletionStageComponent } from './stages/completion-stage.component';

// Shared Modal Components
import { NavigationControlsComponent } from './components/navigation-controls.component';
import { ProgressJourneyComponent } from './components/progress-journey.component';
import { SettingsMenuComponent } from './components/settings-menu.component';
import { VerseBubblesComponent } from './components/verse-bubbles.component';
import { ConfirmationModalComponent } from './components/confirmation-modal.component';

@NgModule({
  declarations: [
    MemorizationModalComponent,
    // Stages
    SetupStageComponent,
    PracticeStageComponent,
    CompletionStageComponent,
    // Shared Components
    NavigationControlsComponent,
    ProgressJourneyComponent,
    SettingsMenuComponent,
    VerseBubblesComponent,
    ConfirmationModalComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    MemorizationModalComponent
  ]
})
export class MemorizationModule { }