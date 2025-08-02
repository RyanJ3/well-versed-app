#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Ensure we're in the frontend directory
if (!fs.existsSync('./src/app')) {
  console.error(`${colors.red}Error: This script must be run from the frontend directory!${colors.reset}`);
  console.error('Current directory:', process.cwd());
  process.exit(1);
}

// Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}Created directory: ${dirPath}${colors.reset}`);
  }
}

// Move file or directory
function moveItem(source, destination) {
  const sourcePath = path.join('./src/app', source);
  const destPath = path.join('./src/app', destination);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`${colors.yellow}Warning: ${source} does not exist, skipping...${colors.reset}`);
    return false;
  }
  
  // Ensure destination directory exists
  ensureDir(path.dirname(destPath));
  
  try {
    fs.renameSync(sourcePath, destPath);
    console.log(`${colors.blue}Moved: ${source} → ${destination}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error moving ${source}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Delete file or directory recursively
function deleteItem(itemPath) {
  const fullPath = path.join('./src/app', itemPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}Warning: ${itemPath} does not exist, skipping deletion...${colors.reset}`);
    return;
  }
  
  try {
    if (fs.lstatSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    console.log(`${colors.red}Deleted: ${itemPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error deleting ${itemPath}: ${error.message}${colors.reset}`);
  }
}

console.log(`${colors.green}Starting frontend reorganization...${colors.reset}\n`);

// Create new directory structure
console.log(`${colors.blue}Creating new directory structure...${colors.reset}`);
const directories = [
  'core/models/bible',
  'core/services',
  'core/utils',
  'features/home',
  'features/bible-tracker',
  'features/memorize/flow',
  'features/memorize/flashcard',
  'features/memorize/study',
  'features/memorize/deck-editor',
  'features/profile',
  'features/stats',
  'shared/components/verse-range-picker',
  'shared/components/confirmation-modal'
];

directories.forEach(dir => ensureDir(path.join('./src/app', dir)));

console.log(`\n${colors.blue}Moving files to new locations...${colors.reset}`);

// Move operations
const moves = [
  // Models
  ['models/bible', 'core/models/bible'],
  ['models/user.ts', 'core/models/user.ts'],
  ['models/bible_base_data.json', 'core/models/bible_base_data.json'],
  
  // Services
  ['services/bible.service.ts', 'core/services/api/bible.service.ts'],
  ['services/deck.service.ts', 'core/services/api/deck.service.ts'],
  ['services/user.service.ts', 'core/services/api/user.service.ts'],
  
  // Utils
  ['utils/bible-data-utils.ts', 'core/utils/bible-data-utils.ts'],
  
  // Features
  ['home', 'features/home'],
  ['bible-tracker', 'features/bible-tracker'],
  ['flow', 'features/memorize/flow'],
  ['flashcard', 'features/memorize/flashcard'],
  ['study', 'features/memorize/study'],
  ['deck-editor', 'features/memorize/deck-editor'],
  ['profile', 'features/profile'],
  ['stats', 'features/stats'],
  
  // Shared components
  ['components/verse-range-picker', 'shared/components/verse-range-picker'],
  ['shared/components/notification/confirmation-modal.ts', 'shared/components/confirmation-modal/confirmation-modal.component.ts']
];

let successCount = 0;
moves.forEach(([source, dest]) => {
  if (moveItem(source, dest)) {
    successCount++;
  }
});

console.log(`\n${colors.blue}Cleaning up...${colors.reset}`);

// Delete items
const toDelete = [
  'api-test',  // Remove unused component
  'models/index.ts',  // Empty file
  'models/interfaces.ts',  // Empty file
  'models/psalm_151_fix.py',  // One-time migration script
  'models',  // Empty directory after moves
  'services',  // Empty directory after moves
  'utils',  // Empty directory after moves
  'components',  // Empty directory after moves
  'shared/components/notification'  // Empty directory after moving confirmation-modal
];

toDelete.forEach(item => deleteItem(item));

// Update import paths in all TypeScript files
console.log(`\n${colors.blue}Updating import paths...${colors.reset}`);

