const fs = require('fs');
const path = require('path');

const layersPath = path.join(__dirname, 'layers');

// Get all subfolders in layers directory
const folders = fs.readdirSync(layersPath).filter(file => {
  return fs.statSync(path.join(layersPath, file)).isDirectory();
});

console.log(`Found ${folders.length} folders to process\n`);

folders.forEach(folder => {
  const folderPath = path.join(layersPath, folder);
  const files = fs.readdirSync(folderPath);

  console.log(`Processing folder: ${folder}`);

  files.forEach(file => {
    // Skip hidden files and system files
    if (file.startsWith('.')) {
      return;
    }

    const oldPath = path.join(folderPath, file);
    
    // Extract the part starting with "tier"
    const tierMatch = file.match(/tier[^.]*(?=\.[^.]*$)/);
    
    if (tierMatch) {
      // Replace dashes with underscores
      const newName = tierMatch[0].replace(/-/g, '_');
      
      // Get the file extension
      const ext = path.extname(file);
      
      // Create the new filename
      const newFileName = newName + ext;
      const newPath = path.join(folderPath, newFileName);

      // Only rename if the new name is different
      if (file !== newFileName) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`  ✓ ${file} → ${newFileName}`);
        } catch (err) {
          console.error(`  ✗ Error renaming ${file}: ${err.message}`);
        }
      }
    } else {
      console.log(`  ⊘ ${file} (no 'tier' found)`);
    }
  });
  
  console.log('');
});

console.log('Done!');
