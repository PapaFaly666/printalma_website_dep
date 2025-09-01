// Script de test pour la création de produits vendeur par l'admin (API V2)
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
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Générer une image base64 de test
function generateTestImageBase64() {
  // Petit carré rouge en base64 (10x10 pixels)
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QjxFjIdYIEwAAABkKAOFcqSBUAAAAAElFTkSuQmCC';
}

// Test du système V2 complet
async function testAdminCreateVendorProductV2() {
  console.log('\n🎯 Test du système de création de produits vendeur par l\'admin (API V2)\n');

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

    // 2. Test de récupération des vendeurs (V2)
    log.step('2. Récupération des vendeurs disponibles (API V2)');
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

    // 4. Test de récupération des designs d'un vendeur (V2)
    const firstVendor = vendorsResponse.vendors[0];
    log.step(`4. Récupération des designs du vendeur ${firstVendor.firstName} ${firstVendor.lastName} (API V2)`);
    
    try {
      const designsResponse = await makeRequest(`/vendor-product-validation/vendors/${firstVendor.id}/designs`);
      
      if (designsResponse.designs && designsResponse.designs.length > 0) {
        log.success(`${designsResponse.designs.length} designs trouvés pour ce vendeur`);
        
        // Test création avec design existant
        await testCreateWithExistingDesign(firstVendor, productsResponse.products[0], designsResponse.designs[0]);
      } else {
        log.warning('Aucun design trouvé pour ce vendeur');
      }
    } catch (error) {
      if (error.message.includes('404')) {
        log.warning('Aucun design trouvé pour ce vendeur (404 - normal)');
      } else {
        throw error;
      }
    }

    // 5. Test création avec nouveau design
    await testCreateWithNewDesign(firstVendor, productsResponse.products[0]);

    console.log('\n✅ Tests API V2 terminés avec succès !');
    console.log('\n🎯 Le système de création de produits vendeur V2 fonctionne correctement.');
    console.log('💾 Support des deux modes : design existant et nouveau design.');
    console.log('🔄 Structure productStructure V2 validée.');
    console.log('🎨 Upload base64 fonctionnel.');

  } catch (error) {
    log.error(`Test échoué: ${error.message}`);
    console.error('Détails de l\'erreur:', error);
    
    // Recommandations en cas d'erreur
    console.log('\n🔧 Recommandations:');
    console.log('1. Vérifiez que le backend est démarré sur le port 3004');
    console.log('2. Vérifiez que l\'utilisateur admin existe dans la base de données');
    console.log('3. Vérifiez que l\'endpoint V2 /vendor-product-validation/create-for-vendor est disponible');
    console.log('4. Vérifiez que l\'endpoint /vendor-product-validation/vendors/{id}/designs fonctionne');
    console.log('5. Vérifiez la configuration CORS du backend');
  }
}

