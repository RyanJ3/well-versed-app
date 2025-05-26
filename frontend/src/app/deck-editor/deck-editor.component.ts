// frontend/src/app/deck-editor/deck-editor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckService, DeckResponse, VerseWithText } from '../services/deck.service';
import { BibleService } from '../services/bible.service';

interface SearchResult {
  verse_code: string;
  reference: string;
  text: string;
  book_id: number;
  chapter_number: number;
  verse_number: number;
  isSelected: boolean;
}

@Component({
  selector: 'app-deck-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deck-editor.component.html',
  styleUrls: ['./deck-editor.component.scss']
})
export class DeckEditorComponent implements OnInit {
  deckId: number = 0;
  deck: DeckResponse | null = null;
  deckVerses: VerseWithText[] = [];
  isLoading = true;
  isSaving = false;
  userId = 1; // TODO: Get from UserService

  // Edit mode
  editMode: 'info' | 'verses' = 'verses';
  
  // Deck info editing
  deckName = '';
  deckDescription = '';
  isDeckPublic = false;

  // Search functionality
  searchQuery = '';
  searchResults: SearchResult[] = [];
  isSearching = false;
  
  // Selected verses for bulk operations
  selectedVerses: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckService: DeckService,
    private bibleService: BibleService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.deckId = +params['deckId'];
      this.loadDeck();
      this.loadDeckVerses();
    });
  }

  loadDeck() {
    this.deckService.getDeck(this.deckId).subscribe({
      next: (deck) => {
        this.deck = deck;
        this.deckName = deck.name;
        this.deckDescription = deck.description || '';
        this.isDeckPublic = deck.is_public;
      },
      error: (error) => {
        console.error('Error loading deck:', error);
      }
    });
  }

  loadDeckVerses() {
    this.isLoading = true;
    this.deckService.getDeckVerses(this.deckId, this.userId).subscribe({
      next: (response) => {
        this.deckVerses = response.verses;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading deck verses:', error);
        this.isLoading = false;
      }
    });
  }

  updateDeckInfo() {
    if (!this.deckName.trim()) return;
    
    this.isSaving = true;
    const updates = {
      name: this.deckName,
      description: this.deckDescription,
      is_public: this.isDeckPublic
    };

    this.deckService.updateDeck(this.deckId, updates).subscribe({
      next: (updatedDeck) => {
        this.deck = updatedDeck;
        this.isSaving = false;
        this.editMode = 'verses';
      },
      error: (error) => {
        console.error('Error updating deck:', error);
        this.isSaving = false;
      }
    });
  }

searchVerses() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    const query = this.searchQuery.toLowerCase();
    const bibleData = this.bibleService.getBibleData();
    this.searchResults = [];
    
    // Parse search query - could be book name, reference, or keyword
    const referenceMatch = this.searchQuery.match(/^(.+?)\s+(\d+):?(\d*)-?(\d*)$/);
    
    if (referenceMatch) {
      // Search by reference (e.g., "John 3:16" or "Psalm 23:1-6")
      const bookQuery = referenceMatch[1].toLowerCase();
      const chapter = parseInt(referenceMatch[2]);
      const startVerse = referenceMatch[3] ? parseInt(referenceMatch[3]) : 1;
      const endVerse = referenceMatch[4] ? parseInt(referenceMatch[4]) : startVerse;
      
      // Find matching book
      const matchingBook = bibleData.books.find(book => 
        book.name.toLowerCase().includes(bookQuery)
      );
      
      if (matchingBook && chapter <= matchingBook.chapters.length) {
        const chapterData = matchingBook.chapters[chapter - 1];
        for (let v = startVerse; v <= Math.min(endVerse, chapterData.verses.length); v++) {
          const verseCode = `${matchingBook.id}-${chapter}-${v}`;
          this.searchResults.push({
            verse_code: verseCode,
            reference: `${matchingBook.name} ${chapter}:${v}`,
            text: this.getVerseText(matchingBook.name, chapter, v),
            book_id: matchingBook.id,
            chapter_number: chapter,
            verse_number: v,
            isSelected: this.isVerseInDeck(verseCode)
          });
        }
      }
    } else {
      // Search by book name
      for (const book of bibleData.books) {
        if (book.name.toLowerCase().includes(query)) {
          // Show first chapter's first 5 verses as suggestions
          const chapter = 1;
          const maxVerses = Math.min(5, book.chapters[0].verses.length);
          
          for (let v = 1; v <= maxVerses; v++) {
            const verseCode = `${book.id}-${chapter}-${v}`;
            this.searchResults.push({
              verse_code: verseCode,
              reference: `${book.name} ${chapter}:${v}`,
              text: this.getVerseText(book.name, chapter, v),
              book_id: book.id,
              chapter_number: chapter,
              verse_number: v,
              isSelected: this.isVerseInDeck(verseCode)
            });
          }
        }
      }
    }
    
    this.isSearching = false;
  }

   private getVerseText(bookName: string, chapter: number, verse: number): string {
    // In production, this would fetch from a Bible API or database
    // For now, return informative placeholder text
    const verseTexts: { [key: string]: string } = {
      'John 3:16': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      'Psalm 23:1': 'The Lord is my shepherd, I lack nothing.',
      'Genesis 1:1': 'In the beginning God created the heavens and the earth.',
      'Romans 3:23': 'For all have sinned and fall short of the glory of God.',
      'Philippians 4:13': 'I can do all this through him who gives me strength.'
    };
    
    const key = `${bookName} ${chapter}:${verse}`;
    return verseTexts[key] || `[Verse text for ${key} would appear here]`;
  }
  
  isVerseInDeck(verseCode: string): boolean {
    return this.deckVerses.some(v => v.verse_code === verseCode);
  }

  toggleSearchVerse(result: SearchResult) {
    result.isSelected = !result.isSelected;
    
    if (result.isSelected) {
      this.addVerseToDeck(result.verse_code);
    } else {
      this.removeVerseFromDeck(result.verse_code);
    }
  }

  addVerseToDeck(verseCode: string) {
    this.deckService.addVersesToDeck(this.deckId, [verseCode]).subscribe({
      next: () => {
        this.loadDeckVerses();
      },
      error: (error) => {
        console.error('Error adding verse:', error);
      }
    });
  }

  removeVerseFromDeck(verseCode: string) {
    this.deckService.removeVersesFromDeck(this.deckId, [verseCode]).subscribe({
      next: () => {
        this.deckVerses = this.deckVerses.filter(v => v.verse_code !== verseCode);
        this.selectedVerses.delete(verseCode);
      },
      error: (error) => {
        console.error('Error removing verse:', error);
      }
    });
  }

  toggleVerseSelection(verseCode: string) {
    if (this.selectedVerses.has(verseCode)) {
      this.selectedVerses.delete(verseCode);
    } else {
      this.selectedVerses.add(verseCode);
    }
  }

  removeSelectedVerses() {
    if (this.selectedVerses.size === 0) return;
    
    const verseCodes = Array.from(this.selectedVerses);
    this.deckService.removeVersesFromDeck(this.deckId, verseCodes).subscribe({
      next: () => {
        this.deckVerses = this.deckVerses.filter(v => !this.selectedVerses.has(v.verse_code));
        this.selectedVerses.clear();
      },
      error: (error) => {
        console.error('Error removing verses:', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/flashcards']);
  }
}