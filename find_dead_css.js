const fs = require('fs');
const path = require('path');

const cssPath = 'd:/Task-application-launch-prep/src/App.css';
const srcDir = 'd:/Task-application-launch-prep/src';

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const cssContent = fs.readFileSync(cssPath, 'utf8');
const files = getAllFiles(srcDir);
const allFilesContent = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Find all classes like .class-name
// This is a naive regex but good for finding candidates
const classRegex = /\.([a-zA-Z0-9_-]+)(?=[\s,{:])|\[class\*?="([a-zA-Z0-9_-]+)"\]/g;
let match;
const classes = new Set();
while ((match = classRegex.exec(cssContent)) !== null) {
  if (match[1]) classes.add(match[1]);
  if (match[2]) classes.add(match[2]);
}

const deadClasses = [];
const aliveClasses = [];

// Exclude common global/base classes
const exclude = ['root', 'body', 'html', 'page', 'app', 'base-card'];

classes.forEach(cls => {
  if (exclude.includes(cls)) return;
  
  // Search for the class name in files
  // We look for "class-name", 'class-name', `class-name`, class="class-name", className="class-name"
  const escapedCls = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(`['"\s\r\n\t]+${escapedCls}['"\s\r\n\t]+|^${escapedCls}$|["'\`]${escapedCls}["'\`]|className=["'{\`].*${escapedCls}`, 'm');
  
  if (!allFilesContent.includes(cls)) {
    deadClasses.push(cls);
  } else {
    aliveClasses.push(cls);
  }
});

const report = {
  totalDetected: classes.size,
  deadCount: deadClasses.length,
  deadClasses: deadClasses.sort(),
  aliveCount: aliveClasses.length
};

fs.writeFileSync('d:/Task-application-launch-prep/dead_css_report.json', JSON.stringify(report, null, 2));
console.log('Report saved to dead_css_report.json');
