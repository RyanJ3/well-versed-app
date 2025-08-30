import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkspaceState, WorkspaceViewSettings } from '../../models/workspace.models';

@Injectable()
export class WorkspaceStateService {
  private readonly LOCAL_KEY = 'flowState';
  private readonly isBrowser = typeof window !== 'undefined';
  
  private stateSubject = new BehaviorSubject<WorkspaceState>(this.getDefaultState());
  state$ = this.stateSubject.asObservable();
  
  private viewSettingsSubject = new BehaviorSubject<WorkspaceViewSettings>(this.getDefaultViewSettings());
  viewSettings$ = this.viewSettingsSubject.asObservable();

  constructor() {
    this.loadSavedState();
  }

  private getDefaultState(): WorkspaceState {
    return {
      layoutMode: 'grid',
      isTextMode: false,
      highlightFifthVerse: true,
      showVerseNumbers: true,
      fontSize: 16
    };
  }

  private getDefaultViewSettings(): WorkspaceViewSettings {
    const state = this.stateSubject.value;
    return {
      layoutMode: state.layoutMode,
      isTextMode: state.isTextMode,
      highlightFifthVerse: state.highlightFifthVerse,
      showVerseNumbers: state.showVerseNumbers,
      fontSize: state.fontSize
    };
  }

  updateViewSettings(settings: Partial<WorkspaceViewSettings>) {
    const current = this.viewSettingsSubject.value;
    const updated = { ...current, ...settings };
    this.viewSettingsSubject.next(updated);
    
    const state = this.stateSubject.value;
    this.stateSubject.next({ ...state, ...settings });
    this.saveState();
  }

  updateState(state: Partial<WorkspaceState>) {
    const current = this.stateSubject.value;
    const updated = { ...current, ...state };
    this.stateSubject.next(updated);
    this.saveState();
  }

  saveState() {
    if (!this.isBrowser) return;
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.stateSubject.value));
  }

  private loadSavedState() {
    if (!this.isBrowser) return;
    const raw = localStorage.getItem(this.LOCAL_KEY);
    if (!raw) return;
    
    try {
      const state = JSON.parse(raw);
      this.stateSubject.next({ ...this.getDefaultState(), ...state });
      this.viewSettingsSubject.next(this.getDefaultViewSettings());
    } catch {}
  }

  getState(): WorkspaceState {
    return this.stateSubject.value;
  }

  getViewSettings(): WorkspaceViewSettings {
    return this.viewSettingsSubject.value;
  }
}
