// frontend/src/app/core/services/atlas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Journey {
  id: number;
  name: string;
  start_year?: number;
  end_year?: number;
  scripture_refs?: string;
}

export interface City {
  id: string;
  name: string;
  modern: string;
  position: [number, number];
  description?: string;
  verses?: string[];
  events?: string[];
  keyFact?: string;
  scriptureText?: string;
  distance: number;
}

export interface JourneyDetail {
  journey: Journey;
  cities: City[];
}

@Injectable({ providedIn: 'root' })
export class AtlasService {
  private apiUrl = `${environment.apiUrl}/atlas`;

  constructor(private http: HttpClient) {}

  getJourneys(): Observable<Journey[]> {
    return this.http.get<Journey[]>(`${this.apiUrl}/journeys`);
  }

  getJourney(journeyId: number): Observable<JourneyDetail> {
    return this.http.get<JourneyDetail>(`${this.apiUrl}/journeys/${journeyId}`);
  }
}
