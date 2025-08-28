import { Injectable } from '@angular/core';
import { VERSE_POOL, VERSE_SNIPPETS, BIBLICAL_WORDS, VerseData, BiblicalWord } from '../data/biblical-content';

@Injectable({
  providedIn: 'root'
})
export class ContentSelectorService {
  
  getRandomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomVerses(count: number): VerseData[] {
    const shuffled = [...VERSE_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getRandomSnippets(count: number): string[] {
    const shuffled = [...VERSE_SNIPPETS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getRandomBiblicalWords(count: number): BiblicalWord[] {
    const shuffled = [...BIBLICAL_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  refreshVerseContent(): VerseData {
    return this.getRandomFromArray(VERSE_POOL);
  }

  refreshBiblicalWord(): BiblicalWord {
    return this.getRandomFromArray(BIBLICAL_WORDS);
  }

  refreshSnippet(): string {
    return this.getRandomFromArray(VERSE_SNIPPETS);
  }
}