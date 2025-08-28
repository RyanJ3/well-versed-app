import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Church {
  id: number;
  x: number;
  y: number;
  name: string;
  isHovered?: boolean;
  scale?: number;
}

interface Footstep {
  id: number;
  x: number;
  y: number;
  opacity: number;
  rotation: number;
  isLeft: boolean;
}

export interface MapContainer {
  id: number;
  x: number;
  y: number;
  visible: boolean;
  isHovered?: boolean;
  mode?: 'journey' | 'church-finder';
}

@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.scss']
})
export class MapContainerComponent implements OnInit, OnChanges {
  @Input() map!: MapContainer;
  @Input() mapLabel: string = 'Journey Map';
  
  currentLocation: string = 'Exploring...';
  locationIndex: number = 0;
  locations: string[] = [
    'Valley of Decision',
    'Mountain of Faith',
    'River of Life',
    'Desert of Testing',
    'City of Peace',
    'Harbor of Hope'
  ];
  
  private _currentMode: 'journey' | 'church-finder' = 'journey';
  
  get currentMode(): 'journey' | 'church-finder' {
    // Always return the mode from the map object if it exists
    return this.map?.mode || this._currentMode;
  }
  
  set currentMode(value: 'journey' | 'church-finder') {
    this._currentMode = value;
  }
  churches: Church[] = [];
  nearbyChurches: Church[] = [];
  footsteps: Footstep[] = [];
  private footstepId = 0;
  private lastFootstepTime = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isLeftFoot = true;
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeChurches();
    this.initializeNearbyChurches();
    // Always use the mode from the map object which gets updated in the parent
    this.currentMode = this.map.mode || 'journey';
    console.log('Map component initialized with mode:', this.currentMode);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Update the current mode when the map input changes
    if (changes['map']) {
      const currentMap = changes['map'].currentValue;
      if (currentMap) {
        this.currentMode = currentMap.mode || 'journey';
        console.log('Map component received new input, mode:', this.currentMode, 'Full map:', currentMap);
        // Force change detection
        this.cdr.detectChanges();
      }
    }
  }

  private initializeChurches() {
    // Biblical locations with various emojis
    this.churches = [
      { id: 1, x: 35, y: 65, name: 'Bethlehem', scale: 1.2 },
      { id: 2, x: 25, y: 40, name: 'Jerusalem', scale: 1 },
      { id: 3, x: 60, y: 30, name: 'Nazareth', scale: 0.9 },
      { id: 4, x: 45, y: 75, name: 'Jericho', scale: 0.8 },
      { id: 5, x: 70, y: 55, name: 'Capernaum', scale: 0.9 }
    ];
  }
  
  private initializeNearbyChurches() {
    // Only 3 modern churches for Church Finder mode
    this.nearbyChurches = [
      { id: 1, x: 25, y: 30, name: 'Grace Church', scale: 1 },
      { id: 2, x: 70, y: 25, name: 'First Baptist', scale: 1 },
      { id: 3, x: 45, y: 70, name: 'Community Chapel', scale: 1 }
    ];
  }
  
  
  toggleMode() {
    const newMode = this.currentMode === 'journey' ? 'church-finder' : 'journey';
    this.currentMode = newMode;
    this.map.mode = newMode;
    console.log('Mode toggled to:', newMode);
    this.cdr.detectChanges();
  }

  onMouseEnter() {
    this.map.isHovered = true;
    // Reset last mouse position when entering
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Cycle through locations (only in journey mode)
    if (this.currentMode === 'journey') {
      this.locationIndex = (this.locationIndex + 1) % this.locations.length;
      this.currentLocation = this.locations[this.locationIndex];
    }
  }

  onMouseLeave() {
    this.map.isHovered = false;
    // Clear footsteps when leaving
    setTimeout(() => {
      if (!this.map.isHovered) {
        this.footsteps = [];
      }
    }, 2000);
  }

  onMouseMove(event: MouseEvent) {
    const now = Date.now();
    if (now - this.lastFootstepTime < 120) return; // Throttle footsteps slightly more for better spacing
    
    this.lastFootstepTime = now;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate direction of movement
    let rotation = 0;
    if (this.lastMouseX !== 0 && this.lastMouseY !== 0) {
      const deltaX = x - this.lastMouseX;
      const deltaY = y - this.lastMouseY;
      // Calculate angle in degrees (0 = moving right, 90 = moving down)
      rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90; // Add 90 to point footsteps forward
    }
    
    // Add new footstep with alternating left/right
    const footstep: Footstep = {
      id: this.footstepId++,
      x: x - 10, // Center the footstep
      y: y - 10,
      opacity: 1,
      rotation: rotation,
      isLeft: this.isLeftFoot
    };
    
    this.footsteps.push(footstep);
    
    // Alternate feet
    this.isLeftFoot = !this.isLeftFoot;
    
    // Update last mouse position
    this.lastMouseX = x;
    this.lastMouseY = y;
    
    // Fade out and remove old footsteps
    setTimeout(() => {
      const index = this.footsteps.findIndex(f => f.id === footstep.id);
      if (index !== -1) {
        this.footsteps[index].opacity = 0.5;
      }
    }, 500);
    
    setTimeout(() => {
      const index = this.footsteps.findIndex(f => f.id === footstep.id);
      if (index !== -1) {
        this.footsteps[index].opacity = 0.2;
      }
    }, 1000);
    
    setTimeout(() => {
      this.footsteps = this.footsteps.filter(f => f.id !== footstep.id);
    }, 1500);
    
    // Keep only last 10 footsteps
    if (this.footsteps.length > 10) {
      this.footsteps.shift();
    }
  }

  onChurchHover(church: Church, isHovered: boolean) {
    church.isHovered = isHovered;
    if (isHovered) {
      church.scale = 1.3;
      if (this.currentMode === 'journey') {
        this.currentLocation = `Near ${church.name}`;
      }
    } else {
      church.scale = 1;
    }
  }
}