# Flashcard Component - Artifact Reference Guide

## Quick Copy Reference

Each file has a TODO comment indicating which artifact to copy from:

### Main Component
- flashcard.component.ts → 'Updated Flashcard Component - TypeScript'
- flashcard.component.html → 'Updated Flashcard Component - HTML'
- flashcard.component.scss → 'Flashcard Component - Main SCSS'
- flashcard-hero.component.scss → 'Flashcard Component - Hero Section SCSS'

### Deck Card Component
- deck-card.component.ts → 'Deck Card Component - TypeScript'
- deck-card.component.html → 'Deck Card Component - HTML'
- deck-card.component.scss → 'Deck Card Component - SCSS'

### Create Deck Modal Component
- create-deck-modal.component.ts → 'Create Deck Modal Component - TypeScript'
- create-deck-modal.component.html → 'Create Deck Modal Component - HTML'
- create-deck-modal.component.scss → 'Create Deck Modal Component - SCSS'

### Deck Filter Component
- deck-filter.component.ts → 'Deck Filter Component - TypeScript'
- deck-filter.component.html → 'Deck Filter Component - HTML'
- deck-filter.component.scss → 'Deck Filter Component - SCSS'

### Shared Styles
- _variables.scss → 'Shared Styles - Variables'
- _animations.scss → 'Shared Styles - Animations'

## Import Path Updates

If your paths differ, update these imports:

### In SCSS files:
- @import './shared/styles/variables';
- @import './shared/styles/animations';

### In TypeScript:
- Update service imports if paths differ
- Update relative component imports
