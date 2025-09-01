#!/usr/bin/env node

/**
 * Test Backend isReadyProduct Fix
 * 
 * Ce script teste si le backend traite correctement isReadyProduct
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3004';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// Créer une image de test si elle n'existe pas
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('📸 Création d\'une image de test...');
    // Créer une image simple en base64
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    fs.writeFileSync(TEST_IMAGE_PATH, Buffer.from(base64Image, 'base64'));
    console.log('✅ Image de test créée');
  }
}

// Test 1: Produit Prêt (isReadyProduct = true)
async function testReadyProduct() {
  console.log('\n🧪 Test 1: Produit Prêt (isReadyProduct = true)');
  
  try {
    const productData = {
      name: "Test Produit Prêt",
      description: "Produit prêt à l'emploi - Test Backend",
      price: 2500,
      stock: 100,
      status: "draft",
      categories: ["T-shirts", "Prêt-à-porter"],
      sizes: ["S", "M", "L", "XL"],
      isReadyProduct: true, // ← CRUCIAL
      colorVariations: [
        {
          name: "Blanc",
          colorCode: "#FFFFFF",
          images: [
            {
              fileId: "test_image_1",
              view: "Front"
            }
          ]
        }
      ]
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter l'image de test
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('test_image_1', imageBlob, 'test-image.jpg');

    console.log('📦 Données envoyées:');
    console.log('   - isReadyProduct:', productData.isReadyProduct);
    console.log('   - Type:', typeof productData.isReadyProduct);

    const response = await fetch(`${BACKEND_URL}/products/ready`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    console.log(`📡 Réponse: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Produit créé avec succès');
    console.log('📋 Réponse du serveur:');
    console.log('   - ID:', result.id);
    console.log('   - isReadyProduct reçu:', result.isReadyProduct);
    console.log('   - Type isReadyProduct:', typeof result.isReadyProduct);

    // Vérification critique
    if (result.isReadyProduct === true) {
      console.log('✅ SUCCÈS: isReadyProduct = true (correct)');
      return true;
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ true (incorrect)');
      console.log('   - Valeur reçue:', result.isReadyProduct);
      console.log('   - Type:', typeof result.isReadyProduct);
      return false;
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Test 2: Produit Mockup (isReadyProduct = false)
async function testMockupProduct() {
  console.log('\n🧪 Test 2: Produit Mockup (isReadyProduct = false)');
  
  try {
    const productData = {
      name: "Test Produit Mockup",
      description: "Produit avec délimitations - Test Backend",
      price: 2500,
      stock: 100,
      status: "draft",
      categories: ["T-shirts", "Mockup"],
      sizes: ["S", "M", "L", "XL"],
      isReadyProduct: false, // ← Par défaut
      colorVariations: [
        {
          name: "Noir",
          colorCode: "#000000",
          images: [
            {
              fileId: "test_image_2",
              view: "Front"
            }
          ]
        }
      ]
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter l'image de test
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('test_image_2', imageBlob, 'test-image.jpg');

    console.log('📦 Données envoyées:');
    console.log('   - isReadyProduct:', productData.isReadyProduct);
    console.log('   - Type:', typeof productData.isReadyProduct);

    const response = await fetch(`${BACKEND_URL}/products/ready`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    console.log(`📡 Réponse: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP ${response.status}: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Produit créé avec succès');
    console.log('📋 Réponse du serveur:');
    console.log('   - ID:', result.id);
    console.log('   - isReadyProduct reçu:', result.isReadyProduct);
    console.log('   - Type isReadyProduct:', typeof result.isReadyProduct);

    // Vérification
    if (result.isReadyProduct === false) {
      console.log('✅ SUCCÈS: isReadyProduct = false (correct)');
      return true;
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ false (incorrect)');
      console.log('   - Valeur reçue:', result.isReadyProduct);
      return false;
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Test 3: Vérification des produits en base
async function testDatabaseState() {
  console.log('\n🧪 Test 3: État de la base de données');
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      console.log(`❌ Erreur HTTP ${response.status}`);
      return false;
    }

    const products = await response.json();
    const readyProducts = products.filter(p => p.isReadyProduct === true);
    const mockupProducts = products.filter(p => p.isReadyProduct === false);

    console.log('📊 État de la base de données:');
    console.log(`   - Total produits: ${products.length}`);
    console.log(`   - Produits prêts (isReadyProduct=true): ${readyProducts.length}`);
    console.log(`   - Produits mockup (isReadyProduct=false): ${mockupProducts.length}`);

    if (readyProducts.length > 0) {
      console.log('✅ Produits prêts trouvés en base');
      console.log('   - Exemple:', readyProducts[0].name, '(isReadyProduct:', readyProducts[0].isReadyProduct, ')');
    } else {
      console.log('❌ Aucun produit prêt trouvé en base');
    }

    return true;

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Test Backend isReadyProduct Fix');
  console.log('=====================================');
  
  // Créer l'image de test
  createTestImage();
  
  // Tests
  const test1Result = await testReadyProduct();
  const test2Result = await testMockupProduct();
  const test3Result = await testDatabaseState();
  
  // Résumé
  console.log('\n📊 Résumé des tests:');
  console.log('   - Test 1 (Produit Prêt):', test1Result ? '✅ SUCCÈS' : '❌ ÉCHEC');
  console.log('   - Test 2 (Produit Mockup):', test2Result ? '✅ SUCCÈS' : '❌ ÉCHEC');
  console.log('   - Test 3 (Base de données):', test3Result ? '✅ SUCCÈS' : '❌ ÉCHEC');
  
  if (test1Result && test2Result && test3Result) {
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('✅ Le backend traite correctement isReadyProduct');
  } else {
    console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Vérifier les corrections backend dans PROMPT_BACKEND_ISREADYPRODUCT_FIX.md');
  }
}

// Exécuter les tests
runTests().catch(console.error); 