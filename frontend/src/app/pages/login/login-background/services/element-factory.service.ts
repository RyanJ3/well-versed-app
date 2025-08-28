import { Injectable } from '@angular/core';
import { FloatingCard } from '../components/floating-card/floating-card.component';
import { ProgressRing } from '../components/progress-ring/progress-ring.component';
import { ProgressBar } from '../components/progress-bar/progress-bar.component';
import { VerseSnippet } from '../components/verse-snippet/verse-snippet.component';
import { BiblicalText } from '../components/biblical-text/biblical-text.component';
import { MapContainer } from '../components/map-container/map-container.component';
import { VerseData, BiblicalWord } from '../data/biblical-content';

export interface ElementDistribution {
  floatingCards: number;
  progressRings: number;
  progressBars: number;
  verseSnippets: number;
  biblicalTexts: number;
  mapContainers: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElementFactoryService {
  
  readonly DEFAULT_DISTRIBUTION: ElementDistribution = {
    floatingCards: 3,
    progressRings: 1,
    progressBars: 1,
    verseSnippets: 3,
    biblicalTexts: 3,
    mapContainers: 1
  };

  createFloatingCards(
    verses: VerseData[],
    getPosition: () => { x: number; y: number }
  ): FloatingCard[] {
    return verses.map((verseData, index) => ({
      id: index + 1,
      verse: verseData.verse,
      reference: verseData.reference,
      ...getPosition(),
      rotation: 0,
      animationDelay: `${index * 2}s`,
      depth: 1 - (index * 0.05),
      isFlipped: false,
      visible: false
    }));
  }

  createProgressRings(
    count: number,
    getPosition: () => { x: number; y: number }
  ): ProgressRing[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      progress: 0,
      targetProgress: 100,
      ...getPosition(),
      size: 80,
      animationDelay: `${index + 1}s`,
      isHovered: false,
      visible: false
    }));
  }

  createProgressBars(
    count: number,
    getPosition: () => { x: number; y: number }
  ): ProgressBar[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      progress: 0,
      targetProgress: 100,
      ...getPosition(),
      width: 150,
      animationDelay: `${index + 2}s`,
      isHovered: false,
      visible: false
    }));
  }

  createVerseSnippets(
    snippets: string[],
    getPosition: () => { x: number; y: number }
  ): VerseSnippet[] {
    return snippets.map((text, index) => ({
      id: index + 1,
      text,
      ...getPosition(),
      animationDelay: `${index * 1.5}s`,
      showFlow: false,
      visible: false
    }));
  }

  createBiblicalTexts(
    words: BiblicalWord[],
    getPosition: () => { x: number; y: number }
  ): BiblicalText[] {
    return words.map((word, index) => ({
      id: index + 1,
      text: word.text,
      translation: word.translation,
      language: word.language,
      ...getPosition(),
      animationDelay: `${index * 1.8}s`,
      showTranslation: false,
      visible: false
    }));
  }

  createMapContainers(
    count: number,
    getPosition: () => { x: number; y: number }
  ): MapContainer[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      ...getPosition(),
      visible: false
    }));
  }

  resetElementState(element: any): void {
    if ('progress' in element) {
      element.progress = 0;
      element.targetProgress = 100;
    }
    if ('showFlow' in element) {
      element.showFlow = false;
    }
    if ('showTranslation' in element) {
      element.showTranslation = false;
    }
    if ('isFlipped' in element) {
      element.isFlipped = false;
    }
  }
}