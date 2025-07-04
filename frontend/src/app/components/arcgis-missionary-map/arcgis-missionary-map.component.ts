import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Point from '@arcgis/core/geometry/Point';
import PopupTemplate from '@arcgis/core/PopupTemplate';

@Component({
  selector: 'app-arcgis-missionary-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arcgis-missionary-map.component.html',
  styleUrls: ['./arcgis-missionary-map.component.scss']
})
export class ArcgisMissionaryMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;

  private view: MapView | null = null;

  ngOnInit(): void {
    this.initializeMap();
  }

  async initializeMap(): Promise<void> {
    try {
      const map = new Map({
        basemap: 'topo-vector'
      });

      const view = new MapView({
        container: this.mapViewEl.nativeElement,
        map: map,
        center: [36.16, 36.2],
        zoom: 7,
        popup: {
          defaultPopupTemplateEnabled: true
        }
      });

      const graphicsLayer = new GraphicsLayer({
        title: "Paul's First Missionary Journey"
      });
      map.add(graphicsLayer);

      const antiochPoint = new Point({
        longitude: 36.16,
        latitude: 36.2
      });

      const citySymbol = new SimpleMarkerSymbol({
        style: 'circle',
        color: [139, 69, 19],
        size: '12px',
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      });

      const popupTemplate = new PopupTemplate({
        title: '{name}',
        content: [{
          type: 'fields',
          fieldInfos: [
            { fieldName: 'modern', label: 'Modern Location' },
            { fieldName: 'description', label: 'Description' },
            { fieldName: 'verses', label: 'Scripture Reference' }
          ]
        }]
      });

      const antiochGraphic = new Graphic({
        geometry: antiochPoint,
        symbol: citySymbol,
        attributes: {
          name: 'Antioch (Syria)',
          modern: 'Antakya, Turkey',
          description: "Starting point of Paul's first missionary journey",
          verses: 'Acts 13:1-3'
        },
        popupTemplate: popupTemplate
      });

      const textSymbol = new TextSymbol({
        text: 'Antioch',
        color: 'black',
        haloColor: 'white',
        haloSize: '1px',
        font: {
          size: 12,
          family: 'sans-serif',
          weight: 'bold'
        },
        yoffset: -15
      });

      const labelGraphic = new Graphic({
        geometry: antiochPoint,
        symbol: textSymbol
      });

      graphicsLayer.addMany([antiochGraphic, labelGraphic]);

      this.view = view;
      await view.when();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.view) {
      this.view.destroy();
    }
  }
}
