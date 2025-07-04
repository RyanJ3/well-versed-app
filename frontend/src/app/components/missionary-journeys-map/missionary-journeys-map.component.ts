import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat } from 'ol/proj';
import { Icon, Style, Text, Fill, Stroke } from 'ol/style';

@Component({
  selector: 'app-missionary-journeys-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './missionary-journeys-map.component.html',
  styleUrls: ['./missionary-journeys-map.component.scss']
})
export class MissionaryJourneysMapComponent implements OnInit, AfterViewInit {
  map!: Map;

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    // Antioch (Syria) - Starting point of Paul's first journey
    const antiochCoordinates = fromLonLat([36.16, 36.2]); // [longitude, latitude]

    // Create a feature for Antioch
    const antiochFeature = new Feature({
      geometry: new Point(antiochCoordinates),
      name: 'Antioch (Syria)',
      modernName: 'Antakya, Turkey',
      description: 'Starting point of Paul\'s first missionary journey',
      verses: 'Acts 13:1-3'
    });

    // Style for the point
    antiochFeature.setStyle(new Style({
      image: new Icon({
        color: '#8B4513',
        crossOrigin: 'anonymous',
        src: 'https://openlayers.org/en/latest/examples/data/dot.png',
        scale: 0.8
      }),
      text: new Text({
        text: 'Antioch',
        offsetY: -25,
        fill: new Fill({
          color: '#333'
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 3
        })
      })
    }));

    // Create vector source and layer
    const vectorSource = new VectorSource({
      features: [antiochFeature]
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    // Create the map
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: antiochCoordinates,
        zoom: 7
      })
    });

    // Add click handler to show info
    this.map.on('click', (evt: any) => {
      const feature = this.map.forEachFeatureAtPixel(evt.pixel, (f: any) => f);
      if (feature) {
        const properties = feature.getProperties();
        alert(`\n          ${properties.name}\n          Modern: ${properties.modernName}\n          ${properties.description}\n          Scripture: ${properties.verses}\n        `);
      }
    });
  }
}
