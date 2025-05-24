# Flashcard System Implementation Plan

## Phase 1: Database Foundation

### Step 1: Create migration scripts
- Create SQL migration to add `user_verses` table with confidence_level
- Create deck-related tables (`decks`, `deck_verses`, `saved_decks`, `deck_tags`)
- Create migration script to convert existing range data to individual verses
- Add indexes for performance

### Step 2: Update SQLAlchemy models
- Create `UserVerse` model with confidence tracking
- Create `Deck`, `DeckVerse`, `SavedDeck`, `DeckTag` models
- Update relationships in `User` model
- Remove `UserVerseRange` model references

### Step 3: Run migrations and verify
- Execute migration scripts
- Verify data integrity
- Drop old range tables
- Update database backup procedures

## Phase 2: Backend Verse Tracking API

### Step 1: Update verse endpoints
- Modify `GET /user-verses/{user_id}` to return individual verses with confidence
- Update `PUT /user-verses/{user_id}/{verse_id}` to accept confidence_level
- Remove range-based endpoints
- Add confidence update endpoint

### Step 2: Refactor verse service layer
- Create verse tracking service functions
- Implement confidence level calculations
- Remove range merging logic
- Add batch update capabilities

## Phase 3: Deck Management Backend

### Step 1: Create deck CRUD endpoints
- `POST /decks` - Create deck
- `GET /decks/{deck_id}` - Get deck details
- `PUT /decks/{deck_id}` - Update deck
- `DELETE /decks/{deck_id}` - Delete deck
- `GET /decks/user/{user_id}` - Get user's decks

### Step 2: Implement deck sharing endpoints
- `POST /decks/{deck_id}/save` - Save deck to collection
- `DELETE /decks/{deck_id}/save` - Remove from collection
- `GET /decks/public` - Browse public decks
- `GET /decks/saved/{user_id}` - Get saved decks

### Step 3: Add deck verse management
- `POST /decks/{deck_id}/verses` - Add verses to deck
- `DELETE /decks/{deck_id}/verses` - Remove verses
- `PUT /decks/{deck_id}/verses/order` - Reorder verses
- `GET /decks/{deck_id}/progress` - Get user's progress on deck

## Phase 4: Frontend Foundation Updates

### Step 1: Update Bible models
- Modify `BibleVerse` model to include confidence property
- Remove range-based logic from `BibleData`
- Update verse mapping functions
- Add confidence level display helpers

### Step 2: Update tracker component
- Replace binary memorized state with confidence slider
- Update verse bubble styling for confidence levels
- Modify bulk operations for confidence
- Add confidence visualization

### Step 3: Update Bible service
- Implement individual verse API calls
- Add confidence update methods
- Remove range-based API calls
- Add verse statistics calculations

## Phase 5: Deck Models and Services

### Step 1: Create deck TypeScript models
- Create `Deck`, `DeckVerse` interfaces
- Create `DeckService` for API communication
- Add deck state management
- Create deck utility functions

### Step 2: Create deck management components
- `DeckListComponent` for user's decks
- `DeckCreatorComponent` for new decks
- `DeckEditorComponent` for modifications
- `DeckDetailsComponent` for viewing

## Phase 6: Flashcard Study Interface

### Step 1: Create flashcard components
- `FlashcardComponent` with flip animation
- `StudySessionComponent` for review flow
- `ConfidenceSliderComponent`
- `SessionStatsComponent`

### Step 2: Implement study logic
- Create study session service
- Implement card flipping mechanics
- Add confidence updates on review
- Track session statistics

## Phase 7: Spaced Repetition Algorithm

### Step 1: Implement core algorithm
- Create `SpacedRepetitionService`
- Implement Anki-like algorithm
- Calculate next review dates
- Handle multi-verse cards

### Step 2: Integrate with study flow
- Modify deck verse selection logic
- Update confidence after reviews
- Schedule next reviews
- Handle edge cases

## Phase 8: Deck Discovery and Marketplace

### Step 1: Create browse interface
- `PublicDecksComponent` with search/filter
- `DeckPreviewComponent` with progress pie chart
- `TagFilterComponent`
- `DeckSearchComponent`

### Step 2: Implement social features
- Add save/unsave functionality
- Display save counts
- Show creator information
- Add deck analytics for creators

## Phase 9: Statistics and Visualization

### Step 1: Create statistics components
- `OverallStatsComponent` with Kendo charts
- `DeckStatsComponent` for individual decks
- `SessionHistoryComponent`
- `ProgressVisualizationComponent`

### Step 2: Implement analytics
- Create statistics service
- Calculate review streaks
- Generate progress reports
- Add export functionality

## Phase 10: Initial Content and Polish

### Step 1: Seed starter decks
- Create SQL seed scripts for starter packs
- Add topical verse collections
- Import popular memory verses
- Tag all starter content

### Step 2: Final integration
- Add flashcards to navigation menu
- Implement keyboard shortcuts
- Add help/tutorial system
- Performance optimization

### Step 3: Testing and refinement
- End-to-end testing
- Performance testing with large decks
- Mobile responsiveness
- Bug fixes and polish