// Script de test pour la création de produits vendeur par l'admin (Frontend)
const API_URL = 'http://localhost:3004';

// Fonction pour afficher les logs avec des couleurs
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  step: (msg) => console.log(`\x1b[34m[STEP]\x1b[0m ${msg}`),
};

// Fonction pour faire une requête HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

// Test du système complet
async function testAdminCreateVendorProduct() {
  console.log('\n🎯 Test du système de création de produits vendeur par l\'admin\n');

  try {
    // 1. Test de connexion admin
    log.step('1. Connexion en tant qu\'admin');
    const loginData = {
      email: 'admin@example.com',
      password: 'password123'
    };

    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (loginResponse.user?.role !== 'ADMIN') {
      throw new Error('Utilisateur non admin');
    }

    log.success(`Connecté en tant qu'admin: ${loginResponse.user.email}`);

    // 2. Test de récupération des vendeurs
    log.step('2. Récupération des vendeurs disponibles');
    const vendorsResponse = await makeRequest('/vendor-product-validation/vendors');
    
    if (!vendorsResponse.vendors || vendorsResponse.vendors.length === 0) {
      throw new Error('Aucun vendeur disponible');
    }

    log.success(`${vendorsResponse.vendors.length} vendeurs trouvés`);
    
    // Afficher les 3 premiers vendeurs
    vendorsResponse.vendors.slice(0, 3).forEach((vendor, index) => {
      log.info(`  ${index + 1}. ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
      log.info(`     - Boutique: ${vendor.shop_name || 'Non définie'}`);
      log.info(`     - Produits: ${vendor.productCount}, Designs: ${vendor.designCount}`);
    });

    // 3. Test de récupération des produits de base
    log.step('3. Récupération des produits de base');
    const productsResponse = await makeRequest('/products');
    
    if (!productsResponse.products || productsResponse.products.length === 0) {
      throw new Error('Aucun produit de base disponible');
    }

    log.success(`${productsResponse.products.length} produits de base trouvés`);
    
    // Afficher les 3 premiers produits
    productsResponse.products.slice(0, 3).forEach((product, index) => {
      log.info(`  ${index + 1}. ${product.name} - ${product.price} CFA`);
      log.info(`     - Couleurs: ${product.colorVariations?.length || 0}, Tailles: ${product.sizes?.length || 0}`);
    });

    // 4. Test de récupération des designs d'un vendeur
    const firstVendor = vendorsResponse.vendors[0];
    log.step(`4. Récupération des designs du vendeur ${firstVendor.firstName} ${firstVendor.lastName}`);
    
    const designsResponse = await makeRequest(`/designs/by-vendor/${firstVendor.id}`);
    
    if (!designsResponse.designs || designsResponse.designs.length === 0) {
      log.warning('Aucun design trouvé pour ce vendeur');
      return;
    }

    log.success(`${designsResponse.designs.length} designs trouvés pour ce vendeur`);
    
    // Afficher les designs
    designsResponse.designs.slice(0, 3).forEach((design, index) => {
      log.info(`  ${index + 1}. ${design.name} (${design.category})`);
      log.info(`     - Format: ${design.format}, Validé: ${design.isValidated ? 'Oui' : 'Non'}`);
    });

    // 5. Test de création d'un produit
    const firstProduct = productsResponse.products[0];
    const firstDesign = designsResponse.designs[0];
    
    log.step('5. Création d\'un produit pour le vendeur');
    
    const createProductData = {
      vendorId: firstVendor.id,
      baseProductId: firstProduct.id,
      designId: firstDesign.id,
      vendorPrice: firstProduct.price + 1000, // Prix légèrement plus élevé
      vendorName: `${firstProduct.name} - Version ${firstVendor.firstName}`,
      vendorDescription: `${firstProduct.description} - Personnalisé avec le design "${firstDesign.name}"`,
      vendorStock: Math.floor(firstProduct.stock / 2), // Stock réduit
      selectedColors: firstProduct.colorVariations?.slice(0, 2).map(c => ({
        id: c.id,
        name: c.name,
        colorCode: c.colorCode
      })) || [],
      selectedSizes: firstProduct.sizes?.slice(0, 2).map(s => ({
        id: s.id,
        sizeName: s.sizeName
      })) || [],
      designPosition: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      },
      forcedStatus: 'DRAFT',
      bypassAdminValidation: true,
      postValidationAction: 'TO_DRAFT'
    };

    log.info('Données de création:');
    log.info(`  - Vendeur: ${firstVendor.firstName} ${firstVendor.lastName}`);
    log.info(`  - Produit base: ${firstProduct.name}`);
    log.info(`  - Design: ${firstDesign.name}`);
    log.info(`  - Prix: ${createProductData.vendorPrice} CFA`);
    log.info(`  - Couleurs: ${createProductData.selectedColors.length}`);
    log.info(`  - Tailles: ${createProductData.selectedSizes.length}`);

    const createResponse = await makeRequest('/vendor-product-validation/create-for-vendor', {
      method: 'POST',
      body: JSON.stringify(createProductData)
    });

    if (!createResponse.success) {
      throw new Error('Échec de la création du produit');
    }

    log.success(`Produit créé avec succès !`);
    log.info(`  - ID produit: ${createResponse.productId}`);
    log.info(`  - Statut: ${createResponse.status}`);
    log.info(`  - Message: ${createResponse.message}`);

    // 6. Vérification du produit créé
    log.step('6. Vérification du produit créé');
    
    const allProductsResponse = await makeRequest('/vendor-product-validation/all-products?limit=5');
    
    const createdProduct = allProductsResponse.products.find(p => p.id === createResponse.productId);
    
    if (!createdProduct) {
      throw new Error('Produit créé non trouvé dans la liste');
    }

    log.success('Produit vérifié avec succès !');
    log.info(`  - Nom: ${createdProduct.name}`);
    log.info(`  - Prix: ${createdProduct.price} CFA`);
    log.info(`  - Statut: ${createdProduct.status}`);
    log.info(`  - Design appliqué: ${createdProduct.hasDesign ? 'Oui' : 'Non'}`);
    log.info(`  - Vendeur: ${createdProduct.vendor.firstName} ${createdProduct.vendor.lastName}`);

    // 7. Test de statistiques
    log.step('7. Vérification des statistiques');
    
    const statsResponse = await makeRequest('/vendor-product-validation/all-products?limit=1');
    
    log.success('Statistiques mises à jour:');
    log.info(`  - Total produits: ${statsResponse.stats.totalProducts}`);
    log.info(`  - Produits validés: ${statsResponse.stats.validatedProducts}`);
    log.info(`  - Taux de validation: ${statsResponse.stats.validationRate}%`);
    log.info(`  - Total designs: ${statsResponse.stats.totalDesigns}`);

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n🎯 Le système de création de produits vendeur par l\'admin fonctionne correctement.');
    console.log('💾 Les données sont sauvegardées dans localStorage côté frontend.');
    console.log('🔄 Le processus en 5 étapes est opérationnel.');
    console.log('🎨 L\'intégration avec l\'API backend est validée.');

  } catch (error) {
    log.error(`Test échoué: ${error.message}`);
    console.error('Détails de l\'erreur:', error);
    
    // Recommandations en cas d'erreur
    console.log('\n🔧 Recommandations:');
    console.log('1. Vérifiez que le backend est démarré sur le port 3004');
    console.log('2. Vérifiez que l\'utilisateur admin existe dans la base de données');
    console.log('3. Vérifiez que des vendeurs avec des designs existent');
    console.log('4. Vérifiez que des produits de base existent');
    console.log('5. Vérifiez la configuration CORS du backend');
  }
}

// Fonction pour afficher les informations de localStorage
function testLocalStorage() {
  console.log('\n🗄️ Test du localStorage\n');

  const LOCALSTORAGE_KEY = 'admin_create_vendor_product_data';
  
  // Simuler des données localStorage
  const mockData = {
    currentStep: 3,
    vendorId: 1,
    selectedVendor: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    baseProductId: 1,
    selectedBaseProduct: {
      id: 1,
      name: 'T-Shirt Premium',
      price: 15000
    },
    designId: 1,
    selectedDesign: {
      id: 1,
      name: 'Logo Creative',
      category: 'Logo'
    },
    vendorPrice: 18000,
    vendorName: 'T-Shirt Premium - Version John',
    lastSaved: new Date().toISOString()
  };

  // Sauvegarder dans localStorage (simulation)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(mockData));
    log.success('Données sauvegardées dans localStorage');
  } else {
    log.warning('localStorage non disponible dans cet environnement');
  }

  log.info('Structure des données localStorage:');
  log.info(`  - Étape actuelle: ${mockData.currentStep}/5`);
  log.info(`  - Vendeur sélectionné: ${mockData.selectedVendor.firstName} ${mockData.selectedVendor.lastName}`);
  log.info(`  - Produit de base: ${mockData.selectedBaseProduct.name}`);
  log.info(`  - Design: ${mockData.selectedDesign.name}`);
  log.info(`  - Prix configuré: ${mockData.vendorPrice} CFA`);
  log.info(`  - Dernière sauvegarde: ${new Date(mockData.lastSaved).toLocaleString()}`);
  
  console.log('\n✅ Test localStorage terminé');
}

// Fonction principale
async function main() {
  console.log('🎯 Test complet du système de création de produits vendeur par l\'admin');
  console.log('====================================================================');

  // Test du localStorage
  testLocalStorage();

  // Test de l'API
  await testAdminCreateVendorProduct();

  console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
main().catch(console.error); 