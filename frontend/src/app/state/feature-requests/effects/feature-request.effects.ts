import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import { FeatureRequestService } from '@services/api/feature-request.service';
import * as FeatureRequestActions from '../actions/feature-request.actions';

@Injectable()
export class FeatureRequestEffects {
  loadFeatureRequests$;
  loadFeatureRequest$;
  createFeatureRequest$;
  voteOnRequest$;
  removeVote$;
  loadComments$;
  addComment$;
  loadTrendingRequests$;
  loadUserRequests$;

  constructor(
    private actions$: Actions,
    private featureRequestService: FeatureRequestService
  ) {
    this.loadFeatureRequests$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.loadFeatureRequests),
        mergeMap((action) =>
          this.featureRequestService.getFeatureRequests(
            action.page,
            action.perPage,
            action.requestType,
            action.status,
            action.sortBy || 'upvotes',
            action.search
          ).pipe(
            map(response => FeatureRequestActions.loadFeatureRequestsSuccess({
              requests: response.requests,
              total: response.total,
              page: response.page,
              perPage: response.per_page
            })),
            catchError(error => of(FeatureRequestActions.loadFeatureRequestsFailure({
              error: error.message || 'Failed to load feature requests'
            })))
          )
        )
      )
    );

    this.loadFeatureRequest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.loadFeatureRequest),
        mergeMap((action) =>
          this.featureRequestService.getFeatureRequest(action.requestId).pipe(
            map(request => FeatureRequestActions.loadFeatureRequestSuccess({ request })),
            catchError(error => of(FeatureRequestActions.loadFeatureRequestFailure({
              error: error.message || 'Failed to load feature request'
            })))
          )
        )
      )
    );

    this.createFeatureRequest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.createFeatureRequest),
        mergeMap((action) =>
          this.featureRequestService.createFeatureRequest(action.request, action.userId).pipe(
            map(request => FeatureRequestActions.createFeatureRequestSuccess({ request })),
            catchError(error => of(FeatureRequestActions.createFeatureRequestFailure({
              error: error.message || 'Failed to create feature request'
            })))
          )
        )
      )
    );

    this.voteOnRequest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.voteOnRequest),
        mergeMap((action) =>
          this.featureRequestService.voteOnRequest(action.requestId, action.voteType, action.userId).pipe(
            map(() => FeatureRequestActions.voteOnRequestSuccess({
              requestId: action.requestId,
              voteType: action.voteType
            })),
            catchError(error => of(FeatureRequestActions.voteOnRequestFailure({
              error: error.message || 'Failed to vote on request'
            })))
          )
        )
      )
    );

    this.removeVote$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.removeVote),
        mergeMap((action) =>
          this.featureRequestService.removeVote(action.requestId, action.userId).pipe(
            map(() => FeatureRequestActions.removeVoteSuccess({
              requestId: action.requestId
            })),
            catchError(error => of(FeatureRequestActions.removeVoteFailure({
              error: error.message || 'Failed to remove vote'
            })))
          )
        )
      )
    );

    this.loadComments$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.loadComments),
        mergeMap((action) =>
          this.featureRequestService.getComments(action.requestId).pipe(
            map(comments => FeatureRequestActions.loadCommentsSuccess({
              requestId: action.requestId,
              comments
            })),
            catchError(error => of(FeatureRequestActions.loadCommentsFailure({
              error: error.message || 'Failed to load comments'
            })))
          )
        )
      )
    );

    this.addComment$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.addComment),
        mergeMap((action) =>
          this.featureRequestService.addComment(action.requestId, action.comment, action.userId).pipe(
            map(comment => FeatureRequestActions.addCommentSuccess({
              requestId: action.requestId,
              comment
            })),
            catchError(error => of(FeatureRequestActions.addCommentFailure({
              error: error.message || 'Failed to add comment'
            })))
          )
        )
      )
    );

    this.loadTrendingRequests$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.loadTrendingRequests),
        mergeMap((action) =>
          this.featureRequestService.getTrendingRequests(action.limit).pipe(
            map(requests => FeatureRequestActions.loadTrendingRequestsSuccess({ requests })),
            catchError(error => of(FeatureRequestActions.loadTrendingRequestsFailure({
              error: error.message || 'Failed to load trending requests'
            })))
          )
        )
      )
    );

    this.loadUserRequests$ = createEffect(() =>
      this.actions$.pipe(
        ofType(FeatureRequestActions.loadUserRequests),
        mergeMap((action) =>
          this.featureRequestService.getUserRequests(action.userId).pipe(
            map(requests => FeatureRequestActions.loadUserRequestsSuccess({ requests })),
            catchError(error => of(FeatureRequestActions.loadUserRequestsFailure({
              error: error.message || 'Failed to load user requests'
            })))
          )
        )
      )
    );
  }
}