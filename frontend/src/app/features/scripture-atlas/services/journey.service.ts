import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { BiblicalJourney, JourneyWaypoint, JourneySegment } from '../models/journey.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JourneyService {
  private apiUrl = `${environment.apiUrl}/atlas/journeys`; // Fixed: /atlas/journeys endpoint
  
  constructor(private http: HttpClient) {}
  
  getJourneys(): Observable<BiblicalJourney[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      switchMap(journeys => {
        // For each journey, fetch its full details with waypoints
        const journeyRequests = journeys.map(j => this.getJourney(j.id));
        return journeyRequests.length > 0 ? 
          Promise.all(journeyRequests.map(req => req.toPromise())) : 
          of([]);
      }),
      map(journeys => journeys.filter(j => j !== undefined) as BiblicalJourney[])
    );
  }
  
  getJourney(id: number): Observable<BiblicalJourney> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.transformJourney(response))
    );
  }
  
  private transformJourney(data: any): BiblicalJourney {
    // Handle the response structure from backend
    const journeyData = data.journey || data;
    const waypointsData = data.waypoints || [];
    
    const waypoints: JourneyWaypoint[] = waypointsData.map((wp: any) => ({
      waypoint_id: wp.waypoint_id,
      position: wp.position,
      location_name: wp.location_name,
      modern_name: wp.modern_name,
      latitude: parseFloat(wp.latitude),
      longitude: parseFloat(wp.longitude),
      description: wp.description,
      events: this.parseEvents(wp.events),
      distance_from_start: wp.distance_from_start
    }));
    
    // Create segments from waypoints
    const segments: JourneySegment[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      // Extract events for this segment (from the 'from' waypoint)
      const segmentEvents = from.events || [];
      
      segments.push({
        from,
        to,
        events: segmentEvents,
        distance: this.calculateDistance(from, to),
        travelMode: this.inferTravelMode(from, to, journeyData.journey_type),
        description: from.description || undefined
      });
    }
    
    return {
      journey_id: journeyData.id || journeyData.journey_id,
      name: journeyData.name,
      testament: journeyData.testament,
      journey_type: journeyData.journey_type,
      journey_order: journeyData.journey_order,
      start_year: journeyData.start_year,
      end_year: journeyData.end_year,
      scripture_refs: journeyData.scripture_refs,
      description: journeyData.description,
      color: journeyData.color || this.getDefaultColor(journeyData.testament),
      waypoints,
      segments
    };
  }
  
  private parseEvents(eventsData: any): any[] {
    if (!eventsData) return [];
    
    // Handle both JSON string and object
    if (typeof eventsData === 'string') {
      try {
        const parsed = JSON.parse(eventsData);
        return parsed.events || [];
      } catch {
        return [];
      }
    }
    
    // If it's already an object
    return eventsData.events || [];
  }
  
  private calculateDistance(from: JourneyWaypoint, to: JourneyWaypoint): number {
    // If we have distance_from_start, use it
    if (to.distance_from_start !== null && from.distance_from_start !== null) {
      return to.distance_from_start - from.distance_from_start;
    }
    
    // Otherwise calculate haversine distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const lat1 = this.toRad(from.latitude);
    const lat2 = this.toRad(to.latitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  private inferTravelMode(from: JourneyWaypoint, to: JourneyWaypoint, journeyType: string | null): string {
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
      { name: 'Malta', type: 'island' },
      { name: 'Salamis', type: 'port' },
      { name: 'Paphos', type: 'port' },
      { name: 'Seleucia', type: 'port' },
      { name: 'Troas', type: 'port' }
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