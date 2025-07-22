import { Injectable } from '@angular/core';
import { catchError, of, Observable } from 'rxjs';
import { Action } from '@ngrx/store';

@Injectable()
export abstract class BaseEffect {
  protected handleError<T extends Action>(
    action: (error: string) => T
  ) {
    return (error: any): Observable<T> => {
      console.error('Effect Error:', error);
      const errorMessage = error?.error?.message || error?.message || 'An error occurred';
      return of(action(errorMessage));
    };
  }
  
  protected handleHttpError<T extends Action>(
    actionCreator: (error: string) => T
  ) {
    return catchError<any, Observable<T>>((error: any) => {
      let errorMessage = 'An error occurred';
      
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      return of(actionCreator(errorMessage));
    });
  }
}
