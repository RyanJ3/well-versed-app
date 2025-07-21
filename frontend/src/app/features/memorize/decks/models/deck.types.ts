export interface Deck {
  deck_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  card_count: number;
  updated_at: string;
  tags?: string[];
}

export interface DeckWithCounts extends Deck {
  verse_count?: number;
  save_count?: number;
  memorized_count?: number;
  creator_id?: number;
  creator_name?: string;
  is_saved?: boolean;
  loading_counts?: boolean;
  saving?: boolean;
}
