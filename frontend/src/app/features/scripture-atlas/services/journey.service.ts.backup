import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BiblicalJourney, JourneyWaypoint, JourneySegment } from '../models/journey.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JourneyService {
  private apiUrl = `${environment.apiUrl}/journeys`;
  
  constructor(private http: HttpClient) {}
  
  getJourneys(): Observable<BiblicalJourney[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(journeys => journeys.map(journey => this.transformJourney(journey)))
    );
  }
  
  getJourney(id: number): Observable<BiblicalJourney> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(journey => this.transformJourney(journey))
    );
  }
  
  private transformJourney(data: any): BiblicalJourney {
    const waypoints: JourneyWaypoint[] = data.waypoints?.map((wp: any) => ({
      waypoint_id: wp.waypoint_id,
      position: wp.position,
      location_name: wp.location_name,
      modern_name: wp.modern_name,
      latitude: parseFloat(wp.latitude),
      longitude: parseFloat(wp.longitude),
      description: wp.description,
      events: wp.events?.events || [],
      distance_from_start: wp.distance_from_start
    })) || [];
    
    // Create segments from waypoints
    const segments: JourneySegment[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      // Extract events for this segment
      const segmentEvents = from.events || [];
      
      segments.push({
        from,
        to,
        events: segmentEvents,
        distance: (to.distance_from_start || 0) - (from.distance_from_start || 0),
        travelMode: this.inferTravelMode(from, to, data.journey_type),
        description: from.description || undefined
      });
    }
    
    return {
      journey_id: data.journey_id,
      name: data.name,
      testament: data.testament,
      journey_type: data.journey_type,
      journey_order: data.journey_order,
      start_year: data.start_year,
      end_year: data.end_year,
      scripture_refs: data.scripture_refs,
      description: data.description,
      color: data.color || this.getDefaultColor(data.testament),
      waypoints,
      segments
    };
  }
  
  private inferTravelMode(from: JourneyWaypoint, to: JourneyWaypoint, journeyType: string): string {
    // Check if crossing water
    if (this.isCrossingWater(from, to)) {
      return 'boat';
    }
    
    // Special cases
    if (journeyType === 'exodus' && from.location_name.includes('Red Sea')) {
      return 'divine';
    }
    
    return 'walk';
  }
  
  private isCrossingWater(from: JourneyWaypoint, to: JourneyWaypoint): boolean {
    // Simple heuristic - could be enhanced with actual geography data
    const waterCrossings = [
      { name: 'Cyprus', type: 'island' },
      { name: 'Crete', type: 'island' },
      { name: 'Malta', type: 'island' }
    ];
    
    return waterCrossings.some(crossing => 
      from.location_name.includes(crossing.name) || 
      to.location_name.includes(crossing.name)
    );
  }
  
  private getDefaultColor(testament: string): string {
    return testament === 'Old Testament' ? '#8B4513' : '#4169E1';
  }
}