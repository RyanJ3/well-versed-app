import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { JourneyPanelComponent } from '../journey-panel/journey-panel.component';
import { MapViewComponent } from '../map-view/map-view.component';
import { MapControlsComponent } from '../map-controls/map-controls.component';
import { SegmentDetailsComponent } from '../segment-details/segment-details.component';
import { JourneyService } from '@services/journey.service';
import { JourneyStateService } from '@services/journey-state.service';
import { BiblicalJourney, JourneySegment, MapView, Testament } from '@models/journey.models';

@Component({
  selector: 'app-atlas-explorer',
  standalone: true,
  imports: [
    CommonModule,
    JourneyPanelComponent,
    MapViewComponent,
    MapControlsComponent,
    SegmentDetailsComponent
  ],
  templateUrl: './atlas-explorer.component.html',
  styleUrls: ['./atlas-explorer.component.scss']
})
export class AtlasExplorerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(MapViewComponent) mapViewComponent!: MapViewComponent;
  
  // Observables from services
  journeys$!: Observable<BiblicalJourney[]>;
  currentJourney$!: Observable<BiblicalJourney | null>;
  currentSegment$!: Observable<JourneySegment | null>;
  currentSegmentIndex$!: Observable<number>;
  totalSegments$!: Observable<number>;
  
  // Component state
  selectedTestament: Testament = 'Old Testament';
  currentView: MapView = '3d';
  segmentDetailsCollapsed = false;
  hoveredLocation: any = null;
  tooltipPosition = { x: 0, y: 0 };
  
  constructor(
    private journeyService: JourneyService,
    private journeyState: JourneyStateService
  ) {}
  
  ngOnInit() {
    // Initialize observables
    this.journeys$ = this.journeyState.filteredJourneys$;
    this.currentJourney$ = this.journeyState.currentJourney$;
    this.currentSegment$ = this.journeyState.currentSegment$;
    this.currentSegmentIndex$ = this.journeyState.currentSegmentIndex$;
    this.totalSegments$ = this.journeyState.totalSegments$;
    
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
  
  onJourneyChange(journeyId: number) {
    this.journeyState.selectJourney(journeyId);
  }
  
  onPreviousSegment() {
    this.journeyState.previousSegment();
  }
  
  onNextSegment() {
    this.journeyState.nextSegment();
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
}