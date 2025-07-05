import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Location {
  name: string;
  lat: number;
  lng: number;
  ancientName?: string;
  elevation?: number;
  historicalBuildings?: HistoricalBuilding[];
}

interface HistoricalBuilding {
  name: string;
  type: 'temple' | 'wall' | 'gate' | 'house' | 'palace';
  height: number;
  coords: number[][];
}

interface JourneyEvent {
  title: string;
  description: string;
  scriptures: string[];
  visualEffect?: 'divine-light' | 'storm' | 'earthquake';
}

interface JourneySegment {
  from: Location;
  to: Location;
  events: JourneyEvent[];
  date?: string;
  dayRange?: string;
  travelMode?: 'walk' | 'boat' | 'divine';
}

interface BiblicalJourney {
  id: string;
  name: string;
  description: string;
  segments: JourneySegment[];
  color: string;
  era: 'old-testament' | 'new-testament';
}

@Component({
  selector: 'app-mapbox-scripture-atlas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "scripture-atlas.component.html",
  styleUrls: ["scripture-atlas.component.scss"]
})
export class ScriptureAtlasComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  private map: any;
  private mapboxgl: any;
  private markers: any[] = [];
  private animationId?: number;
  private journeyLine?: any;
  
  controlsCollapsed = false;
  currentView: '2d' | '3d' | 'historical' = '3d';
  isFirstPerson = false;
  isAnimating = false;
  animationSpeed = 3;
  timeOfDay = 12;
  currentJourney!: BiblicalJourney;
  currentSegmentIndex = 0;
  hoveredLocation: Location | null = null;
  popupPosition = { x: 0, y: 0 };
  
  // Enhanced journey data with historical buildings
  journeys: BiblicalJourney[] = [
    {
      id: 'wilderness',
      name: 'Wilderness Wanderings',
      description: 'The 40-year journey of the Israelites from Egypt to the Promised Land',
      color: '#8B4513',
      era: 'old-testament',
      segments: [
        {
          from: { 
            name: 'Rameses', 
            lat: 30.5965, 
            lng: 32.2685, 
            ancientName: 'Pi-Ramesses',
            elevation: 10,
            historicalBuildings: [
              {
                name: 'Palace of Ramesses',
                type: 'palace',
                height: 25,
                coords: [[32.268, 30.596], [32.269, 30.596], [32.269, 30.597], [32.268, 30.597]]
              }
            ]
          },
          to: { name: 'Succoth', lat: 30.5465, lng: 32.2785, elevation: 15 },
          dayRange: 'Day 1',
          travelMode: 'walk',
          events: [{
            title: 'The Exodus Begins',
            description: 'The Israelites departed from Rameses after the Passover.',
            scriptures: ['Exodus 12:37', 'Numbers 33:3-5'],
            visualEffect: 'divine-light'
          }]
        },
        {
          from: { name: 'Succoth', lat: 30.5465, lng: 32.2785, elevation: 15 },
          to: { name: 'Etham', lat: 30.4765, lng: 32.3985, elevation: 20 },
          dayRange: 'Days 2-3',
          travelMode: 'walk',
          events: [{
            title: 'Edge of the Wilderness',
            description: 'God led them by a pillar of cloud by day and fire by night.',
            scriptures: ['Exodus 13:20-22', 'Numbers 33:6'],
            visualEffect: 'divine-light'
          }]
        }
      ]
    },
    {
      id: 'paul-first',
      name: "Paul's First Missionary Journey",
      description: 'Paul and Barnabas spread the Gospel through Cyprus and Asia Minor (AD 46-48)',
      color: '#4169E1',
      era: 'new-testament',
      segments: [
        {
          from: { 
            name: 'Antioch', 
            lat: 36.2021, 
            lng: 36.1606, 
            ancientName: 'Syrian Antioch',
            elevation: 80,
            historicalBuildings: [
              {
                name: 'City Walls',
                type: 'wall',
                height: 15,
                coords: [[36.160, 36.201], [36.161, 36.202], [36.160, 36.203], [36.159, 36.202]]
              }
            ]
          },
          to: { name: 'Seleucia', lat: 36.1173, lng: 35.9266, elevation: 5 },
          travelMode: 'walk',
          events: [{
            title: 'Commissioned by the Church',
            description: 'The Holy Spirit called Paul and Barnabas to missionary work.',
            scriptures: ['Acts 13:1-3']
          }]
        },
        {
          from: { name: 'Seleucia', lat: 36.1173, lng: 35.9266, elevation: 5 },
          to: { name: 'Salamis', lat: 35.1774, lng: 33.9041, elevation: 10 },
          travelMode: 'boat',
          events: [{
            title: 'Arrival in Cyprus',
            description: 'They proclaimed the word of God in the Jewish synagogues.',
            scriptures: ['Acts 13:4-5']
          }]
        }
      ]
    }
  ];
  
  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentJourney = this.journeys[0];
  }
  
  get currentSegment(): JourneySegment | null {
    return this.currentJourney?.segments[this.currentSegmentIndex] || null;
  }
  
  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Only import mapbox-gl in browser
      const mapboxModule = await import('mapbox-gl');
      this.mapboxgl = mapboxModule.default;
      
      (this.mapboxgl as any).accessToken = environment.mapboxToken;
      
      this.initializeMap();
    }
  }
  
  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.map?.remove();
  }
  
  initializeMap() {
    if (!this.mapboxgl) return;
    
    this.map = new this.mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [35.2137, 31.7683], // Jerusalem
      zoom: 7,
      pitch: 45,
      bearing: 0
    });
    
    this.map.on('load', () => {
      this.setupMapLayers();
      this.displayJourney();
      this.setupInteractions();
    });
  }
  
  setupMapLayers() {
    // Add terrain
    this.map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    });
    
    this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
    
    // Add 3D buildings layer
    this.map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6
      }
    });
    
    // Add sky
    this.map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 90.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
  }
  
  setupInteractions() {
    this.map.on('mousemove', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point);
      this.map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });
    
    this.map.on('click', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point);
      if (features.length) {
        // Handle click on features
      }
    });
  }
  
  displayJourney() {
    if (!this.mapboxgl) return;
    
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Add custom markers for each location
    const locations = new Set<Location>();
    this.currentJourney.segments.forEach(segment => {
      locations.add(segment.from);
      locations.add(segment.to);
    });
    
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = this.currentJourney.color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      
      const marker = new this.mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(new this.mapboxgl.Popup().setHTML(`
          <h3>${location.name}</h3>
          ${location.ancientName ? `<p><em>${location.ancientName}</em></p>` : ''}
          ${location.elevation ? `<p>Elevation: ${location.elevation}m</p>` : ''}
        `))
        .addTo(this.map);
      
      this.markers.push(marker);
      
      // Add historical buildings if in historical view
      if (location.historicalBuildings && this.currentView === 'historical') {
        this.addHistoricalBuildings(location);
      }
    });
    
    this.displayCurrentSegment();
  }
  
  addHistoricalBuildings(location: Location) {
    location.historicalBuildings?.forEach(building => {
      const sourceId = `building-${location.name}-${building.name}`;
      
      this.map.addSource(sourceId, {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {
            'height': building.height
          },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [building.coords]
          }
        }
      });
      
      this.map.addLayer({
        'id': sourceId,
        'type': 'fill-extrusion',
        'source': sourceId,
        'paint': {
          'fill-extrusion-color': this.getBuildingColor(building.type),
          'fill-extrusion-height': building.height,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });
    });
  }
  
  getBuildingColor(type: string): string {
    const colors = {
      'temple': '#FFD700',
      'wall': '#8B7355',
      'gate': '#696969',
      'house': '#DEB887',
      'palace': '#B8860B'
    };
    return colors[type as keyof typeof colors] || '#A0522D';
  }
  
  displayCurrentSegment() {
    if (!this.mapboxgl) return;
    
    const segment = this.currentSegment;
    if (!segment) return;
    
    // Add journey path
    const route = {
      'type': 'Feature' as const,
      'geometry': {
        'type': 'LineString' as const,
        'coordinates': [
          [segment.from.lng, segment.from.lat],
          [segment.to.lng, segment.to.lat]
        ]
      },
      'properties': {}
    };
    
    if (this.map.getSource('route')) {
      (this.map.getSource('route') as any).setData(route);
    } else {
      this.map.addSource('route', {
        'type': 'geojson',
        'data': route
      });
      
      this.map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': this.currentJourney.color,
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }
    
    // Fit bounds to current segment
    const bounds = new this.mapboxgl.LngLatBounds()
      .extend([segment.from.lng, segment.from.lat])
      .extend([segment.to.lng, segment.to.lat]);
    
    this.map.fitBounds(bounds, { padding: 100 });
  }
  
  setView(view: '2d' | '3d' | 'historical') {
    this.currentView = view;
    
    switch (view) {
      case '2d':
        this.map.setPitch(0);
        this.map.setBearing(0);
        this.map.setStyle({
          version: 8,
          sources: {
            'simple-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
            }
          },
          layers: [{
            id: 'simple-tiles',
            type: 'raster',
            source: 'simple-tiles'
          }]
        });
        break;
      case '3d':
        this.map.setPitch(45);
        this.map.setBearing(-17.6);
        this.map.setStyle('mapbox://styles/mapbox/outdoors-v12');
        break;
      case 'historical':
        this.map.setPitch(60);
        // Minimal style with just terrain
        this.map.setStyle({
          version: 8,
          sources: {
            'terrain': {
              type: 'raster-dem',
              url: 'mapbox://mapbox.terrain-rgb'
            }
          },
          layers: [{
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f2e8d5' }
          }],
          terrain: { source: 'terrain', exaggeration: 1.5 }
        });
        break;
    }
    
    // Re-add layers after style change
    this.map.once('style.load', () => {
      this.setupMapLayers();
      this.displayJourney();
    });
  }
  
  toggleFirstPerson() {
    this.isFirstPerson = !this.isFirstPerson;
    
    if (this.isFirstPerson) {
      this.map.setPitch(75);
      this.map.setZoom(16);
      // Enable keyboard navigation
      this.map.keyboard.enable();
    } else {
      this.map.setPitch(45);
      this.map.setZoom(7);
    }
  }
  
  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
    
    if (this.isAnimating) {
      this.animateJourney();
    } else if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  animateJourney() {
    let progress = 0;
    const segment = this.currentSegment;
    if (!segment) return;
    
    const animate = () => {
      progress += 0.01 * this.animationSpeed;
      
      if (progress > 1) {
        if (this.currentSegmentIndex < this.currentJourney.segments.length - 1) {
          this.nextSegment();
          progress = 0;
        } else {
          this.isAnimating = false;
          return;
        }
      }
      
      // Interpolate position
      const lng = segment.from.lng + (segment.to.lng - segment.from.lng) * progress;
      const lat = segment.from.lat + (segment.to.lat - segment.from.lat) * progress;
      
      this.map.setCenter([lng, lat]);
      
      if (this.isAnimating) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  updateAnimationSpeed() {
    // Speed is updated via two-way binding
  }
  
  updateTimeOfDay() {
    const position = this.getSunPosition(this.timeOfDay);
    
    this.map.setPaintProperty('sky', 'sky-atmosphere-sun', position);
    
    // Adjust lighting
    const intensity = this.timeOfDay > 6 && this.timeOfDay < 18 ? 15 : 5;
    this.map.setPaintProperty('sky', 'sky-atmosphere-sun-intensity', intensity);
  }
  
  getSunPosition(hour: number): [number, number] {
    const angle = (hour / 24) * 360 - 90;
    const elevation = hour > 12 ? 90 - (hour - 12) * 7.5 : hour * 7.5;
    return [angle, elevation];
  }
  
  formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  
  highlightEvent(event: JourneyEvent) {
    if (event.visualEffect) {
      // Add visual effects to map based on event type
      switch (event.visualEffect) {
        case 'divine-light':
          // Add light beam effect
          break;
        case 'storm':
          // Add storm clouds
          break;
        case 'earthquake':
          // Add shake effect
          break;
      }
    }
  }
  
  unhighlightEvent() {
    // Remove visual effects
  }
  
  onJourneyChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const journey = this.journeys.find(j => j.id === select.value);
    if (journey) {
      this.currentJourney = journey;
      this.currentSegmentIndex = 0;
      this.displayJourney();
    }
  }
  
  nextSegment() {
    if (this.currentSegmentIndex < this.currentJourney.segments.length - 1) {
      this.currentSegmentIndex++;
      this.displayCurrentSegment();
    }
  }
  
  previousSegment() {
    if (this.currentSegmentIndex > 0) {
      this.currentSegmentIndex--;
      this.displayCurrentSegment();
    }
  }
}