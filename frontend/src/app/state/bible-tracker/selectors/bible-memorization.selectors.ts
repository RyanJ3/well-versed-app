import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BibleMemorizationState } from '../models/bible-memorization.model';
import { BibleData, BibleTestament, BibleGroup, BibleBook } from '../../../models/bible';

import { ProgressSegment } from "../models/bible-memorization.model";
// Feature selector
export const selectBibleMemorizationState = 
  createFeatureSelector<BibleMemorizationState>('bibleMemorization');

// Sub-state selectors
export const selectMemorizationProgress = createSelector(
  selectBibleMemorizationState,
  state => state.memorization
);

export const selectPreferences = createSelector(
  selectBibleMemorizationState,
  state => state.preferences
);

export const selectStatistics = createSelector(
  selectBibleMemorizationState,
  state => state.statistics
);

export const selectUI = createSelector(
  selectBibleMemorizationState,
  state => state.ui
);

// Specific preference selectors
export const selectIncludeApocrypha = createSelector(
  selectPreferences,
  preferences => preferences.includeApocrypha
);

export const selectProgressViewMode = createSelector(
  selectPreferences,
  preferences => preferences.progressViewMode
);

export const selectUserId = createSelector(
  selectPreferences,
  preferences => preferences.userId
);

// Loading and error states
export const selectIsLoading = createSelector(
  selectMemorizationProgress,
  progress => progress.loading
);

export const selectError = createSelector(
  selectMemorizationProgress,
  progress => progress.error
);

export const selectIsSavingBulk = createSelector(
  selectUI,
  ui => ui.isSavingBulk
);

// The main selector that builds the complete Bible structure with memorization data
export const selectBibleDataWithProgress = createSelector(
  selectMemorizationProgress,
  selectIncludeApocrypha,
  (progress, includeApocrypha) => {
    // Create a new BibleData instance
    const bibleData = new BibleData();
    
    // Apply user preferences
    bibleData.includeApocrypha = includeApocrypha;
    
    // Map the flat verse data to the hierarchical structure
    if (progress.verses && progress.verses.length > 0) {
      bibleData.mapUserVersesToModel(progress.verses);
    }
    
    return bibleData;
  }
);

// Selector for testaments
export const selectTestaments = createSelector(
  selectBibleDataWithProgress,
  bibleData => bibleData.testaments
);

// Selector for specific testament
export const selectTestamentByName = (name: string) => createSelector(
  selectBibleDataWithProgress,
  bibleData => bibleData.getTestamentByName(name)
);

// Progress statistics selectors
export const selectMemorizedVersesCount = createSelector(
  selectBibleDataWithProgress,
  bibleData => bibleData.memorizedVerses
);

export const selectOverallPercentComplete = createSelector(
  selectBibleDataWithProgress,
  bibleData => bibleData.percentComplete
);

// Progress segments for visualization
export const selectProgressSegments = createSelector(
  selectStatistics,
  statistics => statistics.progressSegments
);

// Navigation selectors
export const selectSelectedBookId = createSelector(
  selectUI,
  ui => ui.selectedBookId
);

export const selectSelectedChapter = createSelector(
  selectUI,
  ui => ui.selectedChapter
);

// Data freshness selector
export const selectIsDataStale = createSelector(
  selectMemorizationProgress,
  progress => {
    if (!progress.lastFetch) return true;
    
    const lastFetchTime = new Date(progress.lastFetch).getTime();
    const now = Date.now();
    const staleTime = progress.staleTime || 5 * 60 * 1000; // Default 5 minutes
    
    return (now - lastFetchTime) > staleTime;
  }
);

// Memoized selector for expensive calculations
export const selectDetailedProgressSegments = createSelector(
  selectBibleDataWithProgress,
  selectProgressViewMode,
  (bibleData, viewMode) => {
    // This expensive calculation only runs when inputs change
    if (viewMode === 'testament') {
      return calculateTestamentSegments(bibleData);
    } else {
      return calculateGroupSegments(bibleData);
    }
  }
);

// Helper functions for segment calculations
function calculateTestamentSegments(bibleData: BibleData): ProgressSegment[] {
  const segments: ProgressSegment[] = [];
  const totalVerses = bibleData.totalVerses;
  
  bibleData.testaments.forEach(testament => {
    if (testament.memorizedVerses > 0) {
      segments.push({
        name: testament.name,
        shortName: getTestamentShortName(testament.name),
        percent: Math.round((testament.memorizedVerses / totalVerses) * 100),
        color: getTestamentColor(testament.name),
        verses: testament.memorizedVerses
      });
    }
  });
  
  // Add remaining segment
  const memorizedTotal = segments.reduce((sum, seg) => sum + seg.verses, 0);
  const remaining = totalVerses - memorizedTotal;
  if (remaining > 0) {
    segments.push({
      name: 'Remaining',
      shortName: '',
      percent: Math.round((remaining / totalVerses) * 100),
      color: '#e5e7eb',
      verses: remaining
    });
  }
  
  return segments;
}

function calculateGroupSegments(bibleData: BibleData): ProgressSegment[] {
  const segments: ProgressSegment[] = [];
  const totalVerses = bibleData.totalVerses;
  const groupColors: Record<string, string> = {
    'Law': '#10b981',
    'History': '#3b82f6',
    'Wisdom': '#8b5cf6',
    'Major Prophets': '#f59e0b',
    'Minor Prophets': '#ef4444',
    'Gospels': '#10b981',
    'Acts': '#3b82f6',
    'Pauline Epistles': '#8b5cf6',
    'General Epistles': '#f59e0b',
    'Revelation': '#ef4444'
  };
  
  // Collect all groups from all testaments
  const allGroups: BibleGroup[] = [];
  bibleData.testaments.forEach(testament => {
    allGroups.push(...testament.groups);
  });
  
  // Create segments for groups with memorized verses
  allGroups.forEach(group => {
    if (group.memorizedVerses > 0) {
      segments.push({
        name: group.name,
        shortName: getGroupShortName(group.name),
        percent: Math.round((group.memorizedVerses / totalVerses) * 100),
        color: groupColors[group.name] || '#6b7280',
        verses: group.memorizedVerses
      });
    }
  });
  
  // Add remaining segment
  const memorizedTotal = segments.reduce((sum, seg) => sum + seg.verses, 0);
  const remaining = totalVerses - memorizedTotal;
  if (remaining > 0) {
    segments.push({
      name: 'Remaining',
      shortName: '',
      percent: Math.round((remaining / totalVerses) * 100),
      color: '#e5e7eb',
      verses: remaining
    });
  }
  
  return segments;
}

// Helper functions
function getTestamentShortName(name: string): string {
  const shortNames: Record<string, string> = {
    'Old Testament': 'OT',
    'New Testament': 'NT',
    'Apocrypha': 'Apoc.'
  };
  return shortNames[name] || name;
}

function getTestamentColor(name: string): string {
  const colors: Record<string, string> = {
    'Old Testament': '#f59e0b',
    'New Testament': '#6366f1',
    'Apocrypha': '#8b5cf6'
  };
  return colors[name] || '#6b7280';
}

function getGroupShortName(groupName: string): string {
  const shortNames: Record<string, string> = {
    'Law': 'Law',
    'History': 'History',
    'Wisdom': 'Wisdom',
    'Major Prophets': 'Major',
    'Minor Prophets': 'Minor',
    'Gospels': 'Gospels',
    'Acts': 'Acts',
    'Pauline Epistles': 'Pauline',
    'General Epistles': 'General',
    'Revelation': 'Rev'
  };
  return shortNames[groupName] || groupName;
}
