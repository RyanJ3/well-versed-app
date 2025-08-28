import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Component imports
import { FloatingCardComponent, FloatingCard } from './components/floating-card/floating-card.component';
import { ProgressRingComponent, ProgressRing } from './components/progress-ring/progress-ring.component';
import { ProgressBarComponent, ProgressBar } from './components/progress-bar/progress-bar.component';
import { VerseSnippetComponent, VerseSnippet } from './components/verse-snippet/verse-snippet.component';
import { BiblicalTextComponent, BiblicalText } from './components/biblical-text/biblical-text.component';
import { MapContainerComponent, MapContainer } from './components/map-container/map-container.component';

// Services
import { BackgroundStateService } from './services/background-state.service';
import { GridPositionService } from './services/grid-position.service';
import { ContentSelectorService } from './services/content-selector.service';
import { AnimationManagerService } from './services/animation-manager.service';
import { ElementFactoryService } from './services/element-factory.service';

/**
 * Login Background Component
 * 
 * Creates an animated biblical-themed background for authentication pages.
 * Features floating scripture cards, progress indicators, verse snippets,
 * biblical text in original languages, and an interactive map.
 */
@Component({
  selector: 'app-login-background',
  standalone: true,
  imports: [
    CommonModule,
    FloatingCardComponent,
    ProgressRingComponent,
    ProgressBarComponent,
    VerseSnippetComponent,
    BiblicalTextComponent,
    MapContainerComponent
  ],
  templateUrl: './login-background.component.html',
  styleUrls: ['./login-background.component.scss']
})
export class LoginBackgroundComponent implements OnInit, OnDestroy {
  // Public properties bound to template
  floatingCards: FloatingCard[] = [];
  progressRings: ProgressRing[] = [];
  progressBars: ProgressBar[] = [];
  verseSnippets: VerseSnippet[] = [];
  biblicalTexts: BiblicalText[] = [];
  mapContainers: MapContainer[] = [];

  constructor(
    private router: Router,
    private backgroundState: BackgroundStateService,
    private gridService: GridPositionService,
    private contentService: ContentSelectorService,
    private animationService: AnimationManagerService,
    private elementFactory: ElementFactoryService
  ) {}

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  
  ngOnInit(): void {
    // Check if we're navigating within auth pages
    const currentUrl = this.router.url;
    const isAuthPage = currentUrl.includes('/login') || currentUrl.includes('/register');
    
    if (this.backgroundState.isInitialized && isAuthPage) {
      // Simply restore state without re-creating animations
      this.restoreExistingState();
    } else {
      this.initializeNewBackground();
    }
  }