function updateImports(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.html')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Define import replacements
    const replacements = [
      // Service imports
      [/from ['"]\.\.\/services\/bible\.service['"]/g, "from '@app/core/services/api/bible.service'"],
      [/from ['"]\.\.\/\.\.\/services\/bible\.service['"]/g, "from '@app/core/services/api/bible.service'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/services\/bible\.service['"]/g, "from '@app/core/services/api/bible.service'"],
      [/from ['"]\.\/services\/bible\.service['"]/g, "from '@app/core/services/api/bible.service'"],
      
      [/from ['"]\.\.\/services\/user\.service['"]/g, "from '@app/core/services/api/user.service'"],
      [/from ['"]\.\.\/\.\.\/services\/user\.service['"]/g, "from '@app/core/services/api/user.service'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/services\/user\.service['"]/g, "from '@app/core/services/api/user.service'"],
      [/from ['"]\.\/services\/user\.service['"]/g, "from '@app/core/services/api/user.service'"],
      
      [/from ['"]\.\.\/services\/deck\.service['"]/g, "from '@app/core/services/api/deck.service'"],
      [/from ['"]\.\.\/\.\.\/services\/deck\.service['"]/g, "from '@app/core/services/api/deck.service'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/services\/deck\.service['"]/g, "from '@app/core/services/api/deck.service'"],
      [/from ['"]\.\/services\/deck\.service['"]/g, "from '@app/core/services/api/deck.service'"],
      
      // Model imports
      [/from ['"]\.\.\/models\/bible['"]/g, "from '@app/core/models/bible'"],
      [/from ['"]\.\.\/\.\.\/models\/bible['"]/g, "from '@app/core/models/bible'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/models\/bible['"]/g, "from '@app/core/models/bible'"],
      [/from ['"]\.\/models\/bible['"]/g, "from '@app/core/models/bible'"],
      
      [/from ['"]\.\.\/models\/user['"]/g, "from '@app/core/models/user'"],
      [/from ['"]\.\.\/\.\.\/models\/user['"]/g, "from '@app/core/models/user'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/models\/user['"]/g, "from '@app/core/models/user'"],
      [/from ['"]\.\/models\/user['"]/g, "from '@app/core/models/user'"],
      
      // Component imports
      [/from ['"]\.\.\/components\/verse-range-picker\/verse-range-picker\.component['"]/g, "from '@app/shared/components/verse-range-picker/verse-range-picker.component'"],
      [/from ['"]\.\.\/\.\.\/components\/verse-range-picker\/verse-range-picker\.component['"]/g, "from '@app/shared/components/verse-range-picker/verse-range-picker.component'"],
      
      // Bible data JSON import
      [/from ['"]\.\.\/bible_base_data\.json['"]/g, "from '@app/core/models/bible_base_data.json'"],
      [/from ['"]\.\/bible_base_data\.json['"]/g, "from '@app/core/models/bible_base_data.json'"],
      
      // Environment imports
      [/from ['"]\.\.\/\.\.\/environments\/environment['"]/g, "from '@environments/environment'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/environments\/environment['"]/g, "from '@environments/environment'"],
      [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/environments\/environment['"]/g, "from '@environments/environment'"],
      
      // Utils imports
      [/from ['"]\.\.\/utils\/bible-data-utils['"]/g, "from '@app/core/utils/bible-data-utils'"],
      [/from ['"]\.\.\/\.\.\/utils\/bible-data-utils['"]/g, "from '@app/core/utils/bible-data-utils'"],
    ];
    
    // Apply all replacements
    replacements.forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement);
    });
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`${colors.green}Updated imports in: ${filePath}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error updating imports in ${filePath}: ${error.message}${colors.reset}`);
  }
}

// Recursively find and update all TypeScript files
function updateAllImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      updateAllImports(filePath);
    } else if (stat.isFile()) {
      updateImports(filePath);
    }
  });
}

updateAllImports('./src/app');

// Update tsconfig.json with path mappings
console.log(`\n${colors.blue}Updating tsconfig.json with path mappings...${colors.reset}`);

const tsconfigPath = './tsconfig.json';
try {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Add baseUrl and paths
  tsconfig.compilerOptions.baseUrl = "./src";
  tsconfig.compilerOptions.paths = {
    "@app/*": ["app/*"],
    "@core/*": ["app/core/*"],
    "@features/*": ["app/features/*"],
    "@shared/*": ["app/shared/*"],
    "@models/*": ["app/core/models/*"],
    "@services/*": ["app/core/services/*"],
    "@utils/*": ["app/core/utils/*"],
    "@environments/*": ["environments/*"]
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
  console.log(`${colors.green}Updated tsconfig.json with path mappings${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error updating tsconfig.json: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.green}Reorganization complete!${colors.reset}`);
console.log(`${colors.blue}Successfully moved ${successCount} items.${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log('1. Update any remaining import paths that the script might have missed');
console.log('2. Update app.routes.ts with the new lazy-loaded paths');
console.log('3. Test the application to ensure everything works correctly');
console.log('4. Commit your changes');
