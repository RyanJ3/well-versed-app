import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { BiblicalJourney, JourneySegment, Testament } from '@models/journey.models';

@Injectable({
  providedIn: 'root'
})
export class JourneyStateService {
  // State subjects
  private journeysSubject = new BehaviorSubject<BiblicalJourney[]>([]);
  private selectedTestamentSubject = new BehaviorSubject<Testament>('Old Testament');
  private currentJourneyIdSubject = new BehaviorSubject<number | null>(null);
  private currentSegmentIndexSubject = new BehaviorSubject<number>(0);
  
  // Public observables
  journeys$ = this.journeysSubject.asObservable();
  selectedTestament$ = this.selectedTestamentSubject.asObservable();
  currentJourneyId$ = this.currentJourneyIdSubject.asObservable();
  currentSegmentIndex$ = this.currentSegmentIndexSubject.asObservable();
  
  // Derived observables
  filteredJourneys$: Observable<BiblicalJourney[]> = combineLatest([
    this.journeys$,
    this.selectedTestament$
  ]).pipe(
    map(([journeys, testament]) => 
      journeys.filter(j => j.testament === testament)
        .sort((a, b) => (a.journey_order || 99) - (b.journey_order || 99))
    )
  );
  
  currentJourney$: Observable<BiblicalJourney | null> = combineLatest([
    this.journeys$,
    this.currentJourneyId$
  ]).pipe(
    map(([journeys, id]) => 
      id !== null ? journeys.find(j => j.journey_id === id) || null : null
    )
  );
  
  currentSegment$: Observable<JourneySegment | null> = combineLatest([
    this.currentJourney$,
    this.currentSegmentIndex$
  ]).pipe(
    map(([journey, index]) => 
      journey && journey.segments ? journey.segments[index] || null : null
    )
  );
  
  totalSegments$: Observable<number> = this.currentJourney$.pipe(
    map(journey => journey?.segments?.length || 0)
  );
  
  // Methods
  setJourneys(journeys: BiblicalJourney[]) {
    this.journeysSubject.next(journeys);
  }
  
  filterByTestament(testament: Testament) {
    this.selectedTestamentSubject.next(testament);
  }
  
  selectJourney(journeyId: number) {
    this.currentJourneyIdSubject.next(journeyId);
    this.currentSegmentIndexSubject.next(0); // Reset to first segment
  }
  
  nextSegment() {
    const currentJourney = this.journeysSubject.value.find(
      j => j.journey_id === this.currentJourneyIdSubject.value
    );
    
    if (currentJourney && currentJourney.segments) {
      const currentIndex = this.currentSegmentIndexSubject.value;
      if (currentIndex < currentJourney.segments.length - 1) {
        this.currentSegmentIndexSubject.next(currentIndex + 1);
      }
    }
  }
  
  previousSegment() {
    const currentIndex = this.currentSegmentIndexSubject.value;
    if (currentIndex > 0) {
      this.currentSegmentIndexSubject.next(currentIndex - 1);
    }
  }
  
  setSegmentIndex(index: number) {
    this.currentSegmentIndexSubject.next(index);
  }
  
  reset() {
    this.currentJourneyIdSubject.next(null);
    this.currentSegmentIndexSubject.next(0);
  }
}