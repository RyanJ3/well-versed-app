import os
import re
import glob
import shutil
from pathlib import Path

def separate_component(file_path):
    """
    Separate an Angular component file and organize it into its own directory.
    """
    print(f"Processing {file_path}...")
    
    # Read the original file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Extract component name and create directory name
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    component_name = base_name.replace('.component', '')  # Remove .component suffix if present
    components_dir = os.path.dirname(file_path)
    
    # Create component directory
    component_dir = os.path.join(components_dir, component_name)
    os.makedirs(component_dir, exist_ok=True)
    
    # Extract template
    template_pattern = re.compile(r'template:\s*`([\s\S]*?)`')
    template_match = template_pattern.search(content)
    template = template_match.group(1).strip() if template_match else ''
    
    # Extract styles
    styles_pattern = re.compile(r'styles:\s*\[\s*`([\s\S]*?)`\s*\]')
    styles_match = styles_pattern.search(content)
    styles = styles_match.group(1).strip() if styles_match else ''
    
    # Create new TS content
    new_ts_content = content
    
    # Replace template with templateUrl
    if template:
        new_ts_content = re.sub(
            r'template:\s*`[\s\S]*?`,?',
            f'templateUrl: \'./{base_name}.html\',',
            new_ts_content
        )
    
    # Fix templateUrl if it contains .component.component.html
    new_ts_content = new_ts_content.replace('.component.component.html', '.component.html')
    
    # Replace styles with styleUrls
    if 'styles:' in new_ts_content:
        if styles:
            new_ts_content = re.sub(
                r'styles:\s*\[\s*`[\s\S]*?`\s*\],?',
                f'styleUrls: [\'./{base_name}.scss\'],',
                new_ts_content
            )
        else:
            new_ts_content = re.sub(
                r'styles:\s*\[\s*\],?',
                f'styleUrls: [\'./{base_name}.scss\'],',
                new_ts_content
            )
    
    # Fix styleUrls if it contains .component.component.scss
    new_ts_content = new_ts_content.replace('.component.component.scss', '.component.scss')
    
    # Define new file paths
    html_path = os.path.join(component_dir, f"{base_name}.html")
    scss_path = os.path.join(component_dir, f"{base_name}.scss")
    ts_path = os.path.join(component_dir, f"{base_name}.ts")
    
    # Write the files
    with open(html_path, 'w', encoding='utf-8') as file:
        file.write(template)
    
    with open(scss_path, 'w', encoding='utf-8') as file:
        file.write(styles if styles else '/* Component styles */') 
    
    with open(ts_path, 'w', encoding='utf-8') as file:
        file.write(new_ts_content)
    
    print(f"✓ Created directory: {component_dir}")
    print(f"✓ Created: {html_path}")
    print(f"✓ Created: {scss_path}")
    print(f"✓ Created: {ts_path}")
    
    # Delete the original file after successful move
    os.remove(file_path)
    print(f"✓ Removed original: {file_path}")

def process_components():
    """
    Find and process all component files in the bible-tracker/components directory
    """
    # Path to components directory
    components_dir = r'c:\Users\Owner\VS_Code_Projects\well-versed-app\frontend\src\app\bible-tracker\components'
    
    # Find all component files (assuming they end with .component.ts)
    component_files = glob.glob(os.path.join(components_dir, "*.component.ts"))
    
    if not component_files:
        print("No component files found.")
        return
    
    print(f"Found {len(component_files)} component files.")
    
    # Process each component file
    for file_path in component_files:
        separate_component(file_path)
    
    print("\nAll components have been separated and organized successfully!")

def update_imports():
    """
    Update import statements in all TypeScript files to reflect the new directory structure
    """
    components_dir = r'c:\Users\Owner\VS_Code_Projects\well-versed-app\frontend\src\app\bible-tracker'
    ts_files = glob.glob(os.path.join(components_dir, "**/*.ts"), recursive=True)
    
    print(f"\nUpdating imports in {len(ts_files)} TypeScript files...")
    
    for ts_file in ts_files:
        with open(ts_file, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Look for import statements that need updating
        updated_content = content
        
        # Example: import {BookInfoComponent} from '../components/book-info.component';
        # Should become: import {BookInfoComponent} from '../components/book-info/book-info.component';
        component_import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]*/components/)([^/\'"]+)[\'"]')
        
        def update_import(match):
            imports = match.group(1)
            path_prefix = match.group(2)
            component_file = match.group(3)
            
            # If importing a component file directly
            if '.component' in component_file:
                component_name = component_file.replace('.component', '')
                return f'import {{{imports}}} from \'{path_prefix}{component_name}/{component_file}\''
            
            return match.group(0)
        
        updated_content = component_import_pattern.sub(update_import, updated_content)
        
        if updated_content != content:
            with open(ts_file, 'w', encoding='utf-8') as file:
                file.write(updated_content)
            print(f"✓ Updated imports in: {ts_file}")

if __name__ == "__main__":
    process_components()
    update_imports()