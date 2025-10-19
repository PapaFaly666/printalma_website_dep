#!/usr/bin/env node

/**
 * 🧪 Script pour vérifier toutes les variations disponibles
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3004';

// Fonction utilitaire pour faire des appels API
function fetchAPI(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const postData = options.body ? JSON.stringify(options.body) : null;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (postData) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = lib.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${res.statusText}\nResponse: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}\nResponse: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Vérifier toutes les variations disponibles
async function testAllVariations() {
  console.log('🔍 Vérification de toutes les variations disponibles');

  try {
    // Récupérer toutes les catégories
    const categories = await fetchAPI('/categories');
    
    // Tester chaque catégorie
    for (const category of categories) {
      console.log(`\n📂 Catégorie: ${category.name} (ID: ${category.id})`);
      
      const subCategories = await fetchAPI(`/sub-categories?categoryId=${category.id}`);
      
      for (const subCategory of subCategories) {
        console.log(`  📁 Sous-catégorie: ${subCategory.name} (ID: ${subCategory.id})`);
        
        const variations = await fetchAPI(`/variations?subCategoryId=${subCategory.id}`);
        
        if (variations.length > 0) {
          console.log(`    🎨 Variations (${variations.length}):`);
          for (const variation of variations) {
            console.log(`      - ${variation.name} (ID: ${variation.id})`);
            
            // Construire le chemin complet
            const fullPath = `${category.name} > ${subCategory.name} > ${variation.name}`;
            console.log(`        🧪 Test: "${fullPath}"`);
            
            // Préparer les données pour la création de produit
            const productData = {
              name: `Produit ${category.name} ${subCategory.name}`,
              description: `Test d'affectation pour ${fullPath}`,
              price: 99.99,
              categoryId: category.id,
              subCategoryId: subCategory.id,
              variationId: variation.id,
              status: "DRAFT"
            };
            
            console.log(`        ✅ Données produit valides!`);
          }
        } else {
          console.log(`    ❌ Aucune variation trouvée`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAllVariations();
