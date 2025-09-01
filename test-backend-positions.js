/**
 * Test rapide pour vérifier les positions des APIs backend
 */

const BASE_URL = 'http://localhost:3000';

async function testBackendPositions() {
  console.log('🧪 Test des positions backend');
  console.log('=' .repeat(50));

  try {
    // Test 1: API vendor-products
    console.log('\n1️⃣ Test /public/vendor-products');
    const vendorResponse = await fetch(`${BASE_URL}/public/vendor-products?limit=1`);
    
    if (vendorResponse.ok) {
      const vendorData = await vendorResponse.json();
      const product = vendorData.data?.products?.[0];
      
      if (product?.designPositions?.[0]?.position) {
        const pos = product.designPositions[0].position;
        console.log(`✅ Produit ${product.id}:`);
        console.log(`   Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
    } else {
      console.log(`❌ Status: ${vendorResponse.status}`);
    }

    // Test 2: API new-arrivals
    console.log('\n2️⃣ Test /public/new-arrivals');
    const newArrivalsResponse = await fetch(`${BASE_URL}/public/new-arrivals?limit=1`);
    
    if (newArrivalsResponse.ok) {
      const newArrivalsData = await newArrivalsResponse.json();
      const product = newArrivalsData.data?.[0];
      
      if (product?.designPositions?.[0]?.position) {
        const pos = product.designPositions[0].position;
        console.log(`✅ Produit ${product.id}:`);
        console.log(`   Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
    } else {
      console.log(`❌ Status: ${newArrivalsResponse.status}`);
    }

    // Test 3: API best-sellers
    console.log('\n3️⃣ Test /public/best-sellers');
    const bestSellersResponse = await fetch(`${BASE_URL}/public/best-sellers?limit=1`);
    
    if (bestSellersResponse.ok) {
      const bestSellersData = await bestSellersResponse.json();
      const product = bestSellersData.data?.bestSellers?.[0];
      
      if (product?.designPositions?.[0]?.position) {
        const pos = product.designPositions[0].position;
        console.log(`✅ Produit ${product.id}:`);
        console.log(`   Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
    } else {
      console.log(`❌ Status: ${bestSellersResponse.status}`);
    }

    console.log('\n✅ Test terminé - Vérifiez que les positions sont cohérentes');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n🔧 Solutions:');
    console.log('1. Vérifiez que le backend tourne sur le port 3000');
    console.log('2. Exécutez: cd backend && npm run start:dev');
  }
}

// Exécuter depuis Node.js
if (typeof window === 'undefined') {
  // Node.js
  const fetch = require('node-fetch');
  testBackendPositions();
} else {
  // Browser
  window.testBackendPositions = testBackendPositions;
  console.log('Fonction testBackendPositions() disponible dans la console');
}