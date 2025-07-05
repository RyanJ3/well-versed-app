// Type definitions for Scripture Atlas with proper null handling

export type Testament = 'Old Testament' | 'New Testament';
export type MapView = '2d' | '3d' | 'historical';
export type JourneyType = 'missionary' | 'exodus' | 'ministry' | 'timeline' | 'other';
export type TravelMode = 'walk' | 'boat' | 'divine' | 'horse' | 'chariot';

export interface BiblicalJourney {
  journey_id: number;
  name: string;
  testament: Testament;
  journey_type: JourneyType | null;
  journey_order: number | null;
  start_year: number | null;
  end_year: number | null;
  scripture_refs: string | null;
  description: string | null;
  color: string;
  waypoints: JourneyWaypoint[];
  segments: JourneySegment[];
}

export interface JourneyWaypoint {
  waypoint_id?: number;
  position: number;
  location_name: string;
  modern_name: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  events?: JourneyEvent[];
  distance_from_start: number | null;
}

export interface JourneySegment {
  from: JourneyWaypoint;
  to: JourneyWaypoint;
  events: JourneyEvent[];
  distance?: number;
  dayRange?: string;
  travelMode?: string;
  description?: string;
}

export interface JourneyEvent {
  title: string;
  description: string;
  scriptures?: string[];
  visualEffect?: 'divine-light' | 'storm' | 'earthquake' | 'miracle' | 'teaching' | 'conflict';
}

export interface HistoricalBuilding {
  name: string;
  type: 'temple' | 'wall' | 'gate' | 'house' | 'palace';
  height: number;
  coords: number[][];
}

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  ancientName?: string;
  elevation?: number;
  historicalBuildings?: HistoricalBuilding[];
}

// API Response types
export interface JourneyResponse {
  journey_id: number;
  name: string;
  testament: string;
  journey_type: string | null;
  journey_order: number | null;
  start_year: number | null;
  end_year: number | null;
  scripture_refs: string | null;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  waypoints?: WaypointResponse[];
}

export interface WaypointResponse {
  waypoint_id: number;
  journey_id: number;
  position: number;
  location_name: string;
  modern_name: string | null;
  latitude: string;
  longitude: string;
  description: string | null;
  events: any | null;
  distance_from_start: number | null;
  created_at: string;
}

// Color schemes for different journey types
export const JOURNEY_COLORS = {
  missionary: '#4169E1',    // Royal Blue
  exodus: '#8B4513',        // Saddle Brown
  ministry: '#FFD700',      // Gold
  timeline: '#800080',      // Purple
  other: '#666666'          // Gray
};

// Default map settings
export const MAP_DEFAULTS = {
  center: { lat: 31.7683, lng: 35.2137 }, // Jerusalem
  zoom: 7,
  pitch: 45,
  bearing: -17.6
};