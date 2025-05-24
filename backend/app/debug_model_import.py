# debug_model_import.py

import sys
import traceback

print("=== Testing import: app.models.UserVerseRange ===")

try:
    import app.models as models
    print("[SUCCESS] Imported app.models")
    print("Attributes in app.models:", dir(models))
    
    if hasattr(models, "UserVerseRange"):
        print("[SUCCESS] app.models has attribute 'UserVerseRange'")
    else:
        print("[ERROR] 'UserVerseRange' not found in app.models")
    
except Exception as e:
    print("[EXCEPTION] Failed to import or access 'UserVerseRange'")
    traceback.print_exc()

print("\n=== Testing direct import from likely path ===")

try:
    from app.models.user_verse_range import UserVerseRange
    print("[SUCCESS] Imported UserVerseRange from app.models.user_verse_range")
except Exception as e:
    print("[EXCEPTION] Failed to import from app.models.user_verse_range")
    traceback.print_exc()
