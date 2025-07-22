import { ActionReducer, MetaReducer } from '@ngrx/store';

// Logger meta-reducer for development
export function logger(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state: any, action: any) => {
    console.group(action.type);
    console.log('Previous State:', state);
    console.log('Action:', action);
    
    const nextState = reducer(state, action);
    
    console.log('Next State:', nextState);
    console.groupEnd();
    
    return nextState;
  };
}

// State freeze meta-reducer to prevent mutations
export function stateFreeze(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state: any, action: any) => {
    if (state) {
      deepFreeze(state);
    }
    
    const nextState = reducer(state, action);
    
    if (nextState) {
      deepFreeze(nextState);
    }
    
    return nextState;
  };
}

function deepFreeze(obj: any): void {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
}

// Export meta reducers for development
export const metaReducers: MetaReducer<any>[] = [logger, stateFreeze];