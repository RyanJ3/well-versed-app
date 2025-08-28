import { Injectable } from '@angular/core';
import { FloatingCard } from '../components/floating-card/floating-card.component';
import { ProgressRing } from '../components/progress-ring/progress-ring.component';
import { ProgressBar } from '../components/progress-bar/progress-bar.component';
import { VerseSnippet } from '../components/verse-snippet/verse-snippet.component';
import { BiblicalText } from '../components/biblical-text/biblical-text.component';
import { MapContainer } from '../components/map-container/map-container.component';

@Injectable({
  providedIn: 'root'
})
export class BackgroundStateService {
  // State for all elements
  floatingCards: FloatingCard[] = [];
  progressRings: ProgressRing[] = [];
  progressBars: ProgressBar[] = [];
  verseSnippets: VerseSnippet[] = [];
  biblicalTexts: BiblicalText[] = [];
  mapContainers: MapContainer[] = [];
  
  // Track initialization
  isInitialized = false;
  
  // Grid positions
  gridPositions: { x: number; y: number; occupied: boolean }[] = [];
  
  // Animation intervals to manage
  animationIntervals: any[] = [];
  fadeIntervals: any[] = [];
  
  constructor() {}
  
  reset() {
    // Clear all intervals
    this.animationIntervals.forEach(interval => clearInterval(interval));
    this.fadeIntervals.forEach(interval => clearInterval(interval));
    this.animationIntervals = [];
    this.fadeIntervals = [];
    
    // Reset initialization flag
    this.isInitialized = false;
    
    // Clear elements
    this.floatingCards = [];
    this.progressRings = [];
    this.progressBars = [];
    this.verseSnippets = [];
    this.biblicalTexts = [];
    this.mapContainers = [];
    this.gridPositions = [];
  }
  
  clearIntervals() {
    this.animationIntervals.forEach(interval => clearInterval(interval));
    this.fadeIntervals.forEach(interval => clearInterval(interval));
    this.animationIntervals = [];
    this.fadeIntervals = [];
  }
}