import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapboxgl: any;
  
  async initializeMap(container: HTMLElement): Promise<any> {
    // Dynamically import mapbox-gl
    const mapboxModule = await import('mapbox-gl');
    this.mapboxgl = mapboxModule.default;
    
    (this.mapboxgl as any).accessToken = environment.mapboxToken;
    
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
}