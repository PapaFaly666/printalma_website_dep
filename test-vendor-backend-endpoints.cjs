/**
 * Test des Endpoints Backend Vendeur - PrintAlma
 * Diagnostic et test de connectivité avec le backend
 */

// Utiliser fetch natif de Node.js (version 18+) ou alternative
let fetch;
try {
  // Node.js 18+ avec fetch natif
  fetch = globalThis.fetch;
} catch {
  // Fallback pour versions antérieures
  console.log('⚠️ Fetch natif non disponible, utilisation d\'une alternative simple');
  
  // Alternative simple avec http/https
  const http = require('http');
  const https = require('https');
  const { URL } = require('url');
  
  fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      
      const req = lib.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => {
              try {
                return Promise.resolve(JSON.parse(data));
              } catch {
                return Promise.reject(new Error('Invalid JSON'));
              }
            }
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

const API_BASE_URL = 'http://localhost:3004';

// Liste des endpoints à tester
const ENDPOINTS_TO_TEST = [
  // Endpoints vendeur attendus
  { method: 'GET', path: '/vendor/products', description: 'Liste des produits vendeur' },
  { method: 'POST', path: '/vendor/products', description: 'Création produit vendeur' },
  { method: 'GET', path: '/vendor/stats', description: 'Statistiques vendeur' },
  
  // Endpoints existants possibles
  { method: 'GET', path: '/api/vendor/products', description: 'Liste produits (avec /api)' },
  { method: 'POST', path: '/api/vendor/products', description: 'Création produit (avec /api)' },
  { method: 'GET', path: '/api/products', description: 'Produits généraux' },
  { method: 'GET', path: '/products', description: 'Produits sans /api' },
  
  // Endpoints auth
  { method: 'GET', path: '/auth/me', description: 'Profil utilisateur' },
  { method: 'GET', path: '/api/auth/me', description: 'Profil utilisateur (avec /api)' },
  
  // Health check
  { method: 'GET', path: '/health', description: 'Health check' },
  { method: 'GET', path: '/', description: 'Root endpoint' },
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Test ${endpoint.method} ${endpoint.path}`);
    console.log(`   📝 ${endpoint.description}`);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Ajouter un body minimal pour les POST
      ...(endpoint.method === 'POST' && {
        body: JSON.stringify({ test: true })
      })
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
    
    console.log(`   📡 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`   ✅ ENDPOINT DISPONIBLE`);
      try {
        const data = await response.json();
        console.log(`   📋 Réponse: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (e) {
        console.log(`   📋 Réponse: Non-JSON`);
      }
      return { ...endpoint, available: true, status: response.status };
    } else {
      console.log(`   ❌ ENDPOINT NON DISPONIBLE`);
      return { ...endpoint, available: false, status: response.status };
    }
    
  } catch (error) {
    console.log(`   💥 ERREUR DE CONNEXION: ${error.message}`);
    return { ...endpoint, available: false, error: error.message };
  }
}

async function testBackendConnectivity() {
  console.log('🚀 === TEST DE CONNECTIVITÉ BACKEND ===');
  console.log(`🔗 URL Backend: ${API_BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

async function generateBackendDocumentation(results) {
  console.log('\n📊 === RAPPORT FINAL ===');
  
  const available = results.filter(r => r.available);
  const unavailable = results.filter(r => !r.available);
  
  console.log(`\n✅ ENDPOINTS DISPONIBLES (${available.length}):`);
  available.forEach(endpoint => {
    console.log(`   ${endpoint.method} ${endpoint.path} (${endpoint.status})`);
  });
  
  console.log(`\n❌ ENDPOINTS MANQUANTS (${unavailable.length}):`);
  unavailable.forEach(endpoint => {
    console.log(`   ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
  });
  
  // Vérifier si le backend est accessible
  const backendAccessible = results.some(r => r.available);
  
  if (!backendAccessible) {
    console.log('\n🚨 PROBLÈME CRITIQUE: Backend inaccessible');
    console.log('   🔧 Vérifiez que le serveur backend tourne sur le port 3004');
    console.log('   🔧 Commande: npm start ou node server.js');
    return;
  }
  
  // Diagnostic spécifique vendeur
  const vendorEndpoints = results.filter(r => r.path.includes('vendor'));
  const vendorAvailable = vendorEndpoints.filter(r => r.available);
  
  if (vendorAvailable.length === 0) {
    console.log('\n🚨 PROBLÈME: Aucun endpoint vendeur disponible');
    console.log('   📝 Le backend doit implémenter les routes vendeur');
    console.log('   📂 Fichiers à créer/modifier:');
    console.log('      - routes/vendor.js');
    console.log('      - controllers/vendorController.js');
    console.log('      - models/VendorProduct.js');
  }
  
  console.log('\n📋 PROCHAINES ÉTAPES:');
  if (vendorAvailable.length === 0) {
    console.log('   1. Implémenter les routes vendeur dans le backend');
    console.log('   2. Créer le controller vendeur');
    console.log('   3. Configurer les modèles de données');
    console.log('   4. Tester avec ce script');
  } else {
    console.log('   1. Vérifier la structure des données attendues');
    console.log('   2. Tester l\'authentification vendeur');
    console.log('   3. Valider le payload de création');
  }
}

async function createMinimalTestPayload() {
  console.log('\n🧪 === PAYLOAD DE TEST MINIMAL ===');
  
  const testPayload = {
    baseProductId: 1,
    designUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    finalImages: {
      colorImages: {
        "Blanc": {
          colorInfo: {
            id: 1,
            name: "Blanc",
            colorCode: "#ffffff"
          },
          imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          imageKey: "Blanc"
        }
      },
      statistics: {
        totalColorImages: 1,
        hasDefaultImage: false,
        availableColors: ["Blanc"],
        totalImagesGenerated: 1
      }
    },
    finalImagesBase64: {
      "design": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    },
    vendorPrice: 25.99,
    vendorName: "Test Product",
    vendorDescription: "Produit de test",
    basePriceAdmin: 20.00,
    selectedSizes: [{ id: 1, sizeName: "M" }],
    selectedColors: [{ id: 1, name: "Blanc", colorCode: "#ffffff" }],
    previewView: {
      viewType: "FRONT",
      url: "https://example.com/preview.jpg"
    },
    publishedAt: new Date().toISOString()
  };
  
  console.log('📦 Payload de test créé:');
  console.log(`   📏 Taille: ${JSON.stringify(testPayload).length} caractères`);
  console.log(`   🎨 Design inclus: OUI`);
  console.log(`   🖼️ Images couleur: ${Object.keys(testPayload.finalImages.colorImages).length}`);
  
  return testPayload;
}

async function testVendorProductCreation(testPayload) {
  console.log('\n🧪 === TEST CRÉATION PRODUIT VENDEUR ===');
  
  const vendorEndpoints = ['/vendor/products', '/api/vendor/products'];
  
  for (const endpoint of vendorEndpoints) {
    try {
      console.log(`\n🔍 Test POST ${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ CRÉATION RÉUSSIE`);
        console.log(`   📋 Réponse: ${JSON.stringify(data, null, 2)}`);
        return { success: true, endpoint, data };
      } else {
        try {
          const errorData = await response.json();
          console.log(`   ❌ CRÉATION ÉCHOUÉE`);
          console.log(`   📋 Erreur: ${JSON.stringify(errorData, null, 2)}`);
        } catch {
          console.log(`   ❌ CRÉATION ÉCHOUÉE (pas de détails JSON)`);
        }
      }
      
    } catch (error) {
      console.log(`   💥 ERREUR: ${error.message}`);
    }
  }
  
  return { success: false };
}

// Exécution principale
async function main() {
  console.log('🎯 === DIAGNOSTIC BACKEND VENDEUR PRINTALMA ===\n');
  
  try {
    // 1. Test de connectivité
    const results = await testBackendConnectivity();
    
    // 2. Génération du rapport
    await generateBackendDocumentation(results);
    
    // 3. Test avec payload minimal
    const testPayload = await createMinimalTestPayload();
    await testVendorProductCreation(testPayload);
    
    console.log('\n🎯 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (error) {
    console.error('💥 Erreur lors du diagnostic:', error);
  }
}

// Lancement du script
if (require.main === module) {
  main();
}

module.exports = {
  testBackendConnectivity,
  createMinimalTestPayload,
  testVendorProductCreation
}; 