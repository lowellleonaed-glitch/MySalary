const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const wwwDir = path.join(rootDir, 'www');

// Files and folders to copy to www directory for Capacitor build
const filesToCopy = [
    'index.html',
    'app.js',
    'style.css',
    'sw.js',
    'manifest.json',
    'manifest.webmanifest',
    'favicon.ico',
    'favicon.svg',
    'favicon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'apple-touch-icon-precomposed.png',
    'icon-192.png',
    'icon-512.png'
];

const dirsToCopy = [
    'icons',
    'data'
];

function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(source)) return;
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    files.forEach((file) => {
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, curTarget);
        } else {
            fs.copyFileSync(curSource, curTarget);
        }
    });
}

// Ensure www directory exists and is clean
if (fs.existsSync(wwwDir)) {
    fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

// Copy individual files
filesToCopy.forEach((file) => {
    const src = path.join(rootDir, file);
    const dest = path.join(wwwDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    }
});

// Copy directories
dirsToCopy.forEach((dir) => {
    const src = path.join(rootDir, dir);
    const dest = path.join(wwwDir, dir);
    if (fs.existsSync(src)) {
        copyFolderRecursiveSync(src, dest);
    }
});

console.log('Successfully generated www directory for Capacitor Android build!');
