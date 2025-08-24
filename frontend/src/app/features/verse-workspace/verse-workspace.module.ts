import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Main Component
import { VerseWorkspaceComponent } from './verse-workspace.component';

// Feature Modules
import { MemorizationModule } from './memorization/memorization.module';
import { SharedModule } from './shared/shared.module';

// NgRx
import { verseWorkspaceReducer } from './state/verse-workspace.reducer';
import { VerseWorkspaceEffects } from './state/verse-workspace.effects';

const routes: Routes = [
  {
    path: '',
    component: VerseWorkspaceComponent
  }
];

@NgModule({
  declarations: [
    VerseWorkspaceComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MemorizationModule,
    StoreModule.forFeature('verseWorkspace', verseWorkspaceReducer),
    EffectsModule.forFeature([VerseWorkspaceEffects])
  ]
})
export class VerseWorkspaceModule { }