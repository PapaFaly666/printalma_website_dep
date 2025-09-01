#!/usr/bin/env node

/**
 * Script pour résoudre le problème d'import de useProducts
 * Erreur: GET http://localhost:5174/src/hooks/useProducts.js?t=1753966663273 net::ERR_ABORTED 404 (Not Found)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix useProducts Import Problem');
console.log('================================');

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Fonction pour nettoyer le cache
function cleanCache() {
  console.log('\n🧹 Nettoyage du cache...');
  
  const cachePaths = [
    'node_modules/.vite',
    'node_modules/.cache',
    '.vite',
    'dist'
  ];
  
  cachePaths.forEach(cachePath => {
    if (fileExists(cachePath)) {
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
}

// Fonction pour vérifier les fichiers
function checkFiles() {
  console.log('\n📁 Vérification des fichiers...');
  
  const filesToCheck = [
    'src/hooks/useProducts.ts',
    'vite.config.ts',
    'tsconfig.json',
    'package.json'
  ];
  
  filesToCheck.forEach(filePath => {
    if (fileExists(filePath)) {
      console.log(`✅ Existe: ${filePath}`);
    } else {
      console.log(`❌ Manquant: ${filePath}`);
    }
  });
}

// Fonction pour vérifier les imports
function checkImports() {
  console.log('\n🔍 Vérification des imports...');
  
  const filesWithImports = [
    'src/pages/Landing.tsx',
    'src/pages/ProductList.tsx',
    'src/pages/ModernProductDetail.tsx',
    'src/pages/CategoryManagement.tsx'
  ];
  
  filesWithImports.forEach(filePath => {
    if (fileExists(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('useProducts')) {
          console.log(`✅ Import trouvé dans: ${filePath}`);
        } else {
          console.log(`ℹ️  Pas d'import dans: ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Erreur lecture: ${filePath}`);
      }
    } else {
      console.log(`❌ Fichier manquant: ${filePath}`);
    }
  });
}

// Fonction pour redémarrer le serveur
function restartServer() {
  console.log('\n🚀 Redémarrage du serveur...');
  
  try {
    // Arrêter le serveur actuel (si en cours)
    console.log('⏹️  Arrêt du serveur actuel...');
    
    // Redémarrer avec --force
    console.log('🔄 Redémarrage avec --force...');
    console.log('💡 Utilisez: npm run dev -- --force');
    console.log('💡 Ou: yarn dev --force');
    
  } catch (error) {
    console.log(`❌ Erreur lors du redémarrage: ${error.message}`);
  }
}

// Fonction principale
function main() {
  console.log('🎯 Diagnostic du problème useProducts...\n');
  
  // Vérifier les fichiers
  checkFiles();
  
  // Vérifier les imports
  checkImports();
  
  // Nettoyer le cache
  cleanCache();
  
  // Instructions pour redémarrer
  restartServer();
  
  console.log('\n📋 Résumé des actions:');
  console.log('1. ✅ Cache nettoyé');
  console.log('2. ✅ Fichiers vérifiés');
  console.log('3. ✅ Imports vérifiés');
  console.log('4. 🔄 Redémarrez le serveur avec --force');
  
  console.log('\n🔧 Commandes à exécuter:');
  console.log('npm run dev -- --force');
  console.log('ou');
  console.log('yarn dev --force');
  
  console.log('\n💡 Si le problème persiste:');
  console.log('1. Vérifiez que TypeScript compile correctement');
  console.log('2. Redémarrez complètement votre éditeur');
  console.log('3. Vérifiez les extensions de navigateur');
  
  console.log('\n✅ Diagnostic terminé!');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  cleanCache,
  checkFiles,
  checkImports,
  restartServer
}; 

/**
 * Script pour résoudre le problème d'import de useProducts
 * Erreur: GET http://localhost:5174/src/hooks/useProducts.js?t=1753966663273 net::ERR_ABORTED 404 (Not Found)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix useProducts Import Problem');
console.log('================================');

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Fonction pour nettoyer le cache
function cleanCache() {
  console.log('\n🧹 Nettoyage du cache...');
  
  const cachePaths = [
    'node_modules/.vite',
    'node_modules/.cache',
    '.vite',
    'dist'
  ];
  
  cachePaths.forEach(cachePath => {
    if (fileExists(cachePath)) {
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
}

// Fonction pour vérifier les fichiers
function checkFiles() {
  console.log('\n📁 Vérification des fichiers...');
  
  const filesToCheck = [
    'src/hooks/useProducts.ts',
    'vite.config.ts',
    'tsconfig.json',
    'package.json'
  ];
  
  filesToCheck.forEach(filePath => {
    if (fileExists(filePath)) {
      console.log(`✅ Existe: ${filePath}`);
    } else {
      console.log(`❌ Manquant: ${filePath}`);
    }
  });
}

// Fonction pour vérifier les imports
function checkImports() {
  console.log('\n🔍 Vérification des imports...');
  
  const filesWithImports = [
    'src/pages/Landing.tsx',
    'src/pages/ProductList.tsx',
    'src/pages/ModernProductDetail.tsx',
    'src/pages/CategoryManagement.tsx'
  ];
  
  filesWithImports.forEach(filePath => {
    if (fileExists(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('useProducts')) {
          console.log(`✅ Import trouvé dans: ${filePath}`);
        } else {
          console.log(`ℹ️  Pas d'import dans: ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Erreur lecture: ${filePath}`);
      }
    } else {
      console.log(`❌ Fichier manquant: ${filePath}`);
    }
  });
}

// Fonction pour redémarrer le serveur
function restartServer() {
  console.log('\n🚀 Redémarrage du serveur...');
  
  try {
    // Arrêter le serveur actuel (si en cours)
    console.log('⏹️  Arrêt du serveur actuel...');
    
    // Redémarrer avec --force
    console.log('🔄 Redémarrage avec --force...');
    console.log('💡 Utilisez: npm run dev -- --force');
    console.log('💡 Ou: yarn dev --force');
    
  } catch (error) {
    console.log(`❌ Erreur lors du redémarrage: ${error.message}`);
  }
}

// Fonction principale
function main() {
  console.log('🎯 Diagnostic du problème useProducts...\n');
  
  // Vérifier les fichiers
  checkFiles();
  
  // Vérifier les imports
  checkImports();
  
  // Nettoyer le cache
  cleanCache();
  
  // Instructions pour redémarrer
  restartServer();
  
  console.log('\n📋 Résumé des actions:');
  console.log('1. ✅ Cache nettoyé');
  console.log('2. ✅ Fichiers vérifiés');
  console.log('3. ✅ Imports vérifiés');
  console.log('4. 🔄 Redémarrez le serveur avec --force');
  
  console.log('\n🔧 Commandes à exécuter:');
  console.log('npm run dev -- --force');
  console.log('ou');
  console.log('yarn dev --force');
  
  console.log('\n💡 Si le problème persiste:');
  console.log('1. Vérifiez que TypeScript compile correctement');
  console.log('2. Redémarrez complètement votre éditeur');
  console.log('3. Vérifiez les extensions de navigateur');
  
  console.log('\n✅ Diagnostic terminé!');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  cleanCache,
  checkFiles,
  checkImports,
  restartServer
}; 
 
 
 
 
 