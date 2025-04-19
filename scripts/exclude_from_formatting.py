import os
import json
from pathlib import Path

def setup_formatting_exclusions(project_root, files_to_ignore):
    """
    Create or update formatter config files to exclude specified files.
    
    Args:
        project_root: Root directory of your project
        files_to_ignore: List of file paths to exclude from formatting
    """
    project_root = Path(project_root)
    
    # Ensure all paths use forward slashes for consistency
    normalized_files = [str(Path(f)).replace('\\', '/') for f in files_to_ignore]
    
    # Create .prettierignore
    prettier_ignore_path = project_root / '.prettierignore'
    create_or_update_ignore_file(prettier_ignore_path, normalized_files)
    
    # Create .eslintignore
    eslint_ignore_path = project_root / '.eslintignore'
    create_or_update_ignore_file(eslint_ignore_path, normalized_files)
    
    # Update VS Code settings
    update_vscode_settings(project_root, normalized_files)
    
    print("✅ Formatting exclusion setup complete")

def create_or_update_ignore_file(file_path, files_to_ignore):
    """Create or update an ignore file with the specified entries."""
    existing_entries = []
    
    # Read existing entries if the file exists
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_entries = [line.strip() for line in f.readlines() if line.strip()]
    
    # Combine existing entries with new ones, removing duplicates
    all_entries = list(set(existing_entries + files_to_ignore))
    
    # Write back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("# Automatically generated - Files excluded from formatting\n")
        for entry in sorted(all_entries):
            f.write(f"{entry}\n")
    
    print(f"✓ Updated {file_path}")

def update_vscode_settings(project_root, files_to_ignore):
    """Update VS Code settings to exclude files from formatting on save."""
    vscode_dir = project_root / '.vscode'
    settings_path = vscode_dir / 'settings.json'
    
    # Create .vscode directory if it doesn't exist
    vscode_dir.mkdir(exist_ok=True)
    
    # Load existing settings or create new ones
    settings = {}
    if settings_path.exists():
        with open(settings_path, 'r', encoding='utf-8') as f:
            try:
                settings = json.load(f)
            except json.JSONDecodeError:
                print("⚠️ Existing settings.json is invalid, creating new file")
    
    # Update formatOnSaveIgnore setting
    format_ignore = settings.get('editor.formatOnSaveIgnore', [])
    
    # Convert to list if it's not already
    if not isinstance(format_ignore, list):
        format_ignore = []
    
    # Add new entries
    for file in files_to_ignore:
        pattern = f"**/{file}"
        if pattern not in format_ignore:
            format_ignore.append(pattern)
    
    settings['editor.formatOnSaveIgnore'] = format_ignore
    
    # Write updated settings
    with open(settings_path, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2)
    
    print(f"✓ Updated {settings_path}")

if __name__ == "__main__":
    # Project root path - adjust as needed
    project_root = r"c:\Users\Owner\VS_Code_Projects\well-versed-app"
    
    # Files to exclude from formatting
    files_to_exclude = [
        "bible_data/bible_base_data.json"
    ]
    
    setup_formatting_exclusions(project_root, files_to_exclude)
    
    print("\nTo exclude additional files, add them to the 'files_to_exclude' list.")
    print("You can also add this comment at the top of JSON files to prevent Prettier formatting:")
    print("// prettier-ignore")