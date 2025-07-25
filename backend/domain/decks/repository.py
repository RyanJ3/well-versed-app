from typing import List, Optional, Dict
from database import DatabaseConnection
from datetime import datetime
from . import schemas

class DeckRepository:
    """Data access layer for decks using PostgreSQL"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    async def create_deck(self, deck_data: schemas.DeckCreate, user_id: int) -> Dict:
        """Create a new deck and optionally initial cards"""
        row = self.db.fetch_one(
            """
            INSERT INTO decks (user_id, name, description, is_public)
            VALUES (%s, %s, %s, %s)
            RETURNING deck_id, created_at, updated_at
            """,
            (user_id, deck_data.name, deck_data.description, deck_data.is_public),
        )
        deck_id = row["deck_id"]
        created_at = row["created_at"].isoformat()
        updated_at = row["updated_at"].isoformat()

        # Tags
        for tag in deck_data.tags or []:
            tag_row = self.db.fetch_one(
                "INSERT INTO deck_tags (tag_name) VALUES (%s) "
                "ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING tag_id",
                (tag,),
            )
            self.db.execute(
                "INSERT INTO deck_tag_map (deck_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (deck_id, tag_row["tag_id"]),
            )

        # Add verses as single cards
        position = 1
        for code in deck_data.verse_codes or []:
            verse = self.db.fetch_one(
                "SELECT id FROM bible_verses WHERE verse_code = %s",
                (code,),
            )
            if not verse:
                continue
            card_row = self.db.fetch_one(
                """
                INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
                VALUES (%s, 'single_verse', %s, %s, %s)
                RETURNING card_id
                """,
                (deck_id, code, verse["id"], position),
            )
            self.db.execute(
                "INSERT INTO card_verses (card_id, verse_id, verse_order) VALUES (%s, %s, 1)",
                (card_row["card_id"], verse["id"]),
            )
            position += 1

        creator = self.db.fetch_one("SELECT name FROM users WHERE user_id = %s", (user_id,))
        return {
            "deck_id": deck_id,
            "creator_id": user_id,
            "creator_name": creator["name"] if creator else "",
            "name": deck_data.name,
            "description": deck_data.description,
            "is_public": deck_data.is_public,
            "save_count": 0,
            "created_at": created_at,
            "updated_at": updated_at,
            "card_count": position - 1,
            "tags": deck_data.tags or [],
            "is_saved": False,
            "cards": [],
        }

    async def get_deck_by_id(self, deck_id: int, user_id: int) -> Optional[Dict]:
        row = self.db.fetch_one(
            """
            SELECT d.deck_id, d.user_id, u.name AS creator_name, d.name, d.description,
                   d.is_public, d.created_at, d.updated_at,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) AS tags
            FROM decks d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN deck_tag_map m ON d.deck_id = m.deck_id
            LEFT JOIN deck_tags t ON m.tag_id = t.tag_id
            WHERE d.deck_id = %s
            GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
            """,
            (deck_id,),
        )
        if not row:
            return None

        cards_rows = self.db.fetch_all(
            """
            SELECT c.card_id, c.card_type, c.reference, c.position, c.added_at,
                   bv.id AS verse_id, bv.verse_code, bv.book_id, bb.book_name,
                   bv.chapter_number, bv.verse_number, bv.is_apocryphal, cv.verse_order
            FROM deck_cards c
            JOIN card_verses cv ON c.card_id = cv.card_id
            JOIN bible_verses bv ON cv.verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE c.deck_id = %s
            ORDER BY c.position, cv.verse_order
            """,
            (deck_id,),
        )

        cards: List[Dict] = []
        current_id = None
        card: Optional[Dict] = None
        for r in cards_rows:
            if r["card_id"] != current_id:
                if card:
                    cards.append(card)
                card = {
                    "card_id": r["card_id"],
                    "card_type": r["card_type"],
                    "reference": r["reference"],
                    "verses": [],
                    "position": r["position"],
                    "added_at": r["added_at"].isoformat(),
                }
                current_id = r["card_id"]
            card["verses"].append(
                {
                    "verse_id": r["verse_id"],
                    "verse_code": r["verse_code"],
                    "book_id": r["book_id"],
                    "book_name": r["book_name"],
                    "chapter_number": r["chapter_number"],
                    "verse_number": r["verse_number"],
                    "reference": r["reference"],
                    "text": "",
                    "verse_order": r["verse_order"],
                }
            )
        if card:
            cards.append(card)

        return {
            "deck_id": row["deck_id"],
            "creator_id": row["user_id"],
            "creator_name": row["creator_name"],
            "name": row["name"],
            "description": row["description"],
            "is_public": row["is_public"],
            "save_count": 0,
            "created_at": row["created_at"].isoformat(),
            "updated_at": row["updated_at"].isoformat(),
            "card_count": len(cards),
            "tags": row.get("tags") or [],
            "is_saved": False,
            "cards": cards,
        }

    async def get_user_decks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict]:
        rows = self.db.fetch_all(
            """
            SELECT d.deck_id, d.user_id, u.name AS creator_name, d.name, d.description,
                   d.is_public, d.created_at, d.updated_at,
                   COUNT(DISTINCT dc.card_id) AS card_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) AS tags
            FROM decks d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
            LEFT JOIN deck_tag_map m ON d.deck_id = m.deck_id
            LEFT JOIN deck_tags t ON m.tag_id = t.tag_id
            WHERE d.user_id = %s
            GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
            ORDER BY d.created_at DESC
            OFFSET %s LIMIT %s
            """,
            (user_id, skip, limit),
        )
        decks = []
        for r in rows:
            decks.append(
                {
                    "deck_id": r["deck_id"],
                    "creator_id": r["user_id"],
                    "creator_name": r["creator_name"],
                    "name": r["name"],
                    "description": r["description"],
                    "is_public": r["is_public"],
                    "save_count": 0,
                    "created_at": r["created_at"].isoformat(),
                    "updated_at": r["updated_at"].isoformat(),
                    "card_count": r.get("card_count", 0),
                    "tags": r.get("tags") or [],
                    "is_saved": False,
                }
            )
        return decks

    async def get_public_decks(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        rows = self.db.fetch_all(
            """
            SELECT d.deck_id, d.user_id, u.name AS creator_name, d.name, d.description,
                   d.is_public, d.created_at, d.updated_at,
                   COUNT(DISTINCT dc.card_id) AS card_count,
                   ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) AS tags
            FROM decks d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
            LEFT JOIN deck_tag_map m ON d.deck_id = m.deck_id
            LEFT JOIN deck_tags t ON m.tag_id = t.tag_id
            WHERE d.is_public = TRUE
            GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
            ORDER BY d.created_at DESC
            OFFSET %s LIMIT %s
            """,
            (skip, limit),
        )
        decks = []
        for r in rows:
            decks.append(
                {
                    "deck_id": r["deck_id"],
                    "creator_id": r["user_id"],
                    "creator_name": r["creator_name"],
                    "name": r["name"],
                    "description": r["description"],
                    "is_public": r["is_public"],
                    "save_count": 0,
                    "created_at": r["created_at"].isoformat(),
                    "updated_at": r["updated_at"].isoformat(),
                    "card_count": r.get("card_count", 0),
                    "tags": r.get("tags") or [],
                    "is_saved": False,
                }
            )
        return decks

    async def update_deck(self, deck_id: int, deck_data: schemas.DeckUpdate) -> Optional[Dict]:
        update_fields = []
        params: List = []
        if deck_data.name is not None:
            update_fields.append("name = %s")
            params.append(deck_data.name)
        if deck_data.description is not None:
            update_fields.append("description = %s")
            params.append(deck_data.description)
        if deck_data.is_public is not None:
            update_fields.append("is_public = %s")
            params.append(deck_data.is_public)
        if not update_fields:
            return None
        params.append(deck_id)
        query = f"UPDATE decks SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE deck_id = %s"
        self.db.execute(query, tuple(params))
        return await self.get_deck_by_id(deck_id, 0)

    async def delete_deck(self, deck_id: int) -> bool:
        row = self.db.fetch_one(
            "DELETE FROM decks WHERE deck_id = %s RETURNING deck_id",
            (deck_id,),
        )
        return bool(row)

    async def add_card(self, deck_id: int, verse_codes: List[str], reference: str | None = None) -> Optional[Dict]:
        if not verse_codes:
            return None
        position_row = self.db.fetch_one(
            "SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM deck_cards WHERE deck_id = %s",
            (deck_id,),
        )
        position = position_row["pos"] if position_row else 1

        start_verse_id = None
        end_verse_id = None
        verses_data = []
        for idx, code in enumerate(verse_codes, start=1):
            verse = self.db.fetch_one("SELECT id FROM bible_verses WHERE verse_code = %s", (code,))
            if not verse:
                continue
            verses_data.append((verse["id"], idx))
            if start_verse_id is None:
                start_verse_id = verse["id"]
            end_verse_id = verse["id"]
        if not verses_data:
            return None

        card_row = self.db.fetch_one(
            """
            INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING card_id, added_at
            """,
            (
                deck_id,
                "single_verse" if len(verse_codes) == 1 else "verse_range",
                reference or ", ".join(verse_codes),
                start_verse_id,
                end_verse_id if len(verse_codes) > 1 else None,
                position,
            ),
        )
        card_id = card_row["card_id"]
        added_at = card_row["added_at"].isoformat()
        params_list = [(card_id, v_id, order) for v_id, order in verses_data]
        self.db.execute_many(
            "INSERT INTO card_verses (card_id, verse_id, verse_order) VALUES (%s, %s, %s)",
            params_list,
        )

        verses_result = []
        for v_id, order in verses_data:
            v = self.db.fetch_one(
                """
                SELECT bv.id, bv.verse_code, bv.book_id, bb.book_name, bv.chapter_number, bv.verse_number, bv.is_apocryphal
                FROM bible_verses bv JOIN bible_books bb ON bv.book_id = bb.book_id WHERE bv.id = %s
                """,
                (v_id,),
            )
            verses_result.append(
                {
                    "verse_id": v["id"],
                    "verse_code": v["verse_code"],
                    "book_id": v["book_id"],
                    "book_name": v["book_name"],
                    "chapter_number": v["chapter_number"],
                    "verse_number": v["verse_number"],
                    "reference": v["verse_code"],
                    "text": "",
                    "verse_order": order,
                }
            )

        return {
            "card_id": card_id,
            "card_type": "single_verse" if len(verse_codes) == 1 else "verse_range",
            "reference": reference or ", ".join(verse_codes),
            "verses": verses_result,
            "position": position,
            "added_at": added_at,
        }

    async def get_user_decks_optimized(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get user decks with tags in just 2 queries instead of N+1"""

        decks_query = """
            SELECT 
                d.deck_id,
                d.user_id,
                u.name AS creator_name,
                d.name,
                d.description,
                d.is_public,
                d.created_at,
                d.updated_at,
                COUNT(DISTINCT dc.card_id) AS card_count
            FROM decks d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
            WHERE d.user_id = %s
            GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
            ORDER BY d.created_at DESC
            OFFSET %s LIMIT %s
        """

        decks = self.db.fetch_all(decks_query, (user_id, skip, limit))
        if not decks:
            return []

        deck_ids = [d["deck_id"] for d in decks]
        tags_query = """
            SELECT m.deck_id, t.tag_name
            FROM deck_tag_map m
            JOIN deck_tags t ON m.tag_id = t.tag_id
            WHERE m.deck_id = ANY(%s)
            ORDER BY m.deck_id, t.tag_name
        """

        tags_data = self.db.fetch_all(tags_query, (deck_ids,))

        tags_by_deck: Dict[int, List[str]] = {}
        for row in tags_data:
            tags_by_deck.setdefault(row["deck_id"], []).append(row["tag_name"])

        result = []
        for deck in decks:
            result.append(
                {
                    "deck_id": deck["deck_id"],
                    "creator_id": deck["user_id"],
                    "creator_name": deck["creator_name"],
                    "name": deck["name"],
                    "description": deck["description"],
                    "is_public": deck["is_public"],
                    "save_count": 0,
                    "created_at": deck["created_at"].isoformat(),
                    "updated_at": deck["updated_at"].isoformat(),
                    "card_count": deck.get("card_count", 0),
                    "tags": tags_by_deck.get(deck["deck_id"], []),
                    "is_saved": False,
                }
            )

        return result

    async def get_deck_with_cards_optimized(self, deck_id: int, user_id: int) -> Optional[Dict]:
        """Get a deck with all its cards and verses in just 3 queries instead of N+M+1"""

        deck_query = """
            SELECT 
                d.deck_id, d.user_id, u.name AS creator_name, d.name, d.description,
                d.is_public, d.created_at, d.updated_at,
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) AS tags
            FROM decks d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN deck_tag_map m ON d.deck_id = m.deck_id
            LEFT JOIN deck_tags t ON m.tag_id = t.tag_id
            WHERE d.deck_id = %s
            GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        """

        deck = self.db.fetch_one(deck_query, (deck_id,))
        if not deck:
            return None

        cards_query = """
            SELECT 
                c.card_id,
                c.card_type,
                c.reference,
                c.position,
                c.added_at,
                bv.id AS verse_id,
                bv.verse_code,
                bv.book_id,
                bb.book_name,
                bv.chapter_number,
                bv.verse_number,
                bv.is_apocryphal,
                cv.verse_order
            FROM deck_cards c
            JOIN card_verses cv ON c.card_id = cv.card_id
            JOIN bible_verses bv ON cv.verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE c.deck_id = %s
            ORDER BY c.position, cv.verse_order
        """

        cards_data = self.db.fetch_all(cards_query, (deck_id,))

        cards_map: Dict[int, Dict] = {}
        for row in cards_data:
            cid = row["card_id"]
            if cid not in cards_map:
                cards_map[cid] = {
                    "card_id": cid,
                    "card_type": row["card_type"],
                    "reference": row["reference"],
                    "position": row["position"],
                    "added_at": row["added_at"].isoformat(),
                    "verses": [],
                }
            cards_map[cid]["verses"].append(
                {
                    "verse_id": row["verse_id"],
                    "verse_code": row["verse_code"],
                    "book_id": row["book_id"],
                    "book_name": row["book_name"],
                    "chapter_number": row["chapter_number"],
                    "verse_number": row["verse_number"],
                    "reference": row["reference"],
                    "text": "",
                    "verse_order": row["verse_order"],
                }
            )

        cards = list(cards_map.values())
        cards.sort(key=lambda x: x["position"])

        return {
            "deck_id": deck["deck_id"],
            "creator_id": deck["user_id"],
            "creator_name": deck["creator_name"],
            "name": deck["name"],
            "description": deck["description"],
            "is_public": deck["is_public"],
            "save_count": 0,
            "created_at": deck["created_at"].isoformat(),
            "updated_at": deck["updated_at"].isoformat(),
            "card_count": len(cards),
            "tags": deck.get("tags") or [],
            "is_saved": False,
            "cards": cards,
        }

