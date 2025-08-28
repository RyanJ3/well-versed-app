import { Injectable } from '@angular/core';

export interface GridPosition {
  x: number;
  y: number;
  occupied: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GridPositionService {
  private gridPositions: GridPosition[] = [];
  private readonly POSITION_OCCUPATION_TIME = 5000;

  initializeGrid(): void {
    const positions: GridPosition[] = [];
    
    // Top row (above form)
    this.addTopRowPositions(positions);
    
    // Side positions (left and right of form)
    this.addSidePositions(positions);
    
    // Bottom row (below form, above footer)
    this.addBottomRowPositions(positions);
    
    // Shuffle for random initial distribution
    this.gridPositions = positions.sort(() => Math.random() - 0.5);
  }

  getRandomPosition(): { x: number; y: number } {
    const availablePositions = this.gridPositions.filter(p => !p.occupied);
    
    if (availablePositions.length === 0) {
      this.gridPositions.forEach(p => p.occupied = false);
      return this.getRandomPosition();
    }
    
    const position = this.selectAndOccupyPosition(availablePositions);
    this.adjustPositionForMobile(position);
    
    return { x: position.x, y: position.y };
  }

  getGridPositions(): GridPosition[] {
    return this.gridPositions;
  }

  setGridPositions(positions: GridPosition[]): void {
    this.gridPositions = positions;
  }

  reset(): void {
    this.gridPositions = [];
  }

  private addTopRowPositions(positions: GridPosition[]): void {
    positions.push(
      { x: 5 + Math.random() * 10, y: 5 + Math.random() * 10, occupied: false },
      { x: 25 + Math.random() * 10, y: 5 + Math.random() * 10, occupied: false },
      { x: 55 + Math.random() * 10, y: 5 + Math.random() * 10, occupied: false },
      { x: 75 + Math.random() * 10, y: 5 + Math.random() * 10, occupied: false }
    );
  }

  private addSidePositions(positions: GridPosition[]): void {
    // Left side
    positions.push(
      { x: 3 + Math.random() * 12, y: 25 + Math.random() * 10, occupied: false },
      { x: 3 + Math.random() * 12, y: 45 + Math.random() * 10, occupied: false },
      { x: 3 + Math.random() * 12, y: 65 + Math.random() * 10, occupied: false }
    );
    
    // Right side
    positions.push(
      { x: 75 + Math.random() * 12, y: 25 + Math.random() * 10, occupied: false },
      { x: 75 + Math.random() * 12, y: 45 + Math.random() * 10, occupied: false },
      { x: 75 + Math.random() * 12, y: 65 + Math.random() * 10, occupied: false }
    );
  }

  private addBottomRowPositions(positions: GridPosition[]): void {
    positions.push(
      { x: 10 + Math.random() * 10, y: 75 + Math.random() * 8, occupied: false },
      { x: 70 + Math.random() * 10, y: 75 + Math.random() * 8, occupied: false }
    );
  }

  private selectAndOccupyPosition(availablePositions: GridPosition[]): GridPosition {
    const index = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions[index];
    position.occupied = true;
    
    // Release position after timeout
    setTimeout(() => {
      position.occupied = false;
    }, this.POSITION_OCCUPATION_TIME);
    
    return position;
  }

  private adjustPositionForMobile(position: GridPosition): void {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    
    // Push elements further to edges on mobile
    if (position.x < 20) {
      position.x = Math.max(2, position.x - 5);
    } else if (position.x > 70) {
      position.x = Math.min(88, position.x + 5);
    }
    
    if (position.y < 20) {
      position.y = Math.max(2, position.y - 5);
    }
  }
}