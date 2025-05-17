// This script will run after the build to copy index.html to 404.html
const fs = require('fs');
const path = require('path');

// Define paths
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');
const notFoundPath = path.join(distPath, '404.html');

// Copy index.html to 404.html
fs.copyFileSync(indexPath, notFoundPath);
console.log('Created 404.html from index.html');
