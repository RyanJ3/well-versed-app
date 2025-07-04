import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const L: any;

interface City {
  id: string;
  name: string;
  modern: string;
  position: [number, number];
  description: string;
  verses: string[];
  events: string[];
  keyFact: string;
}

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class ScriptureAtlasComponent implements OnInit, AfterViewInit {
  cities: City[] = [
    {
      id: 'antioch-syria',
      name: 'Antioch (Syria)',
      modern: 'Antakya, Turkey',
      position: [36.2, 36.16],
      description: 'Starting point where Paul and Barnabas were commissioned',
      verses: ['Acts 13:1-3'],
      events: [
        'Church fasted and prayed',
        'Holy Spirit said "Set apart Barnabas and Saul"',
        'Laid hands and sent them off'
      ],
      keyFact: 'Third largest city in the Roman Empire at the time'
    }
  ];

  memorized = new Set<string>();
  selectedCity: City | null = null;
  map!: any;
  markers: { [id: string]: any } = {};

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadLeaflet().then(() => this.initializeMap());
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof (window as any).L !== 'undefined') {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      }
    });
  }

  private initializeMap() {
    this.map = L.map('atlas-map').setView([36.5, 33], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const city = this.cities[0];
    const icon = this.createIcon('#3b82f6');
    const marker = L.marker(city.position, { icon }).addTo(this.map);
    marker.on('click', () => this.selectCity(city));
    marker.bindTooltip(city.name, { permanent: true, direction: 'top', offset: [0, -20] });
    this.markers[city.id] = marker;
  }

  selectCity(city: City) {
    this.selectedCity = city;
    Object.entries(this.markers).forEach(([id, marker]) => {
      marker.setIcon(this.createIcon(id === city.id ? '#dc2626' : '#3b82f6', this.memorized.has(id)));
    });
  }

  toggleMemorized(cityId: string) {
    if (this.memorized.has(cityId)) {
      this.memorized.delete(cityId);
    } else {
      this.memorized.add(cityId);
    }
    this.selectCity(this.cities.find(c => c.id === cityId)!);
  }

  createIcon(color: string, isMemorized = false): any {
    const styles = `
      background-color: ${color};
      width: 2rem;
      height: 2rem;
      display: block;
      left: -1rem;
      top: -1rem;
      position: relative;
      border-radius: 2rem 2rem 0;
      transform: rotate(45deg);
      border: 2px solid ${isMemorized ? '#10b981' : '#FFFFFF'};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    return L.divIcon({
      className: 'custom-pin',
      iconAnchor: [16, 32],
      labelAnchor: [-6, 0],
      popupAnchor: [0, -32],
      html: `<span style="${styles}" />`
    });
  }
}
