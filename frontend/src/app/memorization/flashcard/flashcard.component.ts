// ----- bible-flashcard.component.ts -----
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';

interface FlashCard {
  id: number;
  reference: string;
  frontText: string;
  backText: string;
  intervalDays: number;
  nextReview: Date;
  tags: string[];
}

@Component({
  selector: 'flashcard',
  templateUrl: './flashcard.component.html',
  imports: [
    NgIf,
    NgForOf
  ],
  styleUrls: ['./flashcard.component.scss']
})
export class FlashcardComponent implements OnInit, OnDestroy {
  cards: FlashCard[] = [
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

  currentCardIndex = 0;
  isFlipped = false;
  currentInterval: number;
  completedCards = new Set<number>();

  // Audio recording states
  isRecording = false;
  audioURL = '';
  recordingTime = 0;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: BlobPart[] = [];
  timerInterval: any;

  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  get currentCard(): FlashCard {
    return this.cards[this.currentCardIndex];
  }

  get progressPercentage(): number {
    return (this.completedCards.size / this.cards.length) * 100;
  }

  get allCardsCompleted(): boolean {
    return this.completedCards.size === this.cards.length;
  }

  constructor() {
    this.currentInterval = this.cards[0].intervalDays;
  }

  ngOnInit(): void {
    // Initialize with the current card's interval
    this.updateCurrentInterval();
  }

  ngOnDestroy(): void {
    this.cleanupAudioRecording();
  }

  // Format recording time in MM:SS format
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Format the next review date
  formatNextReview(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Toggle card flip
  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
  }

  // Move to the next card
  goToNextCard(): void {
    this.isFlipped = false;
    setTimeout(() => {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.cards.length;
      this.updateCurrentInterval();
      this.resetAudio();
    }, 300);
  }

  // Move to the previous card
  goToPreviousCard(): void {
    this.isFlipped = false;
    setTimeout(() => {
      this.currentCardIndex = (this.currentCardIndex - 1 + this.cards.length) % this.cards.length;
      this.updateCurrentInterval();
      this.resetAudio();
    }, 300);
  }

  // Update the current interval to match the current card
  updateCurrentInterval(): void {
    this.currentInterval = this.cards[this.currentCardIndex].intervalDays;
  }

  // Function to mark card as completed with custom interval
  handleCardCompletion(): void {
    // Update the card's interval and next review date
    this.cards[this.currentCardIndex].intervalDays = this.currentInterval;
    this.cards[this.currentCardIndex].nextReview = new Date(Date.now() + this.currentInterval * 24 * 60 * 60 * 1000);

    // Add card to completed set
    this.completedCards.add(this.currentCard.id);

    this.goToNextCard();
  }

  // Reset the study session
  resetStudy(): void {
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.completedCards = new Set<number>();
    this.updateCurrentInterval();
  }

  // Set interval to a preset value
  setIntervalPreset(days: number): void {
    this.currentInterval = days;
  }

  // Handle interval slider change
  onIntervalChange(event: Event): void {
    this.currentInterval = parseInt((event.target as HTMLInputElement).value);
  }

  // Get the gradient for the interval slider
  getIntervalSliderStyle(): string {
    if (this.isFlipped) {
      return `linear-gradient(to right,
              #9333ea 0%,
              #f97316 ${Math.min(this.currentInterval / 20, 25)}%,
              #facc15 ${Math.min(this.currentInterval / 20, 25)}% ${Math.min(this.currentInterval / 20, 50)}%,
              #22c55e ${Math.min(this.currentInterval / 20, 50)}% ${Math.min(this.currentInterval / 20, 75)}%,
              #3b82f6 ${Math.min(this.currentInterval / 20, 75)}% 100%)`;
    } else {
      return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${this.currentInterval / 20}%, #e5e7eb ${this.currentInterval / 20}%, #e5e7eb 100%)`;
    }
  }

  // Audio recording functions
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        this.audioChunks.push(event.data);
      });

      this.mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioURL = URL.createObjectURL(audioBlob);
      });

      this.mediaRecorder.start();
      this.isRecording = true;

      // Start timer
      this.recordingTime = 0;
      this.timerInterval = setInterval(() => {
        this.recordingTime += 1;
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop timer
      clearInterval(this.timerInterval);

      // Stop all tracks on the active stream
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  playRecording(): void {
    if (this.audioElement && this.audioURL) {
      this.audioElement.nativeElement.play();
    }
  }

  // Clean up audio recording resources
  cleanupAudioRecording(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
    }
  }

  // Reset audio when moving to a different card
  resetAudio(): void {
    this.audioURL = '';
    this.isRecording = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
