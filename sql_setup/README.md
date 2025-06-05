# 🗄️ Well Versed Database Setup

A modern, user-friendly database setup system for the Well Versed Bible memorization application.

## ✨ Features

### 🎨 Beautiful Terminal UI
- **Colored output** for instant visual feedback
- **Progress bars** for long-running operations
- **Clear status indicators**:
  - ✅ Success (green)
  - ⚠️ Warning (yellow)
  - ❌ Error (red)
  - ℹ️ Info (blue)

### 📊 Real-time Progress Tracking
```
Processing Bible books...
  Processing: Revelation (404 verses)...

Inserting Bible verses...
  Progress: [████████████████████████████████░░░░░░░░] 31/35 batches
✓ Inserted 31,102 Bible verses
```

### 🛡️ Safety First
- **Drop protection**: Requires explicit confirmation before dropping schema
- **Automatic backups**: Creates timestamped backups before reorganization
- **Transaction safety**: All operations are atomic - either fully succeed or rollback
- **Retry logic**: Automatic retry for database connections
- **Environment validation**: Checks for required variables before starting

### 🎯 Flexible Command Line Options

```bash
# Show help and available options
python3 setup_database.py --help

# Safe setup (preserves existing data)
python3 setup_database.py

# Full reset with confirmation prompt
python3 setup_database.py --drop

# Skip test data insertion
python3 setup_database.py --no-test-data

# Just verify existing setup
python3 setup_database.py --verify-only

# Combine options
python3 setup_database.py --drop --no-test-data
```

### 📋 Comprehensive Verification

After setup, get a detailed report of your database state:

```
Database Verification
==================================================
Table Status:
--------------------------------------------------
  ✓ Users................................... 1 rows
  ✓ Bible Books............................ 73 rows
  ✓ Bible Verses........................ 31102 rows
  ○ User Verses............................. 0 rows
  ✓ Decks................................... 3 rows
  ✓ Saved Decks............................. 1 rows
  ○ Deck Cards.............................. 0 rows
  ○ Card Verses............................. 0 rows
  ○ Confidence Tracking..................... 0 rows

Data Verification:
--------------------------------------------------
✓ Test user exists
  Bible books with verses: 73

  Sample books:
    - Genesis: 1533 verses
    - Exodus: 1213 verses
    - Leviticus: 859 verses
    - Numbers: 1288 verses
    - Deuteronomy: 959 verses
```

### 🔄 Smart Error Recovery
- **Graceful error handling** with detailed error messages
- **Continue option** after non-critical errors
- **Partial success tracking** - know exactly what succeeded
- **Detailed error context** for debugging

## 📁 Directory Structure

```
sql_setup/
├── README.md                     # This file
├── 01-drop-schema.sql           # ⚠️ Drops everything (requires --drop flag)
├── 02-create-core-tables.sql    # Core tables (users, bible data)
├── 03-create-decks.sql          # Deck system & saved decks
├── 04-create-deck-cards.sql     # Flashcard system
├── 05-create-confidence-tracking.sql  # User progress tracking
├── 06-populate-test-data.sql    # Sample data (optional)
├── 07-create-feature-requests.sql  # Feature request system
├── bible_base_data.json         # Bible structure (books, chapters, verses)
├── requirements.txt             # Python dependencies
├── setup_database.py            # Main setup script
└── reorganize_sql_setup.sh      # Directory cleanup script
```

## 🚀 Quick Start

### 1️⃣ First Time Setup

```bash
# From project root
cd sql_setup

# Install Python dependencies
pip install -r requirements.txt

# Run setup (safe mode - won't drop existing data)
python3 setup_database.py
```

### 2️⃣ Complete Reset

```bash
# This will drop everything and start fresh
python3 setup_database.py --drop

# You'll see a warning:
# ⚠️  WARNING: This will DROP the existing schema!
# All data will be lost. This cannot be undone.
# Type 'yes' to confirm:
```

### 3️⃣ Reorganize Legacy Structure

If you have an older sql_setup structure:

```bash
# From project root
./reorganize_sql_setup.sh
```

This will:
- Create a timestamped backup
- Remove redundant files
- Rename files to proper sequence
- Update table definitions
- Create helper scripts

## 🔧 Configuration

The setup script reads database configuration from `backend/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=wellversed01DEV
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
```

## 📊 What Gets Created

### Core Tables
- **users** - User accounts and preferences
- **bible_books** - Bible book metadata (73 books)
- **bible_verses** - All verses (~31,000 verses)
- **user_verses** - Tracks memorized verses

### Deck System
- **decks** - User-created verse collections
- **saved_decks** - Bookmarked decks from other users
- **deck_cards** - Flashcards within decks
- **card_verses** - Verses within each card

### Progress Tracking
- **user_verse_confidence** - Confidence scores per verse
- **deck_tags** - Categorization system
- **deck_tag_map** - Tag associations

## 🐛 Troubleshooting

### "Database connection failed"
- Check your `backend/.env` file exists
- Verify PostgreSQL is running
- Confirm credentials are correct

### "Permission denied"
```bash
chmod +x setup_database.py
chmod +x reorganize_sql_setup.sh
```

### "Table already exists"
- Use `python3 setup_database.py` (safe mode) instead of `--drop`
- Or confirm the drop if you want to reset

### Partial Setup
If setup fails partway through:
```bash
# Check what was created
python3 setup_database.py --verify-only

# Then either continue or reset
python3 setup_database.py        # Continue
python3 setup_database.py --drop # Start over
```

## 🎯 Best Practices

1. **Always backup** before major changes
2. **Use safe mode** for incremental updates
3. **Use --drop only** for development resets
4. **Verify after setup** to ensure completeness
5. **Check logs** for any warnings during setup

## 📈 Performance Notes

- Bible verse insertion is batched (1000 per batch)
- Indexes are created for common queries
- Foreign keys ensure data integrity
- Triggers maintain updated_at timestamps

## 🤝 Contributing

When modifying the schema:
1. Add new SQL files with proper numbering
2. Update SQL_FILES in setup_database.py
3. Test both fresh installs and upgrades
4. Update this README

---

*Built with ❤️ for the Well Versed project*