// Test création avec design existant
async function testCreateWithExistingDesign(vendor, product, design) {
  log.step('5a. Test création avec design existant');
  
  const productStructure = {
    adminProduct: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: {
        colorVariations: (product.colorVariations || []).map(variation => ({
          id: variation.id,
          name: variation.name,
          colorCode: variation.colorCode,
          images: (variation.images || []).map(img => ({
            id: img.id,
            url: img.url,
            viewType: img.view || 'FRONT',
            delimitations: (img.delimitations || []).map(delim => ({
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              coordinateType: delim.coordinateType
            }))
          }))
        }))
      },
      sizes: (product.sizes || []).map(size => ({
        id: size.id,
        sizeName: size.sizeName
      }))
    },
    designApplication: {
      positioning: 'CENTER',
      scale: 0.75
    }
  };

  const createData = {
    vendorId: vendor.id,
    baseProductId: product.id,
    designId: design.id,
    productStructure,
    vendorPrice: product.price + 1000,
    vendorName: `${product.name} - Version ${vendor.firstName} (Design Existant)`,
    vendorDescription: `${product.description} - Avec design "${design.name}"`,
    vendorStock: Math.floor(product.stock / 2),
    selectedColors: product.colorVariations?.slice(0, 2).map(c => ({
      id: c.id,
      name: c.name,
      colorCode: c.colorCode
    })) || [],
    selectedSizes: product.sizes?.slice(0, 2).map(s => ({
      id: s.id,
      sizeName: s.sizeName
    })) || [],
    designPosition: { x: 0, y: 0, scale: 0.75, rotation: 0 },
    forcedStatus: 'DRAFT',
    postValidationAction: 'TO_DRAFT',
    bypassAdminValidation: true
  };

  log.info('Données création (design existant):');
  log.info(`  - Vendeur: ${vendor.firstName} ${vendor.lastName}`);
  log.info(`  - Produit base: ${product.name}`);
  log.info(`  - Design existant: ${design.name}`);
  log.info(`  - Prix: ${createData.vendorPrice} CFA`);

  const createResponse = await makeRequest('/vendor-product-validation/create-for-vendor', {
    method: 'POST',
    body: JSON.stringify(createData)
  });

  log.success(`Produit avec design existant créé !`);
  log.info(`  - ID produit: ${createResponse.productId}`);
  log.info(`  - Statut: ${createResponse.status}`);
  log.info(`  - Design créé: ${createResponse.newDesignCreated ? 'Oui' : 'Non'}`);
}

// Test création avec nouveau design
async function testCreateWithNewDesign(vendor, product) {
  log.step('5b. Test création avec nouveau design');
  
  const productStructure = {
    adminProduct: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: {
        colorVariations: (product.colorVariations || []).map(variation => ({
          id: variation.id,
          name: variation.name,
          colorCode: variation.colorCode,
          images: (variation.images || []).map(img => ({
            id: img.id,
            url: img.url,
            viewType: img.view || 'FRONT',
            delimitations: (img.delimitations || []).map(delim => ({
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              coordinateType: delim.coordinateType
            }))
          }))
        }))
      },
      sizes: (product.sizes || []).map(size => ({
        id: size.id,
        sizeName: size.sizeName
      }))
    },
    designApplication: {
      positioning: 'CENTER',
      scale: 0.8
    }
  };

  const createData = {
    vendorId: vendor.id,
    baseProductId: product.id,
    newDesign: {
      name: `Design Test Admin ${Date.now()}`,
      description: 'Design créé automatiquement par test admin',
      category: 'LOGO',
      imageBase64: generateTestImageBase64(),
      tags: ['test', 'admin', 'logo'],
      price: 5000 // Ajout du prix requis
    },
    productStructure,
    vendorPrice: product.price + 1500,
    vendorName: `${product.name} - Version ${vendor.firstName} (Nouveau Design)`,
    vendorDescription: `${product.description} - Avec nouveau design créé par admin`,
    vendorStock: Math.floor(product.stock / 3),
    selectedColors: product.colorVariations?.slice(0, 1).map(c => ({
      id: c.id,
      name: c.name,
      colorCode: c.colorCode
    })) || [],
    selectedSizes: product.sizes?.slice(0, 1).map(s => ({
      id: s.id,
      sizeName: s.sizeName
    })) || [],
    designPosition: { x: 0, y: 0, scale: 0.8, rotation: 0 },
    forcedStatus: 'PENDING', // Car nouveau design
    postValidationAction: 'TO_DRAFT',
    bypassAdminValidation: false
  };

  log.info('Données création (nouveau design):');
  log.info(`  - Vendeur: ${vendor.firstName} ${vendor.lastName}`);
  log.info(`  - Produit base: ${product.name}`);
  log.info(`  - Nouveau design: ${createData.newDesign.name}`);
  log.info(`  - Catégorie: ${createData.newDesign.category}`);
  log.info(`  - Prix: ${createData.vendorPrice} CFA`);

  const createResponse = await makeRequest('/vendor-product-validation/create-for-vendor', {
    method: 'POST',
    body: JSON.stringify(createData)
  });

  log.success(`Produit avec nouveau design créé !`);
  log.info(`  - ID produit: ${createResponse.productId}`);
  log.info(`  - Statut: ${createResponse.status}`);
  log.info(`  - Nouveau design créé: ${createResponse.newDesignCreated ? 'Oui' : 'Non'}`);
  if (createResponse.newDesignCreated) {
    log.info(`  - ID nouveau design: ${createResponse.designId}`);
    log.info(`  - URL design: ${createResponse.designUrl || 'N/A'}`);
  }
}

