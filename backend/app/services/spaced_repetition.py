# backend/app/services/spaced_repetition.py
from datetime import datetime, timedelta
from typing import Optional
from enum import IntEnum


class ConfidenceLevel(IntEnum):
    """Confidence levels for memorization"""
    NOT_MEMORIZED = 0
    JUST_STARTED = 1
    FAMILIAR = 2
    LEARNING = 3
    ALMOST_MEMORIZED = 4
    PERFECTLY_MEMORIZED = 5


class SpacedRepetitionAlgorithm:
    """
    Implements a spaced repetition algorithm similar to SM-2 (SuperMemo 2)
    but simplified for Bible verse memorization
    """
    
    # Base intervals in days for first reviews
    INITIAL_INTERVALS = {
        ConfidenceLevel.NOT_MEMORIZED: 0,
        ConfidenceLevel.JUST_STARTED: 1,
        ConfidenceLevel.FAMILIAR: 3,
        ConfidenceLevel.LEARNING: 7,
        ConfidenceLevel.ALMOST_MEMORIZED: 14,
        ConfidenceLevel.PERFECTLY_MEMORIZED: 30
    }
    
    # Ease factor adjustments based on confidence change
    EASE_ADJUSTMENTS = {
        -5: 0.5,   # Dropped from perfect to not memorized
        -4: 0.6,
        -3: 0.7,
        -2: 0.8,
        -1: 0.9,
        0: 1.0,    # No change
        1: 1.1,
        2: 1.2,
        3: 1.3,
        4: 1.4,
        5: 1.5     # Jumped from not memorized to perfect
    }
    
    @staticmethod
    def calculate_next_review(
        current_confidence: int,
        previous_confidence: Optional[int] = None,
        review_count: int = 0,
        last_interval_days: Optional[int] = None
    ) -> tuple[datetime, int]:
        """
        Calculate the next review date based on current performance.
        
        Returns:
            tuple: (next_review_date, interval_in_days)
        """
        # If this is the first review, use initial intervals
        if review_count == 0 or last_interval_days is None:
            interval_days = SpacedRepetitionAlgorithm.INITIAL_INTERVALS.get(
                current_confidence, 1
            )
        else:
            # Calculate confidence change
            confidence_change = 0
            if previous_confidence is not None:
                confidence_change = current_confidence - previous_confidence
            
            # Get ease adjustment factor
            ease_factor = SpacedRepetitionAlgorithm.EASE_ADJUSTMENTS.get(
                confidence_change, 1.0
            )
            
            # Calculate new interval
            if current_confidence >= ConfidenceLevel.LEARNING:
                # For well-memorized verses, increase interval
                interval_days = int(last_interval_days * ease_factor * 1.5)
            elif current_confidence == ConfidenceLevel.FAMILIAR:
                # For familiar verses, moderate increase
                interval_days = int(last_interval_days * ease_factor * 1.2)
            else:
                # For struggling verses, shorter intervals
                interval_days = max(1, int(last_interval_days * ease_factor * 0.8))
            
            # Cap intervals
            if current_confidence == ConfidenceLevel.PERFECTLY_MEMORIZED:
                interval_days = min(interval_days, 180)  # Max 6 months
            else:
                interval_days = min(interval_days, 90)   # Max 3 months
        
        next_review = datetime.utcnow() + timedelta(days=interval_days)
        return next_review, interval_days
    
    @staticmethod
    def get_review_priority(verse) -> float:
        """
        Calculate review priority score for a verse.
        Lower score = higher priority.
        """
        now = datetime.utcnow()
        
        # Days overdue (negative if not yet due)
        days_overdue = (now - verse.next_review).days
        
        # Priority factors
        confidence_factor = verse.confidence_level * 10
        overdue_factor = days_overdue * 2
        
        # Lower confidence and more overdue = higher priority (lower score)
        priority_score = confidence_factor - overdue_factor
        
        return priority_score
    
    @staticmethod
    def get_suggested_daily_review_count(total_verses: int) -> int:
        """
        Suggest how many verses to review daily based on total verse count.
        """
        if total_verses <= 50:
            return min(10, total_verses)
        elif total_verses <= 100:
            return 15
        elif total_verses <= 200:
            return 20
        elif total_verses <= 500:
            return 25
        else:
            return 30
    
    @staticmethod
    def calculate_memorization_strength(
        confidence_level: int,
        review_count: int,
        days_since_last_review: int
    ) -> float:
        """
        Calculate overall memorization strength as a percentage (0-100).
        """
        # Base strength from confidence level
        base_strength = (confidence_level / 5) * 60  # Max 60% from confidence
        
        # Review consistency bonus (max 20%)
        review_bonus = min(review_count * 2, 20)
        
        # Recency penalty
        recency_penalty = min(days_since_last_review * 0.5, 20)
        
        strength = base_strength + review_bonus - recency_penalty
        return max(0, min(100, strength))