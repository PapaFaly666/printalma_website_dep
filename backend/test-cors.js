#!/usr/bin/env node

/**
 * Script de test CORS pour vérifier que les routes API fonctionnent correctement
 */

const http = require('http');

const testData = {
  userId: 1,
  shop_name: 'Boutique Test',
  facebook_url: 'facebook.com/test',
  instagram_url: 'instagram.com/@test'
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`\n📡 Réponse ${method} ${path}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers:`, res.headers);
        try {
          const jsonBody = JSON.parse(body);
          console.log(`   Body:`, jsonBody);
        } catch (e) {
          console.log(`   Body:`, body);
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Erreur ${method} ${path}:`, err.message);
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCORS() {
  console.log('🧪 === TEST CORS - BACKEND PRINTALMA ===\n');

  try {
    // Test 1: OPTIONS (preflight)
    console.log('1️⃣ Test OPTIONS /auth/vendor/profile');
    await makeRequest('OPTIONS', '/auth/vendor/profile');

    // Test 2: GET profil
    console.log('\n2️⃣ Test GET /auth/vendor/profile?userId=1');
    await makeRequest('GET', '/auth/vendor/profile?userId=1');

    // Test 3: PUT mise à jour
    console.log('\n3️⃣ Test PUT /auth/vendor/profile');
    await makeRequest('PUT', '/auth/vendor/profile', testData);

    console.log('\n✅ Tests CORS terminés avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests CORS:', error.message);
    process.exit(1);
  }
}

// Vérifier que le serveur est en cours d'exécution
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3004,
      path: '/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      reject(new Error('Le serveur backend n\'est pas démarré sur localhost:3004'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Vérification du serveur backend...');
    await checkServer();
    console.log('✅ Serveur backend détecté\n');
    await testCORS();
  } catch (error) {
    console.error('❌', error.message);
    console.log('\n💡 Solution:');
    console.log('1. Démarrez le serveur backend: cd backend && npm start');
    console.log('2. Assurez-vous que le port 3004 est disponible');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testCORS };