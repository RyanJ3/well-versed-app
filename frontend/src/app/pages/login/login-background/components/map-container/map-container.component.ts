import { Component, Input, OnInit, HostListener } from '@angular/core';
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
}

@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="map-container"
      [class.visible]="map.visible || map.isHovered"
      [style.left.%]="map.x"
      [style.top.%]="map.y"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (mousemove)="onMouseMove($event)">
      <div class="map-border">
        <div class="map-header">
          <span class="map-title">{{ mapLabel }}</span>
          <span class="map-subtitle">{{ currentLocation }}</span>
        </div>
        
        <div class="map-terrain">
          <!-- Grid lines for map feel -->
          <div class="map-grid"></div>
          
          <!-- Terrain features -->
          <div class="terrain-feature mountain" style="left: 15%; top: 15%;">
            <span class="mountain-peak"></span>
            <span class="mountain-shadow"></span>
          </div>
          <div class="terrain-feature mountain small" style="left: 25%; top: 22%;">
            <span class="mountain-peak"></span>
          </div>
          
          <!-- Rivers with animation -->
          <div class="terrain-feature river" style="left: 35%; top: 10%;">
            <div class="river-flow"></div>
          </div>
          <div class="terrain-feature river branch" style="left: 55%; top: 40%;">
            <div class="river-flow"></div>
          </div>
          
          <!-- Forests -->
          <div class="terrain-feature forest" style="left: 70%; top: 25%;">
            <span class="tree">🌲</span>
            <span class="tree">🌲</span>
            <span class="tree">🌳</span>
          </div>
          <div class="terrain-feature forest small" style="left: 10%; top: 60%;">
            <span class="tree">🌳</span>
            <span class="tree">🌲</span>
          </div>
          
          <!-- Desert area -->
          <div class="terrain-feature desert" style="left: 50%; top: 65%;">
            <span class="dune"></span>
            <span class="dune"></span>
          </div>
          
          <!-- Main road/path -->
          <svg class="path-svg">
            <path
              d="M 20 80 Q 50 60, 80 50 T 160 30"
              class="main-path"
              stroke-dasharray="5,5"
            />
          </svg>
        </div>
        
        <!-- Churches with names -->
        <div 
          *ngFor="let church of churches"
          class="church-marker"
          [class.hovered]="church.isHovered"
          [style.left.%]="church.x"
          [style.top.%]="church.y"
          [style.transform]="'scale(' + (church.scale || 1) + ')'"
          (mouseenter)="onChurchHover(church, true)"
          (mouseleave)="onChurchHover(church, false)">
          <div class="church-circle">
            <div class="pulse-ring"></div>
          </div>
          <span class="church-icon">⛪</span>
          <span class="church-name" [class.show]="church.isHovered">{{ church.name }}</span>
        </div>
        
        <!-- Journey markers -->
        <div class="journey-marker start" style="left: 15%; top: 75%;">
          <span class="marker-icon">🏠</span>
          <span class="marker-label">Start</span>
        </div>
        
        <div class="journey-marker end" style="left: 85%; top: 20%;">
          <span class="marker-icon">✨</span>
          <span class="marker-label">Goal</span>
        </div>
        
        <!-- Footsteps that follow mouse with rotation -->
        <div 
          *ngFor="let footstep of footsteps"
          class="footstep"
          [class.left-foot]="footstep.isLeft"
          [class.right-foot]="!footstep.isLeft"
          [style.left.px]="footstep.x"
          [style.top.px]="footstep.y"
          [style.opacity]="footstep.opacity"
          [style.transform]="'rotate(' + footstep.rotation + 'deg) translateX(' + (footstep.isLeft ? -3 : 3) + 'px)'">
          👣
        </div>
        
        <!-- Compass -->
        <div class="compass">
          <div class="compass-needle"></div>
          <span class="compass-n">N</span>
        </div>
        
        <!-- Scale indicator -->
        <div class="map-scale">
          <div class="scale-bar"></div>
          <span class="scale-text">5 miles</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./map-container.component.scss']
})
export class MapContainerComponent implements OnInit {
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
  
  churches: Church[] = [];
  footsteps: Footstep[] = [];
  private footstepId = 0;
  private lastFootstepTime = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isLeftFoot = true;

  ngOnInit() {
    this.initializeChurches();
  }

  private initializeChurches() {
    this.churches = [
      { id: 1, x: 20, y: 30, name: 'Bethlehem', scale: 1 },
      { id: 2, x: 70, y: 45, name: 'Jerusalem', scale: 1.2 },
      { id: 3, x: 45, y: 65, name: 'Nazareth', scale: 1 },
      { id: 4, x: 55, y: 25, name: 'Capernaum', scale: 0.9 }
    ];
  }

  onMouseEnter() {
    this.map.isHovered = true;
    // Reset last mouse position when entering
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Cycle through locations
    this.locationIndex = (this.locationIndex + 1) % this.locations.length;
    this.currentLocation = this.locations[this.locationIndex];
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
      this.currentLocation = `Near ${church.name}`;
    } else {
      church.scale = 1;
    }
  }
}