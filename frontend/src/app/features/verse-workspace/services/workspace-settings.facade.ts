import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkspaceUIStateService } from './workspace-ui-state.service';

@Injectable()
export class WorkspaceSettingsFacade {
  constructor(private uiStateService: WorkspaceUIStateService) {}

  get showFullText$(): Observable<boolean> {
    return this.uiStateService.state$.pipe(map(state => state.showFullText));
  }

  get fontSize$(): Observable<number> {
    return this.uiStateService.state$.pipe(map(state => state.fontSize));
  }

  get layoutMode$(): Observable<'grid' | 'single'> {
    return this.uiStateService.state$.pipe(map(state => state.layoutMode));
  }

  get activeFilter$(): Observable<'all' | 'unmemorized' | 'needsReview'> {
    return this.uiStateService.state$.pipe(map(state => state.activeFilter as 'all' | 'unmemorized' | 'needsReview'));
  }

  get showSettings$(): Observable<boolean> {
    return this.uiStateService.state$.pipe(map(state => state.showSettings));
  }

  get isGearSpinning$(): Observable<boolean> {
    return this.uiStateService.state$.pipe(map(state => state.isGearSpinning));
  }

  get showEncouragement$(): Observable<string> {
    return this.uiStateService.state$.pipe(map(state => state.showEncouragement));
  }

  get isLoading$(): Observable<boolean> {
    return this.uiStateService.state$.pipe(map(state => state.isLoading));
  }

  get showFullText(): boolean {
    return this.uiStateService.currentState.showFullText;
  }

  get fontSize(): number {
    return this.uiStateService.currentState.fontSize;
  }

  get layoutMode(): 'grid' | 'single' {
    return this.uiStateService.currentState.layoutMode;
  }

  get activeFilter(): 'all' | 'unmemorized' | 'needsReview' {
    return this.uiStateService.currentState.activeFilter as 'all' | 'unmemorized' | 'needsReview';
  }

  get showSettings(): boolean {
    return this.uiStateService.currentState.showSettings;
  }

  get isGearSpinning(): boolean {
    return this.uiStateService.currentState.isGearSpinning;
  }

  get showEncouragement(): string {
    return this.uiStateService.currentState.showEncouragement;
  }

  get isLoading(): boolean {
    return this.uiStateService.currentState.isLoading;
  }

  toggleSettings(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.uiStateService.toggleSettings();
  }

  closeSettings() {
    this.uiStateService.closeSettings();
  }

  increaseFontSize() {
    this.uiStateService.increaseFontSize();
  }

  decreaseFontSize() {
    this.uiStateService.decreaseFontSize();
  }

  setLayoutMode(mode: 'grid' | 'single') {
    this.uiStateService.setLayoutMode(mode);
  }

  toggleTextMode() {
    this.uiStateService.toggleTextMode();
  }

  setActiveFilter(filter: 'all' | 'unmemorized' | 'needsReview') {
    this.uiStateService.setActiveFilter(filter);
  }

  showEncouragementMessage(message: string, duration: number = 3000) {
    this.uiStateService.showEncouragement(message, duration);
  }

  setLoading(loading: boolean) {
    this.uiStateService.setLoading(loading);
  }
}