  ngOnDestroy(): void {
    this.handleComponentDestruction();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeNewBackground(): void {
    this.gridService.initializeGrid();
    this.createAllElements();
    this.startAllAnimations();
    this.saveState();
  }

  private restoreExistingState(): void {
    this.floatingCards = this.backgroundState.floatingCards;
    this.progressRings = this.backgroundState.progressRings;
    this.progressBars = this.backgroundState.progressBars;
    this.verseSnippets = this.backgroundState.verseSnippets;
    this.biblicalTexts = this.backgroundState.biblicalTexts;
    this.mapContainers = this.backgroundState.mapContainers;
  }

  // ============================================================================
  // Element Creation
  // ============================================================================

  private createAllElements(): void {
    const distribution = this.elementFactory.DEFAULT_DISTRIBUTION;
    const getPosition = () => this.gridService.getRandomPosition();

    // Create each element type
    this.floatingCards = this.elementFactory.createFloatingCards(
      this.contentService.getRandomVerses(distribution.floatingCards),
      getPosition
    );

    this.progressRings = this.elementFactory.createProgressRings(
      distribution.progressRings,
      getPosition
    );

    this.progressBars = this.elementFactory.createProgressBars(
      distribution.progressBars,
      getPosition
    );

    this.verseSnippets = this.elementFactory.createVerseSnippets(
      this.contentService.getRandomSnippets(distribution.verseSnippets),
      getPosition
    );

    this.biblicalTexts = this.elementFactory.createBiblicalTexts(
      this.contentService.getRandomBiblicalWords(distribution.biblicalTexts),
      getPosition
    );

    this.mapContainers = this.elementFactory.createMapContainers(
      distribution.mapContainers,
      getPosition
    );
  }

  // ============================================================================
  // Animation Management
  // ============================================================================

  private startAllAnimations(): void {
    // Only clear intervals if starting fresh animations
    if (!this.backgroundState.isInitialized) {
      this.animationService.clearAllIntervals();
    }

    // Start animations for each element type with staggered delays
    this.animationService.startElementFadeCycle(
      this.floatingCards,
      (element) => this.relocateCard(element),
      0
    );

    this.animationService.startElementFadeCycle(
      this.progressRings,
      (element) => this.relocateProgressRing(element),
      1000
    );

    this.animationService.startElementFadeCycle(
      this.progressBars,
      (element) => this.relocateProgressBar(element),
      2000
    );

    this.animationService.startElementFadeCycle(
      this.verseSnippets,
      (element) => this.relocateSnippet(element),
      500
    );

    this.animationService.startElementFadeCycle(
      this.biblicalTexts,
      (element) => this.relocateBiblicalText(element),
      1500
    );

    this.animationService.startElementFadeCycle(
      this.mapContainers,
      (element) => this.relocateMap(element),
      3000
    );
  }

  // ============================================================================
  // Relocation Handlers
  // ============================================================================

  private relocateCard(card: FloatingCard): void {
    const newPos = this.gridService.getRandomPosition();
    const newVerse = this.contentService.refreshVerseContent();
    
    card.x = newPos.x;
    card.y = newPos.y;
    card.verse = newVerse.verse;
    card.reference = newVerse.reference;
    
    this.elementFactory.resetElementState(card);
  }

  private relocateProgressRing(ring: ProgressRing): void {
    const newPos = this.gridService.getRandomPosition();
    ring.x = newPos.x;
    ring.y = newPos.y;
    this.elementFactory.resetElementState(ring);
  }

  private relocateProgressBar(bar: ProgressBar): void {
    const newPos = this.gridService.getRandomPosition();
    bar.x = newPos.x;
    bar.y = newPos.y;
    this.elementFactory.resetElementState(bar);
  }

  private relocateSnippet(snippet: VerseSnippet): void {
    const newPos = this.gridService.getRandomPosition();
    snippet.x = newPos.x;
    snippet.y = newPos.y;
    snippet.text = this.contentService.refreshSnippet();
    this.elementFactory.resetElementState(snippet);
  }

  private relocateBiblicalText(text: BiblicalText): void {
    const newPos = this.gridService.getRandomPosition();
    const newWord = this.contentService.refreshBiblicalWord();
    
    text.x = newPos.x;
    text.y = newPos.y;
    text.text = newWord.text;
    text.translation = newWord.translation;
    text.language = newWord.language;
    
    this.elementFactory.resetElementState(text);
  }

  private relocateMap(map: MapContainer): void {
    const newPos = this.gridService.getRandomPosition();
    map.x = newPos.x;
    map.y = newPos.y;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  private saveState(): void {
    this.backgroundState.floatingCards = this.floatingCards;
    this.backgroundState.progressRings = this.progressRings;
    this.backgroundState.progressBars = this.progressBars;
    this.backgroundState.verseSnippets = this.verseSnippets;
    this.backgroundState.biblicalTexts = this.biblicalTexts;
    this.backgroundState.mapContainers = this.mapContainers;
    this.backgroundState.gridPositions = this.gridService.getGridPositions();
    this.backgroundState.animationIntervals = this.animationService.getAnimationIntervals();
    this.backgroundState.fadeIntervals = this.animationService.getFadeIntervals();
    this.backgroundState.isInitialized = true;
  }

  private handleComponentDestruction(): void {
    // Check if leaving auth pages after navigation completes
    setTimeout(() => {
      const currentUrl = this.router.url;
      const isLeavingAuth = !currentUrl.includes('/login') && !currentUrl.includes('/register');
      
      if (isLeavingAuth) {
        this.backgroundState.reset();
        this.gridService.reset();
        this.animationService.clearAllIntervals();
      }
    }, 0);
  }

  // ============================================================================
  // Public Template Methods
  // ============================================================================

  toggleCard(card: FloatingCard): void {
    card.isFlipped = !card.isFlipped;
  }
}