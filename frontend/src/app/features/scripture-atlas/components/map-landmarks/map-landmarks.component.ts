import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Landmark {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  pitch?: number;
  bearing?: number;
  icon: string;
}

@Component({
  selector: 'app-map-landmarks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-landmarks.component.html',
  styleUrls: ['./map-landmarks.component.scss']
})
export class MapLandmarksComponent {
  @Output() landmarkSelected = new EventEmitter<Landmark>();
  @Input() selectedLandmark: string | null = null;
  
  collapsed = false;
  
  landmarks: Landmark[] = [
    {
      id: 'temple',
      name: 'Solomon\'s Temple',
      description: 'Temple Mount, Jerusalem - Built ~957 BCE',
      coordinates: [35.2345, 31.7767],
      zoom: 17,
      pitch: 60,
      bearing: -20,
      icon: '🏛️'
    },
    {
      id: 'bethlehem',
      name: 'Bethlehem',
      description: 'Birthplace of Jesus Christ',
      coordinates: [35.2026, 31.7054],
      zoom: 15,
      pitch: 45,
      icon: '⭐'
    },
    {
      id: 'nazareth',
      name: 'Nazareth',
      description: 'Where Jesus grew up',
      coordinates: [35.2960, 32.7011],
      zoom: 15,
      pitch: 45,
      icon: '🏘️'
    },
    {
      id: 'sea-of-galilee',
      name: 'Sea of Galilee',
      description: 'Site of many miracles',
      coordinates: [35.5650, 32.8000],
      zoom: 11,
      pitch: 30,
      icon: '🌊'
    },
    {
      id: 'jordan-river',
      name: 'Jordan River',
      description: 'Where Jesus was baptized',
      coordinates: [35.5708, 32.3094],
      zoom: 14,
      pitch: 45,
      icon: '💧'
    },
    {
      id: 'mount-sinai',
      name: 'Mount Sinai',
      description: 'Where Moses received the Ten Commandments',
      coordinates: [33.9739, 28.5392],
      zoom: 13,
      pitch: 60,
      bearing: 45,
      icon: '⛰️'
    },
    {
      id: 'red-sea',
      name: 'Red Sea Crossing',
      description: 'Traditional crossing site',
      coordinates: [32.5500, 29.9700],
      zoom: 11,
      pitch: 30,
      icon: '🌊'
    },
    {
      id: 'jericho',
      name: 'Jericho',
      description: 'Ancient city whose walls fell',
      coordinates: [35.4444, 31.8667],
      zoom: 14,
      pitch: 45,
      icon: '🏰'
    },
    {
      id: 'mount-carmel',
      name: 'Mount Carmel',
      description: 'Where Elijah challenged the prophets of Baal',
      coordinates: [35.0367, 32.7328],
      zoom: 13,
      pitch: 60,
      icon: '🔥'
    },
    {
      id: 'caesarea',
      name: 'Caesarea Maritima',
      description: 'Roman port city where Paul was imprisoned',
      coordinates: [34.8914, 32.5000],
      zoom: 14,
      pitch: 45,
      icon: '🏛️'
    }
  ];
  
  selectLandmark(landmark: Landmark) {
    this.selectedLandmark = landmark.id;
    this.landmarkSelected.emit(landmark);
  }
}
