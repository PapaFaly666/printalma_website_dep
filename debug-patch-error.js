// 🔧 Test du problème PATCH 500 Internal Server Error

const BACKEND_URL = 'https://printalma-back-dep.onrender.com';

console.log('🔍 DIAGNOSTIC ERREUR PATCH 500');
console.log('===============================');

// Test avec différents payloads PATCH
async function testPatchEndpoint() {
  console.log('\n🧪 TEST PATCH ENDPOINT:');
  
  // D'abord récupérer un produit existant
  try {
    console.log('   1. Récupération du produit ID 20...');
    const getResponse = await fetch(`${BACKEND_URL}/products/20`, {
      credentials: 'include'
    });
    
    if (!getResponse.ok) {
      console.log(`   ❌ Impossible de récupérer le produit: ${getResponse.status}`);
      return;
    }
    
    const productData = await getResponse.json();
    const product = productData.data || productData;
    
    console.log('   ✅ Produit récupéré:', {
      id: product.id,
      name: product.name,
      suggestedPrice: product.suggestedPrice,
      genre: product.genre,
      status: product.status
    });
    
    // Test 1: Payload minimal 
    console.log('\n   2. Test PATCH avec payload minimal...');
    const minimalPayload = {
      suggestedPrice: 15000
    };
    
    const patchResponse1 = await fetch(`${BACKEND_URL}/products/20`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log(`   📥 PATCH minimal response: ${patchResponse1.status} ${patchResponse1.statusText}`);
    
    if (!patchResponse1.ok) {
      const errorText = await patchResponse1.text();
      console.log('   ❌ Erreur PATCH minimal:', errorText);
      
      // Test 2: Payload avec plus de données
      console.log('\n   3. Test PATCH avec payload complet...');
      const fullPayload = {
        name: product.name,
        description: product.description,
        price: product.price,
        suggestedPrice: 15000,
        stock: product.stock,
        status: product.status,
        genre: product.genre
      };
      
      const patchResponse2 = await fetch(`${BACKEND_URL}/products/20`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullPayload)
      });
      
      console.log(`   📥 PATCH complet response: ${patchResponse2.status} ${patchResponse2.statusText}`);
      
      if (!patchResponse2.ok) {
        const errorText2 = await patchResponse2.text();
        console.log('   ❌ Erreur PATCH complet:', errorText2);
        
        // Test 3: PUT au lieu de PATCH
        console.log('\n   4. Test PUT au lieu de PATCH...');
        const putResponse = await fetch(`${BACKEND_URL}/products/20`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fullPayload)
        });
        
        console.log(`   📥 PUT response: ${putResponse.status} ${putResponse.statusText}`);
        
        if (!putResponse.ok) {
          const errorText3 = await putResponse.text();
          console.log('   ❌ Erreur PUT:', errorText3);
        } else {
          const putResult = await putResponse.json();
          console.log('   ✅ PUT réussi:', putResult);
        }
        
      } else {
        const result2 = await patchResponse2.json();
        console.log('   ✅ PATCH complet réussi:', result2);
      }
      
    } else {
      const result1 = await patchResponse1.json();
      console.log('   ✅ PATCH minimal réussi:', result1);
    }
    
    // Vérification finale
    console.log('\n   5. Vérification après PATCH...');
    const verifyResponse = await fetch(`${BACKEND_URL}/products/20`, {
      credentials: 'include'
    });
    
    if (verifyResponse.ok) {
      const updatedProductData = await verifyResponse.json();
      const updatedProduct = updatedProductData.data || updatedProductData;
      
      console.log('   📊 Produit après modification:', {
        id: updatedProduct.id,
        name: updatedProduct.name,
        suggestedPrice: updatedProduct.suggestedPrice,
        genre: updatedProduct.genre,
        status: updatedProduct.status
      });
      
      if (updatedProduct.suggestedPrice === null || updatedProduct.suggestedPrice === undefined) {
        console.log('   ⚠️  suggestedPrice toujours NULL après PATCH');
      } else {
        console.log('   ✅ suggestedPrice correctement mis à jour !');
      }
    }
    
  } catch (error) {
    console.log('   💥 Erreur générale:', error.message);
  }
}

