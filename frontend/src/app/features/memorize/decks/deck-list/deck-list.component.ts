import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '@app/state';
import { DeckActions } from '@app/state/decks';
import {
  selectFilteredDecks,
  selectDecksLoading,
  selectDeckStatistics,
  selectFilter,
  selectViewMode,
} from '@app/state/decks/selectors/deck.selectors';
import { DeckCategory } from '@app/state/decks/models/deck.model';

@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [CommonModule /* other imports */],
  template: `
    <div class="deck-list">
      <!-- Header -->
      <div class="deck-list-header">
        <h1>My Flashcard Decks</h1>
        <button class="create-btn" (click)="createDeck()">
          <i class="icon-plus"></i>
          Create New Deck
        </button>
      </div>

      <!-- Statistics -->
      <div class="deck-stats" *ngIf="statistics$ | async as stats">
        <div class="stat">
          <span class="value">{{ stats.totalDecks }}</span>
          <span class="label">Decks</span>
        </div>
        <div class="stat">
          <span class="value">{{ stats.totalCards }}</span>
          <span class="label">Cards</span>
        </div>
        <div class="stat">
          <span class="value">{{ stats.totalDueCards }}</span>
          <span class="label">Due Today</span>
        </div>
        <div class="stat">
          <span class="value"
            >{{ stats.averageMastery | number: '1.0-0' }}%</span
          >
          <span class="label">Avg Mastery</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="deck-filters">
        <input
          type="text"
          placeholder="Search decks..."
          [value]="(filter$ | async)?.searchTerm"
          (input)="updateSearch($event)"
        />

        <select (change)="filterByCategory($event)">
          <option value="">All Categories</option>
          <option *ngFor="let cat of categories" [value]="cat">
            {{ cat | titlecase }}
          </option>
        </select>

        <label class="filter-toggle">
          <input
            type="checkbox"
            [checked]="(filter$ | async)?.showOnlyDue"
            (change)="toggleDueFilter()"
          />
          Show only due
        </label>

        <label class="filter-toggle">
          <input
            type="checkbox"
            [checked]="(filter$ | async)?.showOnlyFavorites"
            (change)="toggleFavoritesFilter()"
          />
          Favorites only
        </label>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading$ | async">
        <app-spinner></app-spinner>
      </div>

      <!-- Deck Grid/List -->
      <div
        class="decks-container"
        [class.grid-view]="(viewMode$ | async) === 'grid'"
        [class.list-view]="(viewMode$ | async) === 'list'"
      >
        <app-deck-card
          *ngFor="let deck of decks$ | async; trackBy: trackByDeckId"
          [deck]="deck"
          [viewMode]="viewMode$ | async"
          (click)="selectDeck(deck.id)"
          (favoriteToggled)="toggleFavorite(deck.id)"
          (editClicked)="editDeck(deck.id)"
          (deleteClicked)="deleteDeck(deck.id)"
        >
        </app-deck-card>

        <!-- Empty State -->
        <div
          class="empty-state"
          *ngIf="(decks$ | async)?.length === 0 && !(loading$ | async)"
        >
          <img src="/assets/empty-decks.svg" alt="No decks" />
          <h3>No decks found</h3>
          <p>Create your first deck to start memorizing!</p>
          <button class="create-btn" (click)="createDeck()">Create Deck</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./deck-list.component.scss'],
})
export class DeckListComponent implements OnInit {
  decks$ = this.store.select(selectFilteredDecks);
  loading$ = this.store.select(selectDecksLoading);
  statistics$ = this.store.select(selectDeckStatistics);
  filter$ = this.store.select(selectFilter);
  viewMode$ = this.store.select(selectViewMode);

  categories = Object.values(DeckCategory);

  private store = inject(Store<AppState>);
  private router = inject(Router);

  ngOnInit(): void {
    this.store.dispatch(DeckActions.init());
  }

  createDeck(): void {
    this.store.dispatch(DeckActions.toggleCreating());
  }

  selectDeck(deckId: number): void {
    this.store.dispatch(DeckActions.selectDeck({ deckId }));
    this.router.navigate(['/app/memorize/decks', deckId]);
  }

  editDeck(deckId: number): void {
    this.router.navigate(['/app/memorize/decks', deckId, 'edit']);
  }

  deleteDeck(deckId: number): void {
    if (confirm('Are you sure you want to delete this deck?')) {
      this.store.dispatch(DeckActions.deleteDeck({ deckId }));
    }
  }

  toggleFavorite(deckId: number): void {
    this.store.dispatch(DeckActions.toggleFavorite({ deckId }));
  }

  updateSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.store.dispatch(
      DeckActions.setFilter({
        filter: { searchTerm },
      }),
    );
  }

  filterByCategory(event: Event): void {
    const category = (event.target as HTMLSelectElement).value;
    this.store.dispatch(
      DeckActions.setFilter({
        filter: {
          categories: category ? [category as DeckCategory] : [],
        },
      }),
    );
  }

  toggleDueFilter(): void {
    this.store.dispatch(
      DeckActions.setFilter({
        filter: { showOnlyDue: true },
      }),
    );
  }

  toggleFavoritesFilter(): void {
    this.store.dispatch(
      DeckActions.setFilter({
        filter: { showOnlyFavorites: true },
      }),
    );
  }

  trackByDeckId(index: number, deck: any): number {
    return deck.id;
  }
}
