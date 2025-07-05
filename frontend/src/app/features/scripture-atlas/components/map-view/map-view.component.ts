import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BiblicalJourney, JourneyWaypoint, MapView } from '../../models/journey.models';
import { MapService } from '../../services/map.service';
import { MapLandmarksComponent, Landmark } from '../map-landmarks/map-landmarks.component';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
  imports: [MapLandmarksComponent]
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
    // Clean up historical buildings if present
    if (this.map && this.mapView === 'historical') {
      this.mapService.removeHistoricalBuildings(this.map);
    }
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
    // Add terrain - keep this for all views
    this.mapService.setup3DTerrain(this.map);
    
    // Only add modern 3D buildings if not in historical mode
    if (this.mapView !== 'historical') {
      // Modern 3D buildings will be added by setup3DTerrain
    }
    
    // Add journey route source
    this.map.addSource(this.routeSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

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
        this.mapService.removeHistoricalBuildings(this.map);
        break;
      case '3d':
        this.map.setPitch(45);
        this.map.setBearing(-17.6);
        this.mapService.removeHistoricalBuildings(this.map);
        break;
      case 'historical':
        this.map.setPitch(60);
        this.map.setBearing(0);
        // Add historical buildings overlay
        this.mapService.addHistoricalBuildings(this.map);
        break;
    }
  }
  
  public fitMapToBounds() {
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
  
  private isJerusalemArea(): boolean {
    if (!this.map) return false;
    
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const jerusalemCoords = { lat: 31.7767, lng: 35.2345 };
    
    // Check if we're looking at Jerusalem area with sufficient zoom
    const distance = this.getDistance(
      center.lat, center.lng,
      jerusalemCoords.lat, jerusalemCoords.lng
    );
    
    return distance < 5 && zoom > 12; // Within 5km and zoomed in
  }
  
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  private showTempleOverlay() {
    // Add a custom HTML overlay for the temple
    const templeHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255,255,255,0.9);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        text-align: center;
        pointer-events: none;
      ">
        <h3 style="margin: 0 0 10px 0; color: #8B4513;">Solomon's Temple</h3>
        <p style="margin: 0; color: #666;">Historical View Active</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
          Temple Mount, Jerusalem<br>
          Built ~957 BCE, Destroyed 586 BCE
        </p>
      </div>
    `;
    
    // Add overlay if not already present
    if (!document.getElementById('temple-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'temple-overlay';
      overlay.innerHTML = templeHTML;
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '100';
      this.mapContainer.nativeElement.appendChild(overlay);
      
      // Remove after 3 seconds
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 1s';
        setTimeout(() => overlay.remove(), 1000);
      }, 3000);
    }
  }

  
  flyToLandmark(landmark: Landmark) {
    if (!this.map) return;
    
    this.map.flyTo({
      center: landmark.coordinates,
      zoom: landmark.zoom,
      pitch: landmark.pitch || 45,
      bearing: landmark.bearing || 0,
      duration: 2000,
      essential: true
    });
    
    // Show temple overlay if it's the temple landmark
    if (landmark.id === 'temple' && this.mapView === 'historical') {
      setTimeout(() => this.showTempleOverlay(), 2000);
    }
  }
}