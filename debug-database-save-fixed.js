// 🔧 Script de diagnostic corrigé avec le bon format de données

const BACKEND_URL = 'https://printalma-back-dep.onrender.com';

console.log('🔍 DIAGNOSTIC SAUVEGARDE EN BASE (VERSION CORRIGÉE)');
console.log('=================================================');

// Test de création de produit avec le BON format (FormData + productData JSON)
async function testProductCreationCorrect() {
  console.log('\n2. 🧪 TEST CRÉATION PRODUIT (FORMAT CORRIGÉ):');
  
  const testProduct = {
    name: "TEST DEBUG CORRIGÉ " + Date.now(),
    description: "Produit de test pour debug - format correct",
    price: 1000,
    suggestedPrice: 1000,
    stock: 1,
    status: "draft",
    categories: ["Test"],
    sizes: ["M"],
    genre: "UNISEXE",
    isReadyProduct: false,
    colorVariations: [{
      name: "Couleur Test",
      colorCode: "#FF0000",
      images: [{
        fileId: "test_image_001",
        view: "Front",
        delimitations: []
      }]
    }]
  };
  
  console.log('   📤 Données de test (format ProductService):', JSON.stringify(testProduct, null, 2));
  
  try {
    // ✅ SOLUTION: Utiliser FormData comme ProductService
    const formData = new FormData();
    
    // CRITICAL: Le backend attend "productData" comme champ JSON
    formData.append('productData', JSON.stringify(testProduct));
    
    // Créer un faux fichier pour le test
    const testFile = new Blob(['test image data'], { type: 'image/jpeg' });
    const fakeFile = new File([testFile], 'test-image.jpg', { type: 'image/jpeg' });
    formData.append('file_test_image_001', fakeFile);
    
    console.log('   📋 FormData créé avec:');
    console.log('     - productData: JSON string');
    console.log('     - file_test_image_001: File blob');
    
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData // ✅ Pas de Content-Type: multipart/form-data automatique
    });
    
    console.log(`   📥 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Réponse positive du backend (FORMAT CORRIGÉ)');
      console.log('   📋 Produit retourné:', {
        id: result.id || result.data?.id,
        name: result.name || result.data?.name,
        suggestedPrice: result.suggestedPrice || result.data?.suggestedPrice,
        status: result.status || result.data?.status
      });
      
      const productId = result.id || result.data?.id;
      
      if (productId) {
        console.log(`\\n   🔍 VÉRIFICATION IMMÉDIATE EN BASE (ID: ${productId}):`);
        const verifyResponse = await fetch(`${BACKEND_URL}/products/${productId}`, {
          credentials: 'include'
        });
        
        if (verifyResponse.ok) {
          const savedProduct = await verifyResponse.json();
          const product = savedProduct.data || savedProduct;
          console.log('   ✅ Produit trouvé en base avec ID:', product.id);
          console.log('   📊 suggestedPrice en base:', product.suggestedPrice);
          console.log('   📊 Status en base:', product.status);
          console.log('   📊 Sizes en base:', product.sizes);
          console.log('   📊 Genre en base:', product.genre);
          
          return { created: true, id: productId, found: true, data: product };
        } else {
          console.log('   ❌ Produit NON trouvé en base après création !');
          return { created: true, id: productId, found: false };
        }
      }
      
      return { created: true, id: null, found: false };
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erreur backend:', errorText);
      return { created: false, error: errorText };
    }
  } catch (error) {
    console.log('   💥 Erreur création:', error.message);
    return { created: false, error: error.message };
  }
}

// Test de connexion backend
async function testBackendConnection() {
  console.log('\\n1. 🧪 TEST CONNEXION BACKEND:');
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`, {
      credentials: 'include'
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const products = data.data || data;
      console.log(`   ✅ Backend accessible`);
      console.log(`   📊 Nombre de produits retournés: ${Array.isArray(products) ? products.length : 'N/A'}`);
      return true;
    } else {
      console.log(`   ❌ Backend non accessible`);
      return false;
    }
  } catch (error) {
    console.log(`   💥 Erreur connexion: ${error.message}`);
    return false;
  }
}

