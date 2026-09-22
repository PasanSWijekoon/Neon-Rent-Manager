const fs = require('fs');
const path = require('path');

const targetPath = 'd:/Neon Rent Manager/neon-rent-manager/app';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(targetPath, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if Platform is imported, if not, import it
    if (content.includes('marginTop: Platform.OS') || content.includes('includeFontPadding: false')) {
      if (!content.includes('import { Platform }') && !content.includes('import {') || !content.match(/import\s+{.*Platform.*}\s+from\s+['"]react-native['"]/)) {
        // Just hackily add Platform to react-native import
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-native['"]/, "import { $1, Platform } from 'react-native'");
      }
    }

    content = content.replace(/style=\{\{\s*includeFontPadding:\s*false,\s*textAlignVertical:\s*'center'\s*\}\}/g, 
                              "style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}");
                              
    content = content.replace(/style=\{\{\s*includeFontPadding:\s*false\s*\}\}/g, 
                              "style={{ marginTop: Platform.OS === 'android' ? 4 : 0 }}");

    if (content !== original) {
      // make sure Platform is definitely imported
      if (!content.includes('Platform.OS')) {
          // not used
      } else if (!content.match(/Platform[,} ]/)) {
          content = "import { Platform } from 'react-native';\n" + content;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated with marginTop hack:', filePath);
    }
  }
});
