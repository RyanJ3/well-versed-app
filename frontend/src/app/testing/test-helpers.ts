import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Provider } from '@angular/core';
import { Action } from '@ngrx/store';

// Helper to create a mock store provider
export const createMockStoreProvider = (initialState: any = {}): Provider => {
  return provideMockStore({ initialState });
};

// Mock services that will be used in effects tests later
export const mockServices = {
  bibleService: {
    getUserReadingProgress: jasmine.createSpy('getUserReadingProgress'),
    markVersesAsRead: jasmine.createSpy('markVersesAsRead'),
    markChapterAsComplete: jasmine.createSpy('markChapterAsComplete'),
    syncProgress: jasmine.createSpy('syncProgress'),
  },
  deckService: {
    getDecks: jasmine.createSpy('getDecks'),
    getDeck: jasmine.createSpy('getDeck'),
    createDeck: jasmine.createSpy('createDeck'),
    updateDeck: jasmine.createSpy('updateDeck'),
    deleteDeck: jasmine.createSpy('deleteDeck'),
    toggleFavorite: jasmine.createSpy('toggleFavorite'),
    getCards: jasmine.createSpy('getCards'),
    createCard: jasmine.createSpy('createCard'),
    importDeck: jasmine.createSpy('importDeck'),
    completeStudySession: jasmine.createSpy('completeStudySession'),
  },
  notificationService: {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info'),
  }
};

// Helper to compare actions
export const expectAction = (actual: Action, expected: Action) => {
  expect(actual.type).toBe(expected.type);
  expect(actual).toEqual(expected);
};