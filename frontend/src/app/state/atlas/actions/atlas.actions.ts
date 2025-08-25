import { createAction, props } from '@ngrx/store';
import { BiblicalJourney } from '@features/scripture-atlas/models/journey.models';
import { City } from '@services/api/atlas.service';

// Load Journeys
export const loadJourneys = createAction('[Atlas] Load Journeys');

export const loadJourneysSuccess = createAction(
  '[Atlas] Load Journeys Success',
  props<{ journeys: BiblicalJourney[] }>()
);

export const loadJourneysFailure = createAction(
  '[Atlas] Load Journeys Failure',
  props<{ error: string }>()
);

// Load Single Journey
export const loadJourney = createAction(
  '[Atlas] Load Journey',
  props<{ journeyId: number }>()
);

export const loadJourneySuccess = createAction(
  '[Atlas] Load Journey Success',
  props<{ journey: BiblicalJourney; cities: City[] }>()
);

export const loadJourneyFailure = createAction(
  '[Atlas] Load Journey Failure',
  props<{ error: string }>()
);

// Select Journey
export const selectJourney = createAction(
  '[Atlas] Select Journey',
  props<{ journeyId: number }>()
);

// Map Actions
export const selectCity = createAction(
  '[Atlas] Select City',
  props<{ cityId: string }>()
);

export const updateMapView = createAction(
  '[Atlas] Update Map View',
  props<{ center: [number, number]; zoom: number }>()
);

export const centerOnCity = createAction(
  '[Atlas] Center On City',
  props<{ cityId: string }>()
);

// Clear Error
export const clearError = createAction('[Atlas] Clear Error');