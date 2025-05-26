// frontend/src/app/study/study.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckService } from '../services/deck.service';
import { BibleService } from '../services/bible.service';

interface StudyVerse {
  verse_id: number;
  verse_code: string;
  reference: string;
  text: string;
  confidence_score: number | null;
  last_reviewed: string | null;
  isRevealed: boolean;
}

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StudyComponent implements OnInit {
  deckId: number = 0;
  deckName: string = '';
  verses: StudyVerse[] = [];
  currentIndex: number = 0;
  isLoading: boolean = true;
  error: string = '';
  userId: number = 1; // TODO: Get from UserService

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckService: DeckService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.deckId = +params['deckId'];
      this.loadDeckVerses();
    });
  }

    loadDeckVerses() {
    this.isLoading = true;
    this.deckService.getDeckCards(this.deckId, this.userId).subscribe({
        next: (response: any) => {
        this.deckName = response.deck_name;
        // Flatten cards to verses for study mode
        this.verses = response.cards.flatMap((card: any) => 
            card.verses.map((verse: any) => ({
            ...verse,
            confidence_score: card.confidence_score || 50,
            isRevealed: false
            }))
        );
        this.orderVersesBySpacedRepetition();
        this.isLoading = false;
        },
        error: (error: any) => {
        console.error('Error loading deck cards:', error);
        this.error = 'Failed to load deck cards';
        this.isLoading = false;
        }
    });
    }

    orderVersesBySpacedRepetition() {
    // Simple spaced repetition ordering
    // Prioritize: low confidence scores and older reviews
    this.verses.sort((a, b) => {
      const scoreA = a.confidence_score || 50;
      const scoreB = b.confidence_score || 50;
      
      // If neither has been reviewed, sort by confidence
      if (!a.last_reviewed && !b.last_reviewed) {
        return scoreA - scoreB;
      }
      
      // Prioritize unreviewed verses
      if (!a.last_reviewed) return -1;
      if (!b.last_reviewed) return 1;
      
      // Calculate days since last review
      const daysA = this.daysSinceReview(a.last_reviewed);
      const daysB = this.daysSinceReview(b.last_reviewed);
      
      // Priority score: lower confidence + more days = higher priority
      const priorityA = (100 - scoreA) + (daysA * 2);
      const priorityB = (100 - scoreB) + (daysB * 2);
      
      return priorityB - priorityA;
    });
  }

  daysSinceReview(lastReviewed: string): number {
    const last = new Date(lastReviewed);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get currentVerse(): StudyVerse | null {
    return this.verses[this.currentIndex] || null;
  }

  get progress(): number {
    return this.verses.length > 0 ? ((this.currentIndex + 1) / this.verses.length) * 100 : 0;
  }

  toggleReveal() {
    if (this.currentVerse) {
      this.currentVerse.isRevealed = !this.currentVerse.isRevealed;
    }
  }

  previousVerse() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentVerse!.isRevealed = false;
    }
  }

  nextVerse() {
    if (this.currentIndex < this.verses.length - 1) {
      this.currentIndex++;
      this.currentVerse!.isRevealed = false;
    }
  }

  skipVerse() {
    // Skip without saving confidence
    this.nextVerse();
  }

    exitStudy() {
        this.router.navigate(['/flashcards']);
    }

  onConfidenceChange() {
    // Save confidence score immediately when changed
    if (this.currentVerse) {
      console.log(`Confidence changed to ${this.currentVerse.confidence_score}%`);
      // TODO: Save to backend
    }
}
}