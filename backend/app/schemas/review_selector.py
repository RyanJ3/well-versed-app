# backend/app/services/review_selector.py
from typing import List
from app.models import UserVerse


class ReviewSelector:
    """Simple confidence-based review selection"""
    
    @staticmethod
    def get_review_priority(verse: UserVerse) -> float:
        """
        Calculate review priority. Lower score = higher priority.
        Confidence 0-2: High priority
        Confidence 3-4: Medium priority
        Confidence 5: Low priority
        """
        # Base priority from confidence (inverted)
        priority = verse.confidence_level * 10
        
        # Bonus for verses that haven't been reviewed much
        if verse.review_count < 5:
            priority -= 5
        
        return priority
    
    @staticmethod
    def select_verses_for_session(
        verses: List[UserVerse], 
        session_size: int = 20
    ) -> List[UserVerse]:
        """
        Select verses for a review session.
        80% low confidence (0-2)
        20% medium/high confidence (3-5)
        """
        if not verses:
            return []
        
        # Separate by confidence
        low_confidence = [v for v in verses if v.confidence_level <= 2]
        high_confidence = [v for v in verses if v.confidence_level > 2]
        
        # Calculate distribution
        low_count = min(len(low_confidence), int(session_size * 0.8))
        high_count = min(len(high_confidence), session_size - low_count)
        
        # If not enough low confidence, fill with high
        if low_count < int(session_size * 0.8):
            high_count = min(len(high_confidence), session_size - low_count)
        
        # Sort by priority
        low_confidence.sort(key=ReviewSelector.get_review_priority)
        high_confidence.sort(key=ReviewSelector.get_review_priority)
        
        # Combine selections
        selected = low_confidence[:low_count] + high_confidence[:high_count]
        
        return selected[:session_size]