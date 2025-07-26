// frontend/src/app/features/memorize/decks/deck-study/deck-study.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckService } from '../../../../core/services/deck.service';
import { BibleService } from '../../../../core/services/bible.service';
import { UserService } from '../../../../core/services/user.service';

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
  templateUrl: './deck-study.component.html',
  styleUrls: ['./deck-study.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DeckStudyComponent implements OnInit {
  deckId: number = 0;
  deckName: string = '';
  verses: StudyVerse[] = [];
  currentIndex: number = 0;
  isLoading: boolean = true;
  error: string = '';
  userId: number = 1;
  preferredBibleId: string = '';
  sessionStartTime: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckService: DeckService,
    private bibleService: BibleService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Get user preferences first
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        // Map preferred Bible to API Bible ID if needed
        // For now, we'll use the default from the backend
        this.preferredBibleId = ''; // Let backend use its default
      }
    });

    this.route.params.subscribe(params => {
      this.deckId = +params['deckId'];
      this.loadDeckVerses();
    });
  }

  loadDeckVerses() {
    this.isLoading = true;
    this.error = '';
    
    this.deckService.getDeckCards(this.deckId, this.userId, this.preferredBibleId).subscribe({
      next: (response: any) => {
        this.deckName = response.deck_name;
        
        // Flatten cards to verses for study mode
        this.verses = response.cards.flatMap((card: any) => 
          card.verses.map((verse: any) => ({
            ...verse,
            confidence_score: card.confidence_score || 50,
            isRevealed: false,
            // Ensure we have text or a fallback
            text: verse.text || `Unable to load text for ${verse.reference}`
          }))
        );
        
        // Check if any verses failed to load
        const failedVerses = this.verses.filter(v => v.text.startsWith('Unable to load'));
        if (failedVerses.length > 0) {
          console.warn(`${failedVerses.length} verses failed to load properly`);
        }
        
        this.orderVersesBySpacedRepetition();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading deck cards:', error);
        this.error = 'Failed to load deck cards. Please check your internet connection and try again.';
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
    this.router.navigate(['/decks']);
  }

  onConfidenceChange() {
    if (this.currentVerse) {
      const [bookId, chapterNum, verseNum] = this.currentVerse.verse_code
        .split('-')
        .map((v) => parseInt(v, 10));
      this.bibleService
        .updateVerseConfidence(
          bookId,
          chapterNum,
          verseNum,
          this.currentVerse.confidence_score || 0,
        )
        .subscribe();
    }
  }

  getSessionTime(): string {
    const now = new Date();
    const diff = now.getTime() - this.sessionStartTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes === 0) {
      return `${seconds}s`;
    } else if (minutes < 60) {
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  getAverageConfidence(): number {
    if (this.verses.length === 0) return 0;
    
    const totalConfidence = this.verses.reduce((sum, verse) => {
      return sum + (verse.confidence_score || 50);
    }, 0);
    
    return Math.round(totalConfidence / this.verses.length);
  }
}