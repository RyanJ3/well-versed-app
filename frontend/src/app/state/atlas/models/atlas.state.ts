import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { BiblicalJourney } from '@features/scripture-atlas/models/journey.models';
import { City } from '@services/api/atlas.service';

export interface AtlasState extends EntityState<BiblicalJourney> {
  selectedJourneyId: number | null;
  currentCities: City[];
  loading: boolean;
  error: string | null;
  mapView: {
    center: [number, number];
    zoom: number;
    selectedCityId: string | null;
  };
}

export const atlasAdapter: EntityAdapter<BiblicalJourney> = createEntityAdapter<BiblicalJourney>({
  selectId: (journey: BiblicalJourney) => journey.journey_id,
  sortComparer: (a: BiblicalJourney, b: BiblicalJourney) => 
    (a.journey_order || 0) - (b.journey_order || 0)
});

export const initialAtlasState: AtlasState = atlasAdapter.getInitialState({
  selectedJourneyId: null,
  currentCities: [],
  loading: false,
  error: null,
  mapView: {
    center: [35.2137, 31.7683], // Jerusalem coordinates
    zoom: 7,
    selectedCityId: null
  }
});