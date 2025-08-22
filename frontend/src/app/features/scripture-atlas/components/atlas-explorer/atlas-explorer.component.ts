import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AtlasHeaderComponent } from '../atlas-header/atlas-header.component';
import { JourneyPanelComponent } from '../journey-panel/journey-panel.component';
import { MapViewComponent } from '../map-view/map-view.component';
import { FabNavigationComponent } from '../fab-navigation/fab-navigation.component';
import { SegmentDetailsComponent } from '../segment-details/segment-details.component';
import { KeyboardHelpDialogComponent } from '../keyboard-help-dialog/keyboard-help-dialog.component';
import { JourneyService } from '../../services/journey.service';
import { JourneyStateService } from '../../services/journey-state.service';
import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';
import { BiblicalJourney, JourneySegment, MapView, Testament } from '../../models/journey.models';

@Component({
  selector: 'app-atlas-explorer',
  standalone: true,
  imports: [
    CommonModule,
    AtlasHeaderComponent,
    JourneyPanelComponent,
    MapViewComponent,
    FabNavigationComponent,
    SegmentDetailsComponent,
    KeyboardHelpDialogComponent
  ],
  templateUrl: './atlas-explorer.component.html',
  styleUrls: ['./atlas-explorer.component.scss']
})
export class AtlasExplorerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(MapViewComponent) mapViewComponent!: MapViewComponent;
  @ViewChild('journeyPanel') journeyPanel!: JourneyPanelComponent;
  
  // Observables from services
  journeys$!: Observable<BiblicalJourney[]>;
  currentJourney$!: Observable<BiblicalJourney | null>;
  currentSegment$!: Observable<JourneySegment | null>;
  currentSegmentIndex$!: Observable<number>;
  totalSegments$!: Observable<number>;
  
  // Component state
  selectedTestament: Testament = 'Old Testament';
  currentView: MapView = '3d';
  segmentDetailsCollapsed = true; // Start in peek mode (true = peek, false = expanded)
  headerCollapsed = false;
  showKeyboardHelp = false;
  hoveredLocation: any = null;
  tooltipPosition = { x: 0, y: 0 };
  
  constructor(
    private journeyService: JourneyService,
    private journeyState: JourneyStateService,
    private keyboardNav: KeyboardNavigationService
  ) {}
  
  ngOnInit() {
    // Initialize observables
    this.journeys$ = this.journeyState.filteredJourneys$;
    this.currentJourney$ = this.journeyState.currentJourney$;
    this.currentSegment$ = this.journeyState.currentSegment$;
    this.currentSegmentIndex$ = this.journeyState.currentSegmentIndex$;
    this.totalSegments$ = this.journeyState.totalSegments$;
    
    // Register keyboard shortcuts
    this.registerKeyboardShortcuts();
    
    // Load initial data
    this.loadJourneys();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadJourneys() {
    this.journeyService.getJourneys()
      .pipe(takeUntil(this.destroy$))
      .subscribe(journeys => {
        this.journeyState.setJourneys(journeys);
        
        // Select first journey of selected testament
        const firstJourney = journeys.find(j => j.testament === this.selectedTestament);
        if (firstJourney) {
          this.journeyState.selectJourney(firstJourney.journey_id);
        }
      });
  }
  
  onTestamentChange(testament: Testament) {
    this.selectedTestament = testament;
    this.journeyState.filterByTestament(testament);
    
    // Auto-select first journey of the new testament
    this.journeyState.filteredJourneys$
      .pipe(takeUntil(this.destroy$))
      .subscribe(journeys => {
        if (journeys.length > 0) {
          this.journeyState.selectJourney(journeys[0].journey_id);
        }
      });
  }
  
  onJourneyChange(journeyId: string | number) {
    const id = typeof journeyId === 'string' ? parseInt(journeyId) : journeyId;
    if (!isNaN(id)) {
      this.journeyState.selectJourney(id);
      // Auto-close the journey panel on selection
      if (this.journeyPanel) {
        this.journeyPanel.collapsed = true;
      }
      // When changing journeys, open details panel to show first segment
      this.segmentDetailsCollapsed = window.innerWidth <= 768 ? false : true; // Peek on desktop, expanded on mobile
    }
  }
  
  onPreviousSegment() {
    this.journeyState.previousSegment();
    // Keep details panel open when navigating
    // No need to change segmentDetailsCollapsed state
  }
  
  onNextSegment() {
    this.journeyState.nextSegment();
    // Keep details panel open when navigating
    // No need to change segmentDetailsCollapsed state
  }
  
  onViewChange(view: MapView) {
    this.currentView = view;
  }
  
  onLocationHover(event: { location: any; position: { x: number; y: number } } | null) {
    if (event) {
      this.hoveredLocation = event.location;
      this.tooltipPosition = event.position;
    } else {
      this.hoveredLocation = null;
    }
  }

  
  onResetView() {
    // Reset to show entire journey using the map component
    if (this.mapViewComponent) {
      this.mapViewComponent.fitMapToBounds();
    }
  }
  
  toggleJourneyPanel() {
    if (this.journeyPanel) {
      this.journeyPanel.collapsed = !this.journeyPanel.collapsed;
    }
  }
  
  toggleSegmentDetails() {
    this.segmentDetailsCollapsed = !this.segmentDetailsCollapsed;
    // User explicitly toggled, so respect their choice even during navigation
  }
  
  toggleKeyboardHelp() {
    this.showKeyboardHelp = !this.showKeyboardHelp;
  }
  
  closeKeyboardHelp() {
    this.showKeyboardHelp = false;
  }
  
  private registerKeyboardShortcuts() {
    this.keyboardNav.registerAtlasShortcuts({
      toggleJourneyPanel: () => this.toggleJourneyPanel(),
      toggleSegmentDetails: () => this.toggleSegmentDetails(),
      nextSegment: () => this.onNextSegment(),
      previousSegment: () => this.onPreviousSegment(),
      resetView: () => this.onResetView(),
      changeView: (view: string) => this.onViewChange(view as MapView),
      showHelp: () => this.toggleKeyboardHelp()
    });
  }
}