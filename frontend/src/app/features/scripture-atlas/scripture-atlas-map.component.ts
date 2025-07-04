import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../core/services/atlas.service';

declare const L: any;

@Component({
  selector: 'app-scripture-atlas-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-area">
      <div class="maps-container" [class.split]="splitView">
        <div class="map-wrapper" [class.half]="splitView">
          <div id="modern-map" class="map-instance"></div>
          <div class="map-label" *ngIf="splitView">Modern View</div>
        </div>

        <div class="map-wrapper" [class.half]="splitView" *ngIf="splitView">
          <div id="ancient-map" class="map-instance"></div>
          <div class="map-label">Ancient View</div>
        </div>
      </div>

      <div class="nav-buttons">
        <button class="nav-btn" (click)="previousCity.emit()" 
          [disabled]="currentIndex === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button class="nav-btn primary" (click)="nextCity.emit()">
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="playback-progress" *ngIf="isPlaying">
        <svg viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="#e5e7eb" stroke-width="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="#6366f1" stroke-width="3"
            [attr.stroke-dasharray]="'100 100'"
            [attr.stroke-dashoffset]="100 - progress" />
        </svg>
        <span class="progress-text">{{ currentIndex + 1 }}/{{ cities.length }}</span>
      </div>
    </div>
  `,
  styles: [`
    .map-area {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1rem;
      background: #f9fafb;
    }

    .maps-container {
      flex: 1;
      position: relative;
      display: flex;
      background: white;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.06);
    }

    .maps-container.split .map-wrapper.half {
      width: 50%;
    }

    .maps-container.split .map-wrapper.half:first-child {
      border-right: 2px solid #d1d5db;
    }

    .map-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .map-instance {
      width: 100%;
      height: 100%;
    }

    .map-label {
      position: absolute;
      top: 1rem;
      left: 1rem;
      padding: 0.375rem 0.75rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
    }

    .nav-buttons {
      position: absolute;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      gap: 0.5rem;
      z-index: 1000;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
    }

    .nav-btn svg {
      width: 18px;
      height: 18px;
    }

    .nav-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px 0 rgb(0 0 0 / 0.1);
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-btn.primary {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }

    .nav-btn.primary:hover:not(:disabled) {
      background: #4f46e5;
      border-color: #4f46e5;
    }

    .playback-progress {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      width: 60px;
      height: 60px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }

    .playback-progress svg {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .playback-progress .progress-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
    }

    :host ::ng-deep .leaflet-container {
      background: #f3f4f6;
      font-family: inherit;
    }

    :host ::ng-deep .leaflet-control-zoom {
      border: none;
    }

    :host ::ng-deep .leaflet-control-zoom a {
      background: white !important;
      border: 1px solid #d1d5db !important;
      color: #374151 !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 30px !important;
    }

    :host ::ng-deep .leaflet-control-zoom a:hover {
      background: #f9fafb !important;
      color: #111827 !important;
    }

    :host ::ng-deep .leaflet-control-attribution {
      background: rgba(255, 255, 255, 0.8) !important;
      font-size: 0.625rem;
    }

    :host ::ng-deep .city-marker-wrapper {
      z-index: 600 !important;
    }

    :host ::ng-deep .custom-city-marker {
      border: 3px solid;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s;
      position: relative;
    }

    :host ::ng-deep .custom-city-marker.selected {
      animation: pulse 2s infinite;
    }

    :host ::ng-deep .custom-city-marker .marker-content {
      font-size: 1rem;
    }

    :host ::ng-deep .route-arrow {
      font-size: 20px;
      font-weight: bold;
      opacity: 0.7;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
      }
    }

    @media (max-width: 1024px) {
      .nav-buttons {
        bottom: 1rem;
        right: 1rem;
      }
    }

    @media (max-width: 768px) {
      .map-area {
        padding: 0.5rem;
      }

      .nav-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
      }

      .nav-btn svg {
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class ScriptureAtlasMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() cities: City[] = [];
  @Input() selectedCity: City | null = null;
  @Input() currentIndex = 0;
  @Input() memorizedCities = new Set<string>();
  @Input() splitView = false;
  @Input() terrainView = false;
  @Input() isPlaying = false;
  @Input() progress = 0;

  @Output() citySelect = new EventEmitter<City>();
  @Output() previousCity = new EventEmitter<void>();
  @Output() nextCity = new EventEmitter<void>();

  private modernMap: any;
  private ancientMap: any;
  private markers: { [id: string]: any } = {};
  private ancientMarkers: { [id: string]: any } = {};
  private leafletLoaded = false;

  ngAfterViewInit() {
    this.loadLeaflet().then(() => {
      this.initializeMaps();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['splitView'] && !changes['splitView'].firstChange) {
      this.handleSplitViewChange();
    }

    if (changes['terrainView'] && !changes['terrainView'].firstChange) {
      this.updateTerrainView();
    }

    if (changes['selectedCity'] && !changes['selectedCity'].firstChange && this.selectedCity) {
      this.panToCity(this.selectedCity);
      this.updateMarkers();
    }

    if (changes['cities'] && !changes['cities'].firstChange && this.leafletLoaded) {
      this.resetMaps();
      this.initializeMaps();
    }
  }

  ngOnDestroy() {
    if (this.modernMap) {
      this.modernMap.remove();
    }
    if (this.ancientMap) {
      this.ancientMap.remove();
    }
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof (window as any).L !== 'undefined') {
        this.leafletLoaded = true;
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        this.leafletLoaded = true;
        resolve();
      };
      document.body.appendChild(script);
    });
  }

  private resetMaps() {
    if (this.modernMap) {
      this.modernMap.remove();
      this.modernMap = undefined;
    }
    if (this.ancientMap) {
      this.ancientMap.remove();
      this.ancientMap = undefined;
    }
    this.markers = {};
    this.ancientMarkers = {};
  }

  private initializeMaps() {
    if (!this.cities.length) return;

    this.modernMap = L.map('modern-map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([36.5, 33], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.modernMap);

    if (this.splitView) {
      this.initializeAncientMap();
    }

    this.drawJourneyRoute(this.modernMap, this.markers);
    this.addCityMarkers(this.modernMap, this.markers);

    const bounds = L.latLngBounds(this.cities.map((c) => c.position));
    this.modernMap.fitBounds(bounds.pad(0.1));

    if (this.terrainView) {
      this.updateTerrainView();
    }
  }

  private initializeAncientMap() {
    if (!document.getElementById('ancient-map')) {
      setTimeout(() => this.initializeAncientMap(), 100);
      return;
    }

    this.ancientMap = L.map('ancient-map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([36.5, 33], 7);

    L.tileLayer(
      'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      { attribution: 'Map tiles by Stamen Design', maxZoom: 16 }
    ).addTo(this.ancientMap);

    this.drawJourneyRoute(this.ancientMap, this.ancientMarkers, true);
    this.addCityMarkers(this.ancientMap, this.ancientMarkers, true);

    this.modernMap.on('move', () => {
      if (this.ancientMap) {
        this.ancientMap.setView(
          this.modernMap.getCenter(),
          this.modernMap.getZoom(),
          { animate: false }
        );
      }
    });

    const bounds = L.latLngBounds(this.cities.map((c) => c.position));
    this.ancientMap.fitBounds(bounds.pad(0.1));
  }

  private drawJourneyRoute(map: any, markers: any, isAncient = false) {
    const route = this.cities.map((c) => c.position);

    L.polyline(route, {
      color: isAncient ? '#8B4513' : '#ef4444',
      weight: 4,
      opacity: 0.8,
      dashArray: '15, 10',
      lineJoin: 'round',
    }).addTo(map);

    this.addArrowsToRoute(map, route, isAncient);
  }

  private addArrowsToRoute(map: any, route: [number, number][], isAncient: boolean) {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const midpoint: [number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
      ];

      const angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;

      const arrowIcon = L.divIcon({
        className: 'route-arrow',
        html: `<div style="transform: rotate(${angle}deg); color: ${isAncient ? '#8B4513' : '#ef4444'};">→</div>`,
        iconSize: [20, 20],
      });

      L.marker(midpoint, { icon: arrowIcon, interactive: false }).addTo(map);
    }
  }

  private addCityMarkers(map: any, markersObj: any, isAncient = false) {
    this.cities.forEach((city, index) => {
      const icon = this.createCityIcon(index + 1, city.id, isAncient);
      const marker = L.marker(city.position, { icon }).addTo(map);

      marker.on('click', () => this.citySelect.emit(city));

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <strong style="font-size: 1.1em; color: ${isAncient ? '#8B4513' : '#6366f1'}">
            ${city.name}
          </strong>
          <br>
          <span style="color: #666; font-size: 0.9em">${city.modern}</span>
          <br>
          <span style="color: #999; font-size: 0.8em">${city.verses?.join(', ') ?? ''}</span>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -20] });
      markersObj[city.id] = marker;
    });
  }

  private createCityIcon(number: number, cityId: string, isAncient = false): any {
    const isSelected = this.selectedCity?.id === cityId;
    const isMemorized = this.memorizedCities.has(cityId);
    const baseColor = isSelected ? '#ef4444' : isAncient ? '#8B4513' : '#6366f1';
    const size = isSelected ? 48 : 40;

    const html = `
      <div class="custom-city-marker ${isSelected ? 'selected' : ''} ${isMemorized ? 'memorized' : ''}" 
           style="width: ${size}px; height: ${size}px; background: ${isSelected ? baseColor : 'white'}; border-color: ${baseColor};">
        <div class="marker-content" style="color: ${isSelected ? 'white' : baseColor}">
          ${number}
        </div>
        ${isMemorized ? '<div style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; border: 2px solid white;">✓</div>' : ''}
      </div>
    `;

    return L.divIcon({
      className: 'city-marker-wrapper',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  }

  private updateMarkers() {
    if (this.modernMap && this.markers) {
      Object.entries(this.markers).forEach(([id, marker]) => {
        const index = this.cities.findIndex((c) => c.id === id);
        const icon = this.createCityIcon(index + 1, id, false);
        marker.setIcon(icon);
      });
    }

    if (this.ancientMap && this.ancientMarkers) {
      Object.entries(this.ancientMarkers).forEach(([id, marker]) => {
        const index = this.cities.findIndex((c) => c.id === id);
        const icon = this.createCityIcon(index + 1, id, true);
        marker.setIcon(icon);
      });
    }
  }

  private panToCity(city: City) {
    if (this.modernMap) {
      this.modernMap.panTo(city.position, { animate: true, duration: 0.5 });
    }
    if (this.ancientMap) {
      this.ancientMap.panTo(city.position, { animate: true, duration: 0.5 });
    }
  }

  private handleSplitViewChange() {
    if (this.splitView) {
      setTimeout(() => {
        this.initializeAncientMap();
      }, 100);
    } else {
      if (this.ancientMap) {
        this.ancientMap.remove();
        this.ancientMap = null;
        this.ancientMarkers = {};
      }
    }

    setTimeout(() => {
      this.modernMap.invalidateSize();
    }, 300);
  }

  private updateTerrainView() {
    if (!this.modernMap) return;

    if (this.terrainView) {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', opacity: 0.6 }
      ).addTo(this.modernMap);
    } else {
      this.modernMap.eachLayer((layer: any) => {
        if (layer._url && (layer._url.includes('terrain') || layer._url.includes('World_Physical_Map'))) {
          this.modernMap.removeLayer(layer);
        }
      });
    }
  }
}