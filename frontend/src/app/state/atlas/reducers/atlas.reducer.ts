import { createReducer, on } from '@ngrx/store';
import { atlasAdapter, initialAtlasState } from '../models/atlas.state';
import * as AtlasActions from '../actions/atlas.actions';

export const atlasReducer = createReducer(
  initialAtlasState,
  
  // Load Journeys
  on(AtlasActions.loadJourneys, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AtlasActions.loadJourneysSuccess, (state, { journeys }) => 
    atlasAdapter.setAll(journeys, {
      ...state,
      loading: false
    })
  ),
  
  on(AtlasActions.loadJourneysFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Single Journey
  on(AtlasActions.loadJourney, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AtlasActions.loadJourneySuccess, (state, { journey, cities }) => 
    atlasAdapter.upsertOne(journey, {
      ...state,
      loading: false,
      selectedJourneyId: journey.journey_id,
      currentCities: cities
    })
  ),
  
  on(AtlasActions.loadJourneyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Select Journey
  on(AtlasActions.selectJourney, (state, { journeyId }) => ({
    ...state,
    selectedJourneyId: journeyId
  })),
  
  // Map Actions
  on(AtlasActions.selectCity, (state, { cityId }) => ({
    ...state,
    mapView: {
      ...state.mapView,
      selectedCityId: cityId
    }
  })),
  
  on(AtlasActions.updateMapView, (state, { center, zoom }) => ({
    ...state,
    mapView: {
      ...state.mapView,
      center,
      zoom
    }
  })),
  
  on(AtlasActions.centerOnCity, (state, { cityId }) => {
    const city = state.currentCities.find(c => c.id === cityId);
    if (!city) return state;
    
    return {
      ...state,
      mapView: {
        ...state.mapView,
        center: city.position,
        zoom: 10,
        selectedCityId: cityId
      }
    };
  }),
  
  // Clear Error
  on(AtlasActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);