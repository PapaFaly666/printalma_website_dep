const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage du cache Vite...');

const cachePaths = [
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  'dist'
];

cachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log(`✅ Supprimé: ${cachePath}`);
    } catch (error) {
      console.log(`⚠️  Impossible de supprimer: ${cachePath} (${error.message})`);
    }
  } else {
    console.log(`ℹ️  Pas de cache à supprimer: ${cachePath}`);
  }
});

console.log('\n✅ Cache nettoyé!');
console.log('🔄 Redémarrez le serveur avec: npm run dev -- --force'); 
const path = require('path');

console.log('🧹 Nettoyage du cache Vite...');

const cachePaths = [
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  'dist'
];

cachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log(`✅ Supprimé: ${cachePath}`);
    } catch (error) {
      console.log(`⚠️  Impossible de supprimer: ${cachePath} (${error.message})`);
    }
  } else {
    console.log(`ℹ️  Pas de cache à supprimer: ${cachePath}`);
  }
});

console.log('\n✅ Cache nettoyé!');
console.log('🔄 Redémarrez le serveur avec: npm run dev -- --force'); 
 
 
 
 
 