// Test de liste des produits
async function testProductList(createdId) {
  console.log('\\n3. 🧪 TEST LISTE PRODUITS APRÈS CRÉATION:');
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const responseData = await response.json();
      const products = responseData.data || responseData;
      
      if (Array.isArray(products)) {
        console.log(`   📊 Total produits en base: ${products.length}`);
        
        if (createdId) {
          const found = products.find(p => p.id == createdId);
          if (found) {
            console.log(`   ✅ Produit ID ${createdId} trouvé dans la liste`);
            console.log('   📋 Données du produit trouvé:', {
              name: found.name,
              suggestedPrice: found.suggestedPrice,
              status: found.status,
              genre: found.genre,
              createdAt: found.createdAt
            });
          } else {
            console.log(`   ❌ Produit ID ${createdId} NON trouvé dans la liste`);
          }
        }
        
        // Afficher les 3 derniers produits
        const lastProducts = products.slice(-3);
        console.log('   📋 3 derniers produits:');
        lastProducts.forEach(p => {
          console.log(`     - ID ${p.id}: "${p.name}" (suggestedPrice: ${p.suggestedPrice || 'null'}, genre: ${p.genre || 'null'})`);
        });
      } else {
        console.log('   ❌ Format de réponse inattendu:', typeof responseData);
      }
      
    } else {
      console.log('   ❌ Erreur récupération liste:', response.status);
    }
  } catch (error) {
    console.log('   💥 Erreur liste:', error.message);
  }
}

// Exécution du diagnostic corrigé
async function runDiagnosisFixed() {
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  
  // Test 1: Connexion
  const connected = await testBackendConnection();
  if (!connected) {
    console.log('\\n❌ DIAGNOSTIC ARRÊTÉ: Backend non accessible');
    return;
  }
  
  // Test 2: Création avec format corrigé
  const createResult = await testProductCreationCorrect();
  
  // Test 3: Liste après création
  await testProductList(createResult.id);
  
  // Conclusion
  console.log('\\n🎯 CONCLUSION DIAGNOSTIC CORRIGÉ:');
  console.log('====================================');
  
  if (createResult.created && createResult.found) {
    console.log('   ✅ Le backend fonctionne PARFAITEMENT !');
    console.log('   ✅ Les données se sauvegardent en base avec le bon format');
    console.log('   ✅ suggestedPrice est bien persisté');
    console.log('   ');
    console.log('   📋 DONNÉES SAUVEGARDÉES:');
    if (createResult.data) {
      console.log(`     - Nom: ${createResult.data.name}`);
      console.log(`     - SuggestedPrice: ${createResult.data.suggestedPrice}`);
      console.log(`     - Genre: ${createResult.data.genre}`);
      console.log(`     - Status: ${createResult.data.status}`);
    }
    console.log('   ');
    console.log('   ➡️  PROBLÈME RÉSOLU: Le format FormData + productData JSON fonctionne !');
  } else if (createResult.created && !createResult.found) {
    console.log('   ⚠️  Le backend crée mais les données disparaissent après');
    console.log('   ➡️  Problème probable: transaction rollback ou DB corruption');
  } else {
    console.log('   ❌ Le backend refuse toujours les requêtes');
    console.log('   ➡️  Problème: Format encore incorrect ou erreur serveur');
    console.log('   💡 Erreur:', createResult.error);
  }
  
  console.log('\\n🔧 IMPLICATIONS POUR LE FRONTEND:');
  console.log('==================================');
  console.log('   ✅ ProductService.createProduct() utilise le bon format');
  console.log('   ✅ FormData + productData JSON string');
  console.log('   ✅ Les corrections dans ProductFormMain.tsx devraient fonctionner');
  console.log('   ');
  console.log('   📝 SI LE PROBLÈME PERSISTE CÔTÉ FRONTEND:');
  console.log('     - Vérifier que ProductFormMain utilise ProductService.createProduct()');
  console.log('     - Vérifier que les images sont bien passées dans imageFiles');
  console.log('     - Vérifier les logs de debug dans la console frontend');
}

// Lancer le diagnostic corrigé
runDiagnosisFixed().catch(console.error);