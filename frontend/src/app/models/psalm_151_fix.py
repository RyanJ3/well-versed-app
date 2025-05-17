#!/usr/bin/env python3
"""
Script to modify the Bible data JSON to incorporate Psalm 151 into the Psalms book
instead of having it as a separate book.
"""

import json
import os
import re
from pathlib import Path

def update_bible_data_json(file_path):
    """
    Updates the bible_base_data.json file to:
    1. Add Psalm 151 as chapter 151 in the Psalms book
    2. Remove the separate Psalm 151 entry
    3. Update any related indices
    """
    print(f"Reading Bible data from: {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        bible_data = json.load(f)
    
    # Find the indices
    psalms_index = None
    psalm151_index = None
    
    for i, book in enumerate(bible_data['books']):
        if book['name'] == 'Psalms':
            psalms_index = i
        elif book['name'] == 'Psalm 151':
            psalm151_index = i
    
    if psalms_index is None or psalm151_index is None:
        print("Error: Could not find Psalms or Psalm 151 in the Bible data")
        return False
    
    # Get the content of Psalm 151
    psalm151 = bible_data['books'][psalm151_index]
    
    # Add a note about Psalm 151 to the Psalms book
    if 'notes' not in bible_data['books'][psalms_index]:
        bible_data['books'][psalms_index]['notes'] = ""
    
    bible_data['books'][psalms_index]['notes'] += "Includes Psalm 151 (Eastern Orthodox)"
    
    # Add Psalm 151's verses as chapter 151 of Psalms
    bible_data['books'][psalms_index]['chapters'].append(psalm151['chapters'][0])
    
    # Remove the separate Psalm 151 book
    bible_data['books'].pop(psalm151_index)
    
    # Update book index if it exists
    if 'bookIndex' in bible_data and 'Psalm 151' in bible_data['bookIndex']:
        psalm151_book_index = bible_data['bookIndex']['Psalm 151']
        # We need to update all references to adjust for the removal
        for book_name, index in bible_data['bookIndex'].items():
            if index > psalm151_book_index:
                bible_data['bookIndex'][book_name] = index - 1
        
        # Remove the Psalm 151 entry
        del bible_data['bookIndex']['Psalm 151']
    
    # Update synonyms that reference Psalm 151
    if 'synonyms' in bible_data:
        keys_to_remove = []
        for key, value in bible_data['synonyms'].items():
            if key.startswith('Psalm 151') or key.startswith('Ps 151'):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del bible_data['synonyms'][key]
    
    # Write the updated data back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(bible_data, f, indent=2)
    
    print("✅ Successfully updated the Bible data")
    return True

def update_typescript_files(project_root):
    """
    Updates TypeScript files to handle Psalm 151 as a chapter of Psalms
    """
    # Find all TypeScript files in the project
    ts_files = []
    for root, _, files in os.walk(project_root):
        for file in files:
            if file.endswith('.ts'):
                ts_files.append(os.path.join(root, file))
    
    # Define patterns to search for and their replacements
    patterns = [
        # Update isApocryphalBook method
        (
            r'isApocryphalBook\s*\([^)]*\)\s*{\s*return[^;]*book\.name\s*===\s*[\'"]Psalm 151[\'"][^;]*;',
            'isApocryphalBook(book: BibleBook): boolean {\n    return book.canonicalAffiliation !== \'All\' &&\n      (book.canonicalAffiliation === \'Catholic\' ||\n       book.canonicalAffiliation === \'Eastern Orthodox\');\n  }'
        ),
        # Update refreshBooksBasedOnSettings method
        (
            r'if\s*\([^)]*book\.name\s*===\s*[\'"]Psalm 151[\'"][^)]*\)',
            'if (book.name === \'Psalms\' && chapterNumber === 151)'
        )
    ]
    
    files_modified = []
    
    # Process each file
    for file_path in ts_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        new_content = content
        
        # Apply each pattern
        for pattern, replacement in patterns:
            if re.search(pattern, content):
                new_content = re.sub(pattern, replacement, new_content)
                modified = True
        
        # Save changes if the file was modified
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            files_modified.append(file_path)
            print(f"✅ Updated: {file_path}")
    
    print(f"Modified {len(files_modified)} TypeScript files")
    return files_modified

def add_chapter_properties_to_model(project_root):
    """
    Adds properties to BibleChapter class to support apocryphal chapters
    """
    # Find the bible.model.ts file
    model_file = None
    for root, _, files in os.walk(project_root):
        for file in files:
            if file == 'bible.model.ts':
                model_file = os.path.join(root, file)
                break
        if model_file:
            break
    
    if not model_file:
        print("Could not find bible.model.ts file")
        return False
    
    print(f"Updating Bible model file: {model_file}")
    
    with open(model_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the BibleChapter class definition
    chapter_class_pattern = r'export class BibleChapter {([^}]*)}'
    chapter_class_match = re.search(chapter_class_pattern, content, re.DOTALL)
    
    if not chapter_class_match:
        print("Could not find BibleChapter class in the model file")
        return False
    
    # Get the class content
    class_content = chapter_class_match.group(1)
    
    # Check if the properties already exist
    if 'isApocryphal' in class_content:
        print("The BibleChapter class already has the required properties")
        return True
    
    # Add the new properties
    new_properties = '\n  public isApocryphal: boolean = false;\n  public isHidden: boolean = false;\n'
    new_class_content = class_content.replace('public readonly verses', new_properties + '  public readonly verses')
    
    # Update the constructor parameters
    constructor_pattern = r'constructor\(([^)]*)\)'
    constructor_params = re.search(constructor_pattern, class_content)
    
    if constructor_params:
        constructor_content = constructor_params.group(1)
        if 'apocryphalStatus' not in constructor_content:
            new_constructor_params = constructor_content + ',\n    apocryphalStatus: boolean = false'
            new_class_content = new_class_content.replace(constructor_content, new_constructor_params)
            
            # Add code to set the apocryphal status
            constructor_body_pattern = r'constructor\([^)]*\)[^{]*{([^}]*)}'
            constructor_body_match = re.search(constructor_body_pattern, new_class_content, re.DOTALL)
            
            if constructor_body_match:
                constructor_body = constructor_body_match.group(1)
                new_body = constructor_body + '\n    // Set apocryphal status\n    this.isApocryphal = apocryphalStatus;\n'
                new_class_content = new_class_content.replace(constructor_body, new_body)
    
    # Replace the class content in the file
    new_content = content.replace(chapter_class_match.group(1), new_class_content)
    
    # Add a method to BibleBook to check for apocryphal chapters
    book_class_pattern = r'export class BibleBook {([^}]*)}'
    book_class_match = re.search(book_class_pattern, new_content, re.DOTALL)
    
    if book_class_match:
        book_class_content = book_class_match.group(1)
        if 'isApocryphalChapter' not in book_class_content:
            new_method = '''
  /**
   * Check if a specific chapter is apocryphal
   */
  isApocryphalChapter(chapterNumber: number): boolean {
    // Special handling for Psalms
    if (this.name === 'Psalms' && chapterNumber === 151) {
      return true;
    }
    
    // Get the chapter
    const chapter = this.chapters.find(ch => ch.chapterNumber === chapterNumber);
    return chapter ? chapter.isApocryphal : false;
  }
  
  /**
   * Gets visible chapters based on user preferences
   */
  getVisibleChapters(includeApocrypha: boolean): BibleChapter[] {
    if (includeApocrypha) {
      return this.chapters;
    }
    
    return this.chapters.filter(chapter => !chapter.isApocryphal);
  }
'''
            # Add the new methods before the last curly brace
            new_book_class_content = book_class_content + new_method
            new_content = new_content.replace(book_class_content, new_book_class_content)
    
    # Write the updated content back to the file
    with open(model_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Successfully updated the Bible model classes")
    return True

def main():
    """
    Main entry point for the script
    """
    # Get the project root directory (assuming this script is in the project root)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Find the bible_base_data.json file
    bible_data_file = None
    for root, _, files in os.walk(project_root):
        for file in files:
            if file == 'bible_base_data.json':
                bible_data_file = os.path.join(root, file)
                break
        if bible_data_file:
            break
    
    if not bible_data_file:
        print("Could not find bible_base_data.json file")
        return False
    
    # Update the Bible data
    if update_bible_data_json(bible_data_file):
        # Update TypeScript files
        update_typescript_files(project_root)
        
        # Add chapter properties to BibleChapter and BibleBook models
        add_chapter_properties_to_model(project_root)
        
        print("\n🎉 All updates completed successfully!")
        print("Please rebuild and test your application to verify the changes.")
        return True
    
    return False

if __name__ == "__main__":
    main()