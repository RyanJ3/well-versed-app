import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import maplibregl, { Map } from 'maplibre-gl';

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss'],
})
export class ScriptureAtlasComponent implements AfterViewInit, OnDestroy {
  map: Map | null = null;

  ngAfterViewInit(): void {
    this.map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [33.2, 37.0],
      zoom: 5,
    });

    this.map.on('load', () => {
      this.addRoute();
      this.addMarkers();
    });
  }

  addRoute() {
    if (!this.map) return;
    this.map.addSource('paulRoute', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [36.1, 36.2], // Antioch
            [33.35, 35.17], // Salamis
            [32.42, 34.77], // Paphos
            [30.85, 36.87], // Perga
            [31.17, 38.27], // Pisidian Antioch
            [32.48, 37.87], // Iconium
            [32.38, 37.58], // Lystra
            [33.7, 37.8], // Derbe
            [30.7, 36.9], // Attalia
            [36.1, 36.2], // Back to Antioch
          ],
        },
      },
    });

    this.map.addLayer({
      id: 'paulRouteLine',
      type: 'line',
      source: 'paulRoute',
      paint: {
        'line-color': '#FF0000',
        'line-width': 4,
      },
    });
  }

  addMarkers() {
    if (!this.map) return;
    const stops = [
      { coords: [36.1, 36.2], name: 'Antioch' },
      { coords: [33.35, 35.17], name: 'Salamis' },
      { coords: [32.42, 34.77], name: 'Paphos' },
      { coords: [30.85, 36.87], name: 'Perga' },
      { coords: [31.17, 38.27], name: 'Pisidian Antioch' },
      { coords: [32.48, 37.87], name: 'Iconium' },
      { coords: [32.38, 37.58], name: 'Lystra' },
      { coords: [33.7, 37.8], name: 'Derbe' },
      { coords: [30.7, 36.9], name: 'Attalia' },
    ];

    for (const stop of stops) {
      new maplibregl.Marker()
        .setLngLat(stop.coords as [number, number])
        .setPopup(new maplibregl.Popup().setHTML(`<h3>${stop.name}</h3>`))
        .addTo(this.map!);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