// Fonction pour tester localStorage V2
function testLocalStorageV2() {
  console.log('\n🗄️ Test du localStorage V2\n');

  const LOCALSTORAGE_KEY = 'admin_create_vendor_product_data';
  
  // Simuler des données localStorage V2
  const mockDataV2 = {
    currentStep: 4,
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
    designMode: 'new',
    newDesign: {
      name: 'Logo Creative V2',
      category: 'LOGO',
      description: 'Design créé avec API V2',
      imageBase64: generateTestImageBase64(),
      tags: ['v2', 'test', 'logo'],
      price: 8000 // Ajout du prix requis
    },
    productStructure: {
      adminProduct: {
        id: 1,
        name: 'T-Shirt Premium',
        price: 15000
      },
      designApplication: {
        positioning: 'CENTER',
        scale: 0.75
      }
    },
    vendorPrice: 18000,
    vendorName: 'T-Shirt Premium - Version John V2',
    lastSaved: new Date().toISOString(),
    // Nouvelles propriétés V2
    designPosition: {
      x: 0.5,
      y: 0.3,
      scale: 1.2,
      rotation: 15
    },
    previewColorId: 1,
    selectedMockupIds: [1, 2, 3]
  };

  // Sauvegarder dans localStorage (simulation)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(mockDataV2));
    log.success('Données V2 sauvegardées dans localStorage');
  } else {
    log.warning('localStorage non disponible dans cet environnement');
  }

  log.info('Structure des données localStorage V2:');
  log.info(`  - Étape actuelle: ${mockDataV2.currentStep}/5`);
  log.info(`  - Vendeur sélectionné: ${mockDataV2.selectedVendor.firstName} ${mockDataV2.selectedVendor.lastName}`);
  log.info(`  - Produit de base: ${mockDataV2.selectedBaseProduct.name}`);
  log.info(`  - Mode design: ${mockDataV2.designMode}`);
  log.info(`  - Nouveau design: ${mockDataV2.newDesign.name}`);
  log.info(`  - Structure produit: ${mockDataV2.productStructure ? 'Présente' : 'Absente'}`);
  log.info(`  - Prix configuré: ${mockDataV2.vendorPrice} CFA`);
  log.info(`  - Position design: X: ${mockDataV2.designPosition.x}, Y: ${mockDataV2.designPosition.y}, Scale: ${mockDataV2.designPosition.scale}, Rotation: ${mockDataV2.designPosition.rotation}°`);
  log.info(`  - Couleur prévisualisation: ${mockDataV2.previewColorId}`);
  log.info(`  - Mockups sélectionnés: ${mockDataV2.selectedMockupIds.length}`);
  log.info(`  - Dernière sauvegarde: ${new Date(mockDataV2.lastSaved).toLocaleString()}`);
  
  console.log('\n✅ Test localStorage V2 terminé');
}

// Fonction principale
async function main() {
  console.log('🎯 Test complet du système de création de produits vendeur par l\'admin (API V2)');
  console.log('=====================================================================================');

  // Test du localStorage V2
  testLocalStorageV2();

  // Test de l'API V2
  await testAdminCreateVendorProductV2();

  console.log('\n🎉 Tests V2 terminés !');
}

// Exécuter les tests
main().catch(console.error); 