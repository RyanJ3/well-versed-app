import {
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtlasSidebarComponent } from './sidebar/sidebar.component';
import { trigger, style, transition, animate } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { AtlasService, Journey, City } from '../../core/services/atlas.service';

declare const L: any;

interface Particle {
  x: number;
  y: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule, FormsModule, AtlasSidebarComponent],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ]),
    ]),
  ],
})
export class ScriptureAtlasComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // Data loaded from API
  cities: City[] = [];
  journeys: Journey[] = [];
  selectedJourneyId: number | null = null;

  // State variables
  memorized = new Set<string>();
  versesRead = new Set<string>();
  selectedCity: City | null = null;
  currentCityIndex = 0;
  currentDistance = 0;
  timelineProgress = 0;
  scrollOffset = 0;

  // Feature toggles
  isPlaying = false;
  terrainView = false;
  splitView = false;
  sidebarOpen = true;
  sidebarView: 'scripture' | 'city' = 'scripture';

  // Map instances
  modernMap!: any;
  ancientMap!: any;
  markers: { [id: string]: any } = {};
  ancientMarkers: { [id: string]: any } = {};

  // Animation
  playbackInterval?: Subscription;
  particles: Particle[] = [];

  // Distance data (cumulative miles)
  distances: number[] = [];

  // Scripture text
  currentScriptureText = '';
  get selectedJourney(): Journey | undefined {
    if (this.selectedJourneyId == null) {
      return undefined;
    }
    return this.journeys.find((j) => j.id === this.selectedJourneyId);
  }

  constructor(private atlasService: AtlasService) {}

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    this.scrollOffset = window.pageYOffset;
  }

  ngOnInit() {
    // Load saved progress
    const savedMemorized = localStorage.getItem('scripture-atlas-memorized');
    if (savedMemorized) {
      this.memorized = new Set(JSON.parse(savedMemorized));
    }

    const savedVersesRead = localStorage.getItem('scripture-atlas-verses-read');
    if (savedVersesRead) {
      this.versesRead = new Set(JSON.parse(savedVersesRead));
    }

    // Initialize particles
    this.initializeParticles();
    this.atlasService.getJourneys().subscribe((js) => {
      this.journeys = js;
      if (js.length) {
        this.selectedJourneyId = js[0].id;
        this.loadJourney(js[0].id);
      }
    });
  }

  ngAfterViewInit() {
    this.loadLeaflet().then(() => {
      this.initializeMaps();
      // Set initial city after maps are loaded
      if (this.cities.length > 0) {
        this.selectCity(this.cities[0]);
      }
    });
  }

  ngOnDestroy() {
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  private initializeParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 20,
      });
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

  private resetMaps() {
    if (this.modernMap) {
      this.modernMap.remove();
      this.modernMap = undefined as any;
    }
    if (this.ancientMap) {
      this.ancientMap.remove();
      this.ancientMap = undefined as any;
    }
    this.markers = {};
    this.ancientMarkers = {};
  }

  loadJourney(id: number) {
    if (id == null) {
      return;
    }
    this.atlasService.getJourney(id).subscribe((detail) => {
      this.cities = detail.cities;
      this.distances = this.cities.map((c) => c.distance);
      this.resetMaps();
      this.initializeMaps();
      if (this.cities.length) {
        this.selectCity(this.cities[0]);
      }
    });
  }

  private initializeMaps() {
    // Initialize modern map
    this.modernMap = L.map('modern-map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([36.5, 33], 7);

    // Add modern tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.modernMap);

    // Initialize ancient map if split view
    if (this.splitView) {
      this.initializeAncientMap();
    }

    // Add route and markers
    this.drawJourneyRoute(this.modernMap, this.markers);
    this.addCityMarkers(this.modernMap, this.markers);

    // Fit bounds
    const bounds = L.latLngBounds(this.cities.map((c) => c.position));
    this.modernMap.fitBounds(bounds.pad(0.1));
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

    // Add ancient-styled tile layer (sepia/vintage effect)
    L.tileLayer(
      'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      {
        attribution: 'Map tiles by Stamen Design',
        maxZoom: 16,
      },
    ).addTo(this.ancientMap);

    // Add route and markers
    this.drawJourneyRoute(this.ancientMap, this.ancientMarkers, true);
    this.addCityMarkers(this.ancientMap, this.ancientMarkers, true);

    // Sync map movements
    this.modernMap.on('move', () => {
      if (this.ancientMap) {
        this.ancientMap.setView(
          this.modernMap.getCenter(),
          this.modernMap.getZoom(),
          { animate: false },
        );
      }
    });

    const bounds = L.latLngBounds(this.cities.map((c) => c.position));
    this.ancientMap.fitBounds(bounds.pad(0.1));
  }

  private drawJourneyRoute(map: any, markers: any, isAncient = false) {
    const route = this.cities.map((c) => c.position);

    // Animated dashed line for journey
    const journeyLine = L.polyline(route, {
      color: isAncient ? '#8B4513' : '#ef4444',
      weight: 4,
      opacity: 0.8,
      dashArray: '15, 10',
      lineJoin: 'round',
    }).addTo(map);

    // Add arrow decorators for direction
    this.addArrowsToRoute(map, route, isAncient);
  }

  private addArrowsToRoute(
    map: any,
    route: [number, number][],
    isAncient: boolean,
  ) {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const midpoint: [number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
      ];

      const angle =
        (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;

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

      marker.on('click', () => this.selectCity(city));

      // Custom popup
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

      marker.bindPopup(popupContent, {
        offset: [0, -20],
      });

      markersObj[city.id] = marker;
    });
  }

  private createCityIcon(
    number: number,
    cityId: string,
    isAncient = false,
  ): any {
    const isSelected = this.selectedCity?.id === cityId;
    const isMemorized = this.memorized.has(cityId);

    const baseColor = isSelected
      ? '#ef4444'
      : isAncient
        ? '#8B4513'
        : '#6366f1';
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

  selectCity(city: City) {
    this.selectedCity = city;
    this.currentCityIndex = this.cities.indexOf(city);
    this.currentDistance = this.distances[this.currentCityIndex];
    this.timelineProgress =
      (this.currentCityIndex / (this.cities.length - 1)) * 100;
    this.currentScriptureText = city.scriptureText || '';

    // Update markers
    this.updateMarkers();

    // Pan to city only if map is initialized
    if (this.modernMap) {
      this.modernMap.panTo(city.position, { animate: true, duration: 0.5 });
    }
    if (this.ancientMap) {
      this.ancientMap.panTo(city.position, { animate: true, duration: 0.5 });
    }

    // If terrain view, add elevation visualization
    if (this.terrainView && this.modernMap) {
      this.updateTerrainView();
    }
  }

  private updateMarkers() {
    // Update modern map markers only if map exists
    if (this.modernMap && this.markers) {
      Object.entries(this.markers).forEach(([id, marker]) => {
        const index = this.cities.findIndex((c) => c.id === id);
        const icon = this.createCityIcon(index + 1, id, false);
        marker.setIcon(icon);
      });
    }

    // Update ancient map markers if exists
    if (this.ancientMap && this.ancientMarkers) {
      Object.entries(this.ancientMarkers).forEach(([id, marker]) => {
        const index = this.cities.findIndex((c) => c.id === id);
        const icon = this.createCityIcon(index + 1, id, true);
        marker.setIcon(icon);
      });
    }
  }

  private updateTerrainView() {
    if (!this.modernMap) return;

    // Check if terrain layer already exists
    let hasTerrainLayer = false;
    this.modernMap.eachLayer((layer: any) => {
      if (layer._url && layer._url.includes('terrain')) {
        hasTerrainLayer = true;
      }
    });

    // Add terrain/elevation layer if not present
    if (!hasTerrainLayer) {
      L.tileLayer(
        'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
        {
          attribution: 'Map tiles by Stamen Design',
          opacity: 0.5,
        },
      ).addTo(this.modernMap);
    }
  }

  toggleJourneyPlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  private startPlayback() {
    this.isPlaying = true;
    this.currentCityIndex = 0;
    this.selectCity(this.cities[0]);

    this.playbackInterval = interval(3000).subscribe(() => {
      if (this.currentCityIndex < this.cities.length - 1) {
        this.currentCityIndex++;
        this.selectCity(this.cities[this.currentCityIndex]);
      } else {
        this.stopPlayback();
      }
    });
  }

  private stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  toggleTerrainView() {
    this.terrainView = !this.terrainView;

    if (!this.modernMap) return;

    if (this.terrainView) {
      // Add terrain visualization
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          opacity: 0.6,
        },
      ).addTo(this.modernMap);
    } else {
      // Remove terrain layers
      this.modernMap.eachLayer((layer: any) => {
        if (
          layer._url &&
          (layer._url.includes('terrain') ||
            layer._url.includes('World_Physical_Map'))
        ) {
          this.modernMap.removeLayer(layer);
        }
      });
    }
  }

  toggleSplitView() {
    this.splitView = !this.splitView;

    if (this.splitView) {
      // Initialize ancient map after DOM update
      setTimeout(() => {
        this.initializeAncientMap();
      }, 100);
    } else {
      // Clean up ancient map
      if (this.ancientMap) {
        this.ancientMap.remove();
        this.ancientMap = null;
        this.ancientMarkers = {};
      }
    }

    // Resize modern map
    setTimeout(() => {
      this.modernMap.invalidateSize();
    }, 300);
  }

  toggleMemorized(cityId: string) {
    if (this.memorized.has(cityId)) {
      this.memorized.delete(cityId);
    } else {
      this.memorized.add(cityId);
    }

    // Save progress
    localStorage.setItem(
      'scripture-atlas-memorized',
      JSON.stringify(Array.from(this.memorized)),
    );

    // Update markers
    this.updateMarkers();
  }

  markVersesAsRead() {
    if (this.selectedCity) {
      this.versesRead.add(this.selectedCity.id);
      localStorage.setItem(
        'scripture-atlas-verses-read',
        JSON.stringify(Array.from(this.versesRead)),
      );
    }
  }

  syncWithTracker() {
    // This would integrate with the Scripture Tracker component
    // For now, we'll just show an alert
    alert(
      'Syncing with Scripture Tracker... This would update your reading progress in Acts 13-14!',
    );
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    // Resize map after animation completes
    setTimeout(() => {
      if (this.modernMap) {
        this.modernMap.invalidateSize();
      }
      if (this.ancientMap) {
        this.ancientMap.invalidateSize();
      }
    }, 300);
  }

  previousCity() {
    if (this.currentCityIndex > 0) {
      this.selectCity(this.cities[this.currentCityIndex - 1]);
    }
  }

  nextCity() {
    if (this.currentCityIndex < this.cities.length - 1) {
      this.selectCity(this.cities[this.currentCityIndex + 1]);
    } else {
      // Loop back to first city
      this.selectCity(this.cities[0]);
    }
  }

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value);
    if (index >= 0 && index < this.cities.length) {
      this.selectCity(this.cities[index]);
    }
  }

  getProgressPercentage(): number {
    return Math.round((this.memorized.size / this.cities.length) * 100);
  }

  getCityIllustration(cityId: string): string {
    // Return custom illustrations for each city
    const illustrations: { [key: string]: string } = {
      'antioch-syria': 'assets/cities/antioch-syria.jpg',
      seleucia: 'assets/cities/seleucia.jpg',
      salamis: 'assets/cities/salamis.jpg',
      paphos: 'assets/cities/paphos.jpg',
      perga: 'assets/cities/perga.jpg',
      'pisidian-antioch': 'assets/cities/pisidian-antioch.jpg',
      iconium: 'assets/cities/iconium.jpg',
      lystra: 'assets/cities/lystra.jpg',
      derbe: 'assets/cities/derbe.jpg',
    };

    // Fallback to generated gradient if no image
    return (
      illustrations[cityId] ||
      `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%236366f1;stop-opacity:1"/><stop offset="100%" style="stop-color:%23a78bfa;stop-opacity:1"/></linearGradient></defs><rect width="400" height="200" fill="url(%23g1)"/><text x="200" y="100" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${this.selectedCity?.name || ''}</text></svg>`
    );
  }
}