// Test de crétion avec suggestedPrice
async function testCreateWithSuggestedPrice() {
  console.log('\n🧪 TEST CRÉATION AVEC SUGGESTEDPRICE:');
  
  try {
    const testProduct = {
      name: "TEST SUGGESTEDPRICE " + Date.now(),
      description: "Test pour vérifier suggestedPrice",
      price: 10000,
      suggestedPrice: 12000, // ← Point critique
      stock: 5,
      status: "draft",
      categories: ["Test"],
      sizes: ["M", "L"],
      genre: "UNISEXE",
      isReadyProduct: false,
      colorVariations: [{
        name: "Test Color",
        colorCode: "#FF0000",
        images: [{
          fileId: "test_suggested_price",
          view: "Front",
          delimitations: []
        }]
      }]
    };
    
    console.log('   📤 Données avec suggestedPrice:', testProduct.suggestedPrice);
    
    const formData = new FormData();
    formData.append('productData', JSON.stringify(testProduct));
    
    // Fichier fake
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    const fakeFile = new File([testFile], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file_test_suggested_price', fakeFile);
    
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    console.log(`   📥 POST response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      const productId = result.id || result.data?.id;
      
      console.log('   ✅ Produit créé avec ID:', productId);
      console.log('   📊 suggestedPrice dans réponse:', result.suggestedPrice || result.data?.suggestedPrice);
      
      // Vérification immédiate
      const verifyResponse = await fetch(`${BACKEND_URL}/products/${productId}`, {
        credentials: 'include'
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const verifyProduct = verifyData.data || verifyData;
        
        console.log('   🔍 Vérification en base:');
        console.log(`     - suggestedPrice: ${verifyProduct.suggestedPrice}`);
        console.log(`     - price: ${verifyProduct.price}`);
        console.log(`     - genre: ${verifyProduct.genre}`);
        
        if (verifyProduct.suggestedPrice === null) {
          console.log('   ❌ PROBLÈME: suggestedPrice est NULL en base !');
          console.log('   💡 Cause possible: Backend ne traite pas suggestedPrice lors de la création');
        } else {
          console.log('   ✅ suggestedPrice correctement sauvegardé !');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erreur création:', errorText);
    }
    
  } catch (error) {
    console.log('   💥 Erreur:', error.message);
  }
}

// Diagnostic des logs backend
function suggestBackendFixes() {
  console.log('\n💡 SUGGESTIONS POUR CORRIGER LE BACKEND:');
  console.log('=========================================');
  
  console.log('   🔧 1. Vérifications DTO Backend:');
  console.log('     - UpdateProductDto accepte-t-il suggestedPrice ?');
  console.log('     - CreateProductDto inclut-il suggestedPrice ?');
  console.log('');
  
  console.log('   🔧 2. Vérifications Entity Backend:');
  console.log('     - @Column() suggestedPrice dans Product entity ?');
  console.log('     - Type correct (number, nullable) ?');
  console.log('');
  
  console.log('   🔧 3. Vérifications Service Backend:');
  console.log('     - product.suggestedPrice = dto.suggestedPrice dans create() ?');
  console.log('     - Même chose dans update() ?');
  console.log('');
  
  console.log('   🔧 4. Code backend à vérifier:');
  console.log('');
  console.log('     // CreateProductDto');
  console.log('     @IsOptional()');
  console.log('     @IsNumber()');
  console.log('     suggestedPrice?: number;');
  console.log('');
  console.log('     // Product Entity');
  console.log('     @Column({ type: "int", nullable: true })');
  console.log('     suggestedPrice?: number;');
  console.log('');
  console.log('     // ProductService.create()');
  console.log('     product.suggestedPrice = productData.suggestedPrice;');
  console.log('');
  
  console.log('   🔧 5. Migrations à vérifier:');
  console.log('     - ALTER TABLE products ADD COLUMN suggestedPrice INT NULL;');
  console.log('     - Migration exécutée sur la base de production ?');
}

// Exécution complète
async function runFullDiagnostic() {
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  
  await testPatchEndpoint();
  await testCreateWithSuggestedPrice();
  suggestBackendFixes();
  
  console.log('\n🎯 RÉSUMÉ:');
  console.log('==========');
  console.log('   📋 Problèmes identifiés:');
  console.log('     1. PATCH /products/:id retourne 500 Internal Server Error');
  console.log('     2. suggestedPrice toujours NULL en base même après création');
  console.log('     3. Frontend envoie correctement les données');
  console.log('');
  console.log('   ➡️  Action requise: Corriger le backend NestJS');
  console.log('   ➡️  Focus: DTO, Entity, Service pour suggestedPrice');
}

runFullDiagnostic().catch(console.error);