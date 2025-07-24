// frontend/src/app/state/core/reducers/router.reducer.ts
import { RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Params } from '@angular/router';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

// Get the router state
export const selectRouterState = createSelector(
  selectRouter,
  (router) => router?.state
);

// Helper to get the last activated route
const getLastActivatedRoute = (state: any): any => {
  let route = state?.root;
  while (route?.firstChild) {
    route = route.firstChild;
  }
  return route;
};

export const selectCurrentRoute = createSelector(
  selectRouterState,
  (state) => state
);

export const selectUrl = createSelector(
  selectRouterState,
  (state) => state?.url || ''
);

// Get params from the last activated route
export const selectRouteParams = createSelector(
  selectRouterState,
  (state) => {
    const route = getLastActivatedRoute(state);
    return route?.params || {};
  }
);

export const selectRouteParam = (param: string) =>
  createSelector(selectRouteParams, (params: Params) => params[param]);

// Get query params from the last activated route
export const selectQueryParams = createSelector(
  selectRouterState,
  (state) => {
    const route = getLastActivatedRoute(state);
    return route?.queryParams || {};
  }
);

export const selectQueryParam = (param: string) =>
  createSelector(selectQueryParams, (params: Params) => params[param]);

// Get data from the last activated route
export const selectRouteData = createSelector(
  selectRouterState,
  (state) => {
    const route = getLastActivatedRoute(state);
    return route?.data || {};
  }
);

// Get fragment from the last activated route
export const selectFragment = createSelector(
  selectRouterState,
  (state) => {
    const route = getLastActivatedRoute(state);
    return route?.fragment || '';
  }
);
