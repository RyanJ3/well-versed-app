import { Injectable } from '@angular/core';
import { HistoricalBuildingsService } from './historical-buildings.service';
import { ConfigService } from '@services/config/config.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapboxgl: any;
  
  constructor(
    private historicalBuildingsService: HistoricalBuildingsService,
    private configService: ConfigService
  ) {}

  async initializeMap(container: HTMLElement): Promise<any> {
    // Dynamically import mapbox-gl
    const mapboxModule = await import('mapbox-gl');
    this.mapboxgl = mapboxModule.default;
    
    (this.mapboxgl as any).accessToken = this.configService.mapboxToken;
    
    const map = new this.mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [35.2137, 31.7683], // Jerusalem
      zoom: 6,
      pitch: 45,
      bearing: -17.6
    });
    
    // Add navigation controls
    map.addControl(new this.mapboxgl.NavigationControl(), 'top-left');
    
    // Add scale
    map.addControl(new this.mapboxgl.ScaleControl({
      maxWidth: 200,
      unit: 'metric'
    }), 'bottom-left');
    
    return map;
  }
  
  setup3DTerrain(map: any) {
    // Add terrain source
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14
    });
    
    // Set terrain
    map.setTerrain({
      source: 'mapbox-dem',
      exaggeration: 1.5
    });
    
    // Add sky layer
    map.addLayer({
      id: 'sky',
      type: 'sky',
      paint: {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 90.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
    
    // Add 3D buildings
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    });
  }
  
  addHistoricalOverlay(map: any) {
    // Add a semi-transparent overlay for historical view
    map.setPaintProperty('background', 'background-color', '#f2e8d5');
    map.setPaintProperty('background', 'background-opacity', 0.3);
    
    // Adjust terrain colors
    if (map.getLayer('hillshading')) {
      map.setPaintProperty('hillshading', 'hillshade-accent-color', '#8B7355');
    }
  }
  
  removeHistoricalOverlay(map: any) {
    // Reset to default colors
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-opacity', 0);
    }
  }
  
  animateTo(map: any, center: [number, number], zoom?: number) {
    map.flyTo({
      center,
      zoom: zoom || map.getZoom(),
      duration: 2000,
      essential: true
    });
  }
  
  fitBounds(map: any, bounds: [[number, number], [number, number]], padding = 100) {
    map.fitBounds(bounds, {
      padding,
      duration: 1500
    });
  }

  
  addHistoricalBuildings(map: any) {
    const buildings = this.historicalBuildingsService.getBuildings();
    
    // Remove modern 3D buildings layer if it exists
    if (map.getLayer('3d-buildings')) {
      map.removeLayer('3d-buildings');
    }
    
    // Add source for historical buildings
    map.addSource('historical-buildings', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: buildings.flatMap(building => 
          building.features.map((feature, index) => ({
            type: 'Feature',
            properties: {
              name: building.name,
              description: building.description,
              period: building.period,
              height: feature.height,
              color: feature.color,
              featureType: feature.type,
              buildingId: `${building.name}-${index}`
            },
            geometry: {
              type: 'Polygon',
              coordinates: [feature.coordinates]
            }
          }))
        )
      }
    });
    
    // Add 3D extrusion layer for historical buildings
    map.addLayer({
      id: 'historical-buildings-3d',
      source: 'historical-buildings',
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
    
    // Add labels for historical buildings
    map.addLayer({
      id: 'historical-buildings-labels',
      source: 'historical-buildings',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-offset': [0, -2]
      },
      paint: {
        'text-color': '#000',
        'text-halo-color': '#fff',
        'text-halo-width': 2
      },
      filter: ['==', ['get', 'featureType'], 'main_building']
    });
    
    // Add click handler for popup
    map.on('click', 'historical-buildings-3d', (e: any) => {
      const properties = e.features[0].properties;
      const coordinates = e.lngLat;
      
      new this.mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <h3>${properties.name}</h3>
          <p><strong>Period:</strong> ${properties.period}</p>
          <p>${properties.description}</p>
        `)
        .addTo(map);
    });
    
    // Change cursor on hover
    map.on('mouseenter', 'historical-buildings-3d', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'historical-buildings-3d', () => {
      map.getCanvas().style.cursor = '';
    });
  }
  
  removeHistoricalBuildings(map: any) {
    if (map.getLayer('historical-buildings-labels')) {
      map.removeLayer('historical-buildings-labels');
    }
    if (map.getLayer('historical-buildings-3d')) {
      map.removeLayer('historical-buildings-3d');
    }
    if (map.getSource('historical-buildings')) {
      map.removeSource('historical-buildings');
    }
    
    // Re-add modern 3D buildings if needed
    if (!map.getLayer('3d-buildings')) {
      this.addModern3DBuildings(map);
    }
  }
  
  private addModern3DBuildings(map: any) {
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    });
  }
}