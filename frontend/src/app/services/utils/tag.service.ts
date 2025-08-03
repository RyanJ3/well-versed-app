// src/app/services/utils/tag.service.ts
// NOTE: This file is optional. The components have been updated to work without it.
// You can add this service later when you want to centralize tag management.
import { Injectable } from '@angular/core';

export interface TagCategory {
  name: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private readonly predefinedTags: TagCategory[] = [
    {
      name: 'Books of the Bible',
      tags: [
        'genesis', 'exodus', 'psalms', 'proverbs', 'isaiah', 
        'matthew', 'mark', 'luke', 'john', 'acts', 
        'romans', 'corinthians', 'galatians', 'ephesians', 
        'philippians', 'revelation'
      ]
    },
    {
      name: 'Topics',
      tags: [
        'salvation', 'faith', 'love', 'prayer', 'worship',
        'forgiveness', 'grace', 'mercy', 'hope', 'peace',
        'wisdom', 'courage', 'strength', 'healing', 'joy',
        'promises', 'prophecy', 'parables', 'miracles'
      ]
    },
    {
      name: 'Life Situations',
      tags: [
        'anxiety', 'fear', 'grief', 'depression', 'anger',
        'temptation', 'guidance', 'marriage', 'parenting', 
        'friendship', 'work', 'finances', 'health', 'loss'
      ]
    },
    {
      name: 'Study Type',
      tags: [
        'daily-devotion', 'memory-verse', 'study-guide',
        'sermon-series', 'bible-study', 'youth-group',
        'sunday-school', 'small-group', 'personal-study'
      ]
    },
    {
      name: 'Difficulty',
      tags: [
        'beginner', 'intermediate', 'advanced',
        'short-verses', 'long-passages', 'key-verses'
      ]
    }
  ];

  getAllTags(): string[] {
    const allTags = this.predefinedTags.flatMap(category => category.tags);
    return [...new Set(allTags)].sort();
  }

  getTagCategories(): TagCategory[] {
    return this.predefinedTags;
  }

  formatTag(tag: string): string {
    // Convert tag to display format (e.g., "daily-devotion" -> "Daily Devotion")
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  validateTag(tag: string): boolean {
    const allTags = this.getAllTags();
    return allTags.includes(tag.toLowerCase());
  }
}