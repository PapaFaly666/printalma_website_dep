#!/usr/bin/env node

/**
 * Script de test pour vérifier la connectivité du backend
 * Usage: node test-backend-connectivity.js
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'http://localhost:3004';

// Fonction pour tester une URL
async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: jsonData,
            description
          });
        } catch (e) {
          resolve({
            success: true,
            status: res.statusCode,
            data: data,
            description
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        description
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout après 5 secondes',
        description
      });
    });
  });
}

// Tests à effectuer
const tests = [
  { url: `${BACKEND_URL}/health`, description: 'Health Check' },
  { url: `${BACKEND_URL}/auth/check`, description: 'Authentification' },
  { url: `${BACKEND_URL}/themes`, description: 'Liste des thèmes' },
  { url: `${BACKEND_URL}/products`, description: 'Liste des produits' }
];

async function runTests() {
  console.log('🔧 Test de Connectivité Backend');
  console.log('================================');
  console.log(`URL de base: ${BACKEND_URL}\n`);
  
  for (const test of tests) {
    console.log(`📡 Test: ${test.description}`);
    console.log(`   URL: ${test.url}`);
    
    const result = await testEndpoint(test.url, test.description);
    
    if (result.success) {
      if (result.status === 200) {
        console.log(`   ✅ Succès (${result.status})`);
        if (result.data && typeof result.data === 'object') {
          console.log(`   📊 Données: ${JSON.stringify(result.data).substring(0, 100)}...`);
        }
      } else if (result.status === 401) {
        console.log(`   ⚠️  Non autorisé (${result.status}) - Authentification requise`);
      } else {
        console.log(`   ⚠️  Statut inattendu (${result.status})`);
      }
    } else {
      console.log(`   ❌ Erreur: ${result.error}`);
    }
    
    console.log('');
  }
  
  console.log('📋 Résumé des Recommandations:');
  console.log('================================');
  
  // Analyser les résultats et donner des recommandations
  const healthTest = await testEndpoint(`${BACKEND_URL}/health`, 'Health Check');
  
  if (!healthTest.success) {
    console.log('🚨 Le serveur backend ne semble pas démarré');
    console.log('   → Démarrez le serveur backend sur le port 3004');
    console.log('   → Vérifiez que le serveur fonctionne correctement');
  } else {
    console.log('✅ Le serveur backend répond');
    
    const authTest = await testEndpoint(`${BACKEND_URL}/auth/check`, 'Auth');
    if (authTest.success && authTest.status === 401) {
      console.log('🔐 Authentification requise');
      console.log('   → Connectez-vous à l\'application');
      console.log('   → Vérifiez vos cookies de session');
    }
    
    const themesTest = await testEndpoint(`${BACKEND_URL}/themes`, 'Themes');
    if (themesTest.success && themesTest.status === 200) {
      console.log('✅ L\'API des thèmes fonctionne');
    } else {
      console.log('⚠️  L\'API des thèmes ne répond pas correctement');
    }
  }
  
  console.log('\n💡 Pour plus d\'aide, consultez le fichier GUIDE_DEPANNAGE_THEMES.md');
}

// Exécuter les tests
runTests().catch(console.error); 