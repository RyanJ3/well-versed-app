import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../core/services/atlas.service';

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

      <app-scripture-atlas-nav
        [currentCityIndex]="currentCityIndex"
        [totalCities]="cities.length"
        (previous)="previousCity.emit()"
        (next)="nextCity.emit()">
      </app-scripture-atlas-nav>

      <app-scripture-atlas-playback-progress
        *ngIf="isPlaying"
        [currentIndex]="currentCityIndex"
        [total]="cities.length"
        [progress]="playbackProgress">
      </app-scripture-atlas-playback-progress>
    </div>
  `,
  styleUrls: ['./scripture-atlas-map.component.scss']
})
export class ScriptureAtlasMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() cities: City[] = [];
  @Input() selectedCity: City | null = null;
  @Input() currentCityIndex = 0;
  @Input() memorizedCities: Set<string> = new Set();
  @Input() terrainView = false;
  @Input() splitView = false;
  @Input() isPlaying = false;

  @Output() citySelected = new EventEmitter<City>();
  @Output() previousCity = new EventEmitter<void>();
  @Output() nextCity = new EventEmitter<void>();

  modernMap!: any;
  ancientMap!: any;
  markers: { [id: string]: any } = {};
  ancientMarkers: { [id: string]: any } = {};

  get playbackProgress(): number {
    if (this.cities.length <= 1) return 0;
    return (this.currentCityIndex / (this.cities.length - 1)) * 100;
  }

  ngAfterViewInit() {
    this.loadLeaflet().then(() => {
      this.initializeMaps();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCity'] && !changes['selectedCity'].firstChange && this.modernMap) {
      this.updateSelectedCity();
    }

    if (changes['splitView'] && !changes['splitView'].firstChange) {
      this.handleSplitViewChange();
    }

    if (changes['terrainView'] && !changes['terrainView'].firstChange && this.modernMap) {
      this.updateTerrainView();
    }

    if (changes['memorizedCities'] && !changes['memorizedCities'].firstChange) {
      this.updateMarkers();
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
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
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

    const bounds = L.latLngBounds(this.cities.map(c => c.position));
    this.modernMap.fitBounds(bounds.pad(0.1));
  }

  private initializeAncientMap() {
    setTimeout(() => {
      if (!document.getElementById('ancient-map')) return;

      this.ancientMap = L.map('ancient-map', {
        zoomControl: false,
        attributionControl: false,
      }).setView([36.5, 33], 7);

      L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design',
        maxZoom: 16,
      }).addTo(this.ancientMap);

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

      const bounds = L.latLngBounds(this.cities.map(c => c.position));
      this.ancientMap.fitBounds(bounds.pad(0.1));
    }, 100);
  }

  private drawJourneyRoute(map: any, markers: any, isAncient = false) {
    const route = this.cities.map(c => c.position);

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

      marker.on('click', () => this.citySelected.emit(city));

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

  private updateSelectedCity() {
    if (!this.selectedCity) return;

    this.updateMarkers();

    if (this.modernMap) {
      this.modernMap.panTo(this.selectedCity.position, { animate: true, duration: 0.5 });
    }
    if (this.ancientMap) {
      this.ancientMap.panTo(this.selectedCity.position, { animate: true, duration: 0.5 });
    }
  }

  private updateMarkers() {
    if (this.modernMap && this.markers) {
      Object.entries(this.markers).forEach(([id, marker]) => {
        const index = this.cities.findIndex(c => c.id === id);
        const icon = this.createCityIcon(index + 1, id, false);
        marker.setIcon(icon);
      });
    }

    if (this.ancientMap && this.ancientMarkers) {
      Object.entries(this.ancientMarkers).forEach(([id, marker]) => {
        const index = this.cities.findIndex(c => c.id === id);
        const icon = this.createCityIcon(index + 1, id, true);
        marker.setIcon(icon);
      });
    }
  }

  private handleSplitViewChange() {
    if (this.splitView) {
      setTimeout(() => this.initializeAncientMap(), 100);
    } else {
      if (this.ancientMap) {
        this.ancientMap.remove();
        this.ancientMap = null;
        this.ancientMarkers = {};
      }
    }

    setTimeout(() => {
      this.modernMap?.invalidateSize();
    }, 300);
  }

  private updateTerrainView() {
    if (!this.modernMap) return;

    if (this.terrainView) {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          opacity: 0.6,
        }
      ).addTo(this.modernMap);
    } else {
      this.modernMap.eachLayer((layer: any) => {
        if (layer._url && (layer._url.includes('terrain') || layer._url.includes('World_Physical_Map')))
          {
          this.modernMap.removeLayer(layer);
        }
      });
    }
  }
}
