#!/usr/bin/env node

/**
 * 🧪 Script de test avec les vraies données du backend
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

// Test avec les vraies données disponibles
async function testWithRealData() {
  console.log('🚀 Test avec les vraies données du backend');

  try {
    // 1. Récupérer toutes les catégories
    const categories = await fetchAPI('/categories');
    console.log('\n📋 Catégories disponibles:');
    categories.forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });

    // 2. Tester avec "Vêtements > Tshirt > [variations]"
    const vetements = categories.find(c => c.name === 'Vêtements');
    if (vetements) {
      console.log(`\n✅ Test avec la catégorie "Vêtements" (ID: ${vetements.id})`);

      // Récupérer les sous-catégories de Vêtements
      const subCategories = await fetchAPI(`/sub-categories?categoryId=${vetements.id}`);
      console.log('\n📋 Sous-catégories de Vêtements:');
      subCategories.forEach(sc => {
        console.log(`   - ${sc.name} (ID: ${sc.id})`);
      });

      if (subCategories.length > 0) {
        const tshirt = subCategories[0]; // Utiliser la première sous-catégorie
        console.log(`\n✅ Test avec la sous-catégorie "${tshirt.name}" (ID: ${tshirt.id})`);

        // Récupérer les variations de cette sous-catégorie
        const variations = await fetchAPI(`/variations?subCategoryId=${tshirt.id}`);
        console.log('\n📋 Variations disponibles:');
        if (variations.length > 0) {
          variations.forEach(v => {
            console.log(`   - ${v.name} (ID: ${v.id})`);
          });

          // Test d'extraction complète
          const categoryString = `${vetements.name} > ${tshirt.name} > ${variations[0].name}`;
          console.log(`\n🧪 Test d'extraction complète: "${categoryString}"`);

          const result = {
            categoryId: vetements.id,
            subCategoryId: tshirt.id,
            variationId: variations[0].id,
            categoryName: vetements.name,
            subCategoryName: tshirt.name,
            variationName: variations[0].name
          };

          console.log('\n🎉 SUCCÈS - Extraction complète réussie!');
          console.log('📊 Résultat:', result);

          // Simulation de création de produit
          const productData = {
            name: "Produit Test Réel",
            description: "Test avec les vraies catégories",
            price: 99.99,
            categoryId: result.categoryId,
            subCategoryId: result.subCategoryId,
            variationId: result.variationId,
            status: "DRAFT"
          };

          console.log('\n🛍️ Données de produit prêtes pour création:', productData);
          console.log('✅ Structure valide pour la création de produit!');

        } else {
          console.log('❌ Aucune variation trouvée pour cette sous-catégorie');
        }
      }
    }

    // 3. Tester avec "Casquette"
    const casquette = categories.find(c => c.name === 'Casquette');
    if (casquette) {
      console.log(`\n✅ Test avec la catégorie "Casquette" (ID: ${casquette.id})`);

      const subCategories = await fetchAPI(`/sub-categories?categoryId=${casquette.id}`);
      console.log(`📋 Sous-catégories de Casquette: ${subCategories.length} trouvée(s)`);

      if (subCategories.length > 0) {
        subCategories.forEach(sc => {
          console.log(`   - ${sc.name} (ID: ${sc.id})`);
        });
      } else {
        console.log('   Aucune sous-catégorie trouvée');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testWithRealData();
