import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AtlasState } from '../models/atlas.state';
import { atlasAdapter } from '../models/atlas.state';

export const selectAtlasState = createFeatureSelector<AtlasState>('atlas');

const { selectIds, selectEntities, selectAll, selectTotal } = atlasAdapter.getSelectors();

export const selectAllJourneys = createSelector(
  selectAtlasState,
  selectAll
);

export const selectJourneyEntities = createSelector(
  selectAtlasState,
  selectEntities
);

export const selectJourneyIds = createSelector(
  selectAtlasState,
  selectIds
);

export const selectJourneysTotal = createSelector(
  selectAtlasState,
  selectTotal
);

export const selectSelectedJourneyId = createSelector(
  selectAtlasState,
  (state) => state.selectedJourneyId
);

export const selectSelectedJourney = createSelector(
  selectJourneyEntities,
  selectSelectedJourneyId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectCurrentCities = createSelector(
  selectAtlasState,
  (state) => state.currentCities
);

export const selectAtlasLoading = createSelector(
  selectAtlasState,
  (state) => state.loading
);

export const selectAtlasError = createSelector(
  selectAtlasState,
  (state) => state.error
);

export const selectMapView = createSelector(
  selectAtlasState,
  (state) => state.mapView
);

export const selectSelectedCityId = createSelector(
  selectMapView,
  (mapView) => mapView.selectedCityId
);

export const selectSelectedCity = createSelector(
  selectCurrentCities,
  selectSelectedCityId,
  (cities, selectedId) => selectedId ? cities.find(c => c.id === selectedId) : null
);

export const selectMapCenter = createSelector(
  selectMapView,
  (mapView) => mapView.center
);

export const selectMapZoom = createSelector(
  selectMapView,
  (mapView) => mapView.zoom
);