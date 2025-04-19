import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Flashcard {
  id: number;
  reference: string;
  frontText: string;
  backText: string;
  intervalDays: number;
  nextReview: Date;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {
  // Sample flashcard data
  private sampleCards: Flashcard[] = [
    {
      id: 1,
      reference: "John 3:16",
      frontText: "For God so loved the world...",
      backText: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      intervalDays: 3,
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      tags: ["Gospel", "Salvation"]
    },
    {
      id: 2,
      reference: "Psalm 23:1",
      frontText: "The LORD is my shepherd...",
      backText: "The LORD is my shepherd, I lack nothing.",
      intervalDays: 1,
      nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      tags: ["Psalms", "Comfort"]
    },
    {
      id: 3,
      reference: "Proverbs 3:5-6",
      frontText: "Trust in the LORD...",
      backText: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      intervalDays: 5,
      nextReview: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      tags: ["Wisdom", "Guidance"]
    }
  ];

  private cardsSubject = new BehaviorSubject<Flashcard[]>(this.sampleCards);

  constructor() { }

  getCards(): Observable<Flashcard[]> {
    return this.cardsSubject.asObservable();
  }

  updateCard(updatedCard: Flashcard): void {
    const cards = this.cardsSubject.getValue();
    const index = cards.findIndex(card => card.id === updatedCard.id);

    if (index !== -1) {
      const updatedCards = [...cards];
      updatedCards[index] = updatedCard;
      this.cardsSubject.next(updatedCards);
    }
  }

  resetCards(): void {
    this.cardsSubject.next(this.sampleCards.map(card => ({...card})));
  }
}
