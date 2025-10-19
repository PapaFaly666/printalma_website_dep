#!/usr/bin/env node

/**
 * 🧪 Script de test pour le système d'affectation des catégories
 * Simule les appels API pour vérifier l'extraction des IDs
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

// Fonction pour tester l'extraction des IDs de catégories
async function testCategoryExtraction(categoryString) {
  console.log('\n🧪 [TEST] Test d\'extraction de catégories');
  console.log('📝 Input:', categoryString);

  // Extraire les noms depuis le format "Category > SubCategory > Variation"
  const parts = categoryString.split(' > ').map(p => p.trim());

  if (parts.length !== 3) {
    console.error('❌ Format invalide. Attendu: "Category > SubCategory > Variation"');
    return null;
  }

  const [categoryName, subCategoryName, variationName] = parts;
  console.log('🔍 Éléments extraits:', { categoryName, subCategoryName, variationName });

  try {
    // 1. Tester la récupération des catégories
    console.log('\n1️⃣ Test GET /categories');
    const categories = await fetchAPI('/categories');

    if (!categories) {
      console.error('❌ Impossible de récupérer les catégories');
      return null;
    }

    console.log(`✅ ${categories.length} catégories trouvées`);
    console.log('📋 Catégories disponibles:', categories.map(c => ({ id: c.id, name: c.name })));

    const category = categories.find(c => c.name === categoryName);
    if (!category) {
      console.error(`❌ Catégorie "${categoryName}" non trouvée`);
      console.log('   Catégories disponibles:', categories.map(c => c.name).join(', '));
      return null;
    }

    console.log(`✅ Catégorie trouvée: ${categoryName} (ID: ${category.id})`);

    // 2. Tester la récupération des sous-catégories
    console.log(`\n2️⃣ Test GET /sub-categories?categoryId=${category.id}`);
    const subCategories = await fetchAPI(`/sub-categories?categoryId=${category.id}`);

    if (!subCategories) {
      console.error('❌ Impossible de récupérer les sous-catégories');
      return null;
    }

    console.log(`✅ ${subCategories.length} sous-catégories trouvées`);
    console.log('📋 Sous-catégories disponibles:', subCategories.map(sc => ({ id: sc.id, name: sc.name })));

    const subCategory = subCategories.find(sc => sc.name === subCategoryName);
    if (!subCategory) {
      console.error(`❌ Sous-catégorie "${subCategoryName}" non trouvée`);
      console.log('   Sous-catégories disponibles:', subCategories.map(sc => sc.name).join(', '));
      return null;
    }

    console.log(`✅ Sous-catégorie trouvée: ${subCategoryName} (ID: ${subCategory.id})`);

    // 3. Tester la récupération des variations
    console.log(`\n3️⃣ Test GET /variations?subCategoryId=${subCategory.id}`);
    const variations = await fetchAPI(`/variations?subCategoryId=${subCategory.id}`);

    if (!variations) {
      console.error('❌ Impossible de récupérer les variations');
      return null;
    }

    console.log(`✅ ${variations.length} variations trouvées`);
    console.log('📋 Variations disponibles:', variations.map(v => ({ id: v.id, name: v.name })));

    const variation = variations.find(v => v.name === variationName);
    if (!variation) {
      console.error(`❌ Variation "${variationName}" non trouvée`);
      console.log('   Variations disponibles:', variations.map(v => v.name).join(', '));
      return null;
    }

    console.log(`✅ Variation trouvée: ${variationName} (ID: ${variation.id})`);

    const result = {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id,
      categoryName: category.name,
      subCategoryName: subCategory.name,
      variationName: variation.name
    };

    console.log('\n🎉 [TEST] SUCCÈS - Tous les IDs extraits');
    console.log('📊 Résultat final:', result);

    return result;

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    return null;
  }
}

// Test de création de produit avec les IDs extraits
async function testProductCreation(categoryIds) {
  console.log('\n🛍️ [TEST] Test de création de produit avec les IDs extraits');

  const productData = {
    name: "Produit Test Catégories",
    description: "Produit créé pour tester l'affectation des catégories",
    price: 99.99,
    sku: "TEST-CAT-001",
    categoryId: categoryIds.categoryId,
    subCategoryId: categoryIds.subCategoryId,
    variationId: categoryIds.variationId,
    status: "DRAFT",
    stock: 10
  };

  console.log('📦 Données du produit:', productData);

  // Simulation de la création (sans image pour le test)
  console.log('\n⚠️ Note: Création simulée (requiert des images en production)');
  console.log('✅ Structure des IDs valide pour la création de produit');

  return productData;
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Démarrage des tests du système d\'affectation des catégories');
  console.log('🌐 URL Backend:', BACKEND_URL);

  // Tests avec différentes catégories (à adapter selon vos données)
  const testCases = [
    "Vêtements > T-Shirts > Couleur",
    "Accessoires > Sacs > Taille",
    "Vêtements > Hoodies > Matière"
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test cas: ${testCase}`);
    console.log('='.repeat(60));

    const result = await testCategoryExtraction(testCase);

    if (result) {
      await testProductCreation(result);
    } else {
      console.log(`❌ Test échoué pour: ${testCase}`);
    }
  }

  console.log('\n🏁 Tests terminés');
  console.log('\n📝 Instructions pour tester dans l\'interface:');
  console.log('1. Allez sur http://localhost:5175/');
  console.log('2. Connectez-vous comme admin');
  console.log('3. Accédez à la création de produit');
  console.log('4. Sélectionnez une catégorie complète (ex: "Vêtements > T-Shirts > Couleur")');
  console.log('5. Vérifiez les logs dans la console du navigateur');
  console.log('6. Les logs devraient montrer les IDs extraits avec les préfixes [EXTRACT], [SUBMIT], [PAYLOAD]');
}

// Exécuter les tests
runTests().catch(console.error);
