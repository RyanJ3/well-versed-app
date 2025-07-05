import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BiblicalJourney, JourneyWaypoint, MapView } from '../../models/journey.models';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() journey: BiblicalJourney | null = null;
  @Input() currentSegmentIndex: number = 0;
  @Input() mapView: MapView = '3d';
  
  @Output() locationHover = new EventEmitter<{ location: JourneyWaypoint; position: { x: number; y: number } } | null>();
  
  private map: any;
  private mapboxgl: any;
  private markers: any[] = [];
  private routeSourceId = 'journey-route';
  private routeLayerId = 'journey-route-layer';
  private currentRouteLayerId = 'current-route-layer';
  
  constructor(
    private mapService: MapService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.initializeMap();
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (!this.map) return;
    
    if (changes['journey'] && this.journey) {
      this.displayJourney();
    }
    
    if (changes['currentSegmentIndex']) {
      this.updateCurrentSegment();
    }
    
    if (changes['mapView']) {
      this.updateMapView();
    }
  }
  
  ngOnDestroy() {
    this.map?.remove();
  }
  
  private async initializeMap() {
    // Dynamically import mapbox-gl
    const mapboxModule = await import('mapbox-gl');
    this.mapboxgl = mapboxModule.default;
    
    this.map = await this.mapService.initializeMap(this.mapContainer.nativeElement);
    
    this.map.on('load', () => {
      this.setupMapLayers();
      if (this.journey) {
        this.displayJourney();
      }
    });
    
    // Handle mouse move for hover effects
    this.map.on('mousemove', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point);
      this.map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });
  }
  
  private setupMapLayers() {
    // Add terrain and 3D buildings
    this.mapService.setup3DTerrain(this.map);
    
    // Add journey route source
    this.map.addSource(this.routeSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // Add dotted line layer for all segments
    this.map.addLayer({
      id: this.routeLayerId,
      type: 'line',
      source: this.routeSourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-dasharray': [2, 4],
        'line-opacity': 0.6
      }
    });
    
    // Add solid line layer for current segment
    this.map.addLayer({
      id: this.currentRouteLayerId,
      type: 'line',
      source: this.routeSourceId,
      filter: ['==', ['get', 'current'], true],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 5,
        'line-opacity': 0.9
      }
    });
  }
  
  private displayJourney() {
    if (!this.journey || !this.journey.waypoints) return;
    
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Create route features
    const features: any[] = [];
    const waypoints = this.journey.waypoints;
    
    // Add route segments
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      features.push({
        type: 'Feature',
        properties: {
          color: this.journey.color || '#4169E1',
          current: i === this.currentSegmentIndex,
          segment: i
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [from.longitude, from.latitude],
            [to.longitude, to.latitude]
          ]
        }
      });
    }
    
    // Update route source
    if (this.map.getSource(this.routeSourceId)) {
      (this.map.getSource(this.routeSourceId) as any).setData({
        type: 'FeatureCollection',
        features
      });
    }
    
    // Add markers for each waypoint
    waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      el.className = 'journey-marker';
      if (index === this.currentSegmentIndex || index === this.currentSegmentIndex + 1) {
        el.classList.add('current');
      }
      el.style.backgroundColor = this.journey!.color || '#4169E1';
      
      const popup = new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <h3>${waypoint.location_name}</h3>
          ${waypoint.modern_name ? `<p>Modern: ${waypoint.modern_name}</p>` : ''}
          ${waypoint.description ? `<p>${waypoint.description}</p>` : ''}
        `);
      
      const marker = new this.mapboxgl.Marker(el)
        .setLngLat([waypoint.longitude, waypoint.latitude])
        .setPopup(popup)
        .addTo(this.map);
      
      // Handle hover events
      el.addEventListener('mouseenter', (e) => {
        const rect = el.getBoundingClientRect();
        this.locationHover.emit({
          location: waypoint,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top
          }
        });
      });
      
      el.addEventListener('mouseleave', () => {
        this.locationHover.emit(null);
      });
      
      this.markers.push(marker);
    });
    
    // Fit map to journey bounds
    this.fitMapToBounds();
  }
  
  private updateCurrentSegment() {
    if (!this.journey || !this.map.getSource(this.routeSourceId)) return;
    
    // Update which segment is highlighted
    const source = this.map.getSource(this.routeSourceId) as any;
    const data = source._data;
    
    data.features.forEach((feature: any, index: number) => {
      feature.properties.current = index === this.currentSegmentIndex;
    });
    
    source.setData(data);
    
    // Update marker styles
    this.markers.forEach((marker, index) => {
      const el = marker.getElement();
      if (index === this.currentSegmentIndex || index === this.currentSegmentIndex + 1) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    });
    
    // Pan to current segment
    if (this.journey.waypoints && this.currentSegmentIndex < this.journey.waypoints.length - 1) {
      const from = this.journey.waypoints[this.currentSegmentIndex];
      const to = this.journey.waypoints[this.currentSegmentIndex + 1];
      
      const bounds = new this.mapboxgl.LngLatBounds()
        .extend([from.longitude, from.latitude])
        .extend([to.longitude, to.latitude]);
      
      this.map.fitBounds(bounds, { 
        padding: 100,
        duration: 1000
      });
    }
  }
  
  private updateMapView() {
    switch (this.mapView) {
      case '2d':
        this.map.setPitch(0);
        this.map.setBearing(0);
        break;
      case '3d':
        this.map.setPitch(45);
        this.map.setBearing(-17.6);
        break;
      case 'historical':
        this.map.setPitch(60);
        this.map.setBearing(0);
        // Could add historical overlays here
        break;
    }
  }
  
  private fitMapToBounds() {
    if (!this.journey || !this.journey.waypoints || this.journey.waypoints.length === 0) return;
    
    const bounds = new this.mapboxgl.LngLatBounds();
    
    this.journey.waypoints.forEach(waypoint => {
      bounds.extend([waypoint.longitude, waypoint.latitude]);
    });
    
    this.map.fitBounds(bounds, { 
      padding: 100,
      duration: 1500
    });
  }
}