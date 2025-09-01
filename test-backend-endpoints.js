// Test des endpoints backend pour le système de validation vendeur
// À exécuter avec Node.js ou dans Postman

const API_BASE = 'http://localhost:3004/api';

// Headers pour les requêtes authentifiées
const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'Cookie': 'connect.sid=your-session-id' // Si utilisation de sessions
});

// Tests à effectuer dans l'ordre

const tests = {
  
  // 1. Créer un produit de test
  createProduct: {
    method: 'POST',
    url: `${API_BASE}/vendor/products`,
    headers: getHeaders('vendor-token'),
    body: {
      name: 'Produit Test Validation',
      description: 'Produit pour tester le système de validation',
      price: 25.99,
      stock: 50,
      postValidationAction: 'AUTO_PUBLISH'
    }
  },

  // 2. Soumettre pour validation
  submitForValidation: {
    method: 'POST',
    url: `${API_BASE}/vendor-product-validation/submit/1`, // Remplacer 1 par l'ID du produit
    headers: getHeaders('vendor-token'),
    body: {
      postValidationAction: 'AUTO_PUBLISH'
    }
  },

  // 3. Modifier le choix d'action (tant qu'en attente)
  updateAction: {
    method: 'PUT',
    url: `${API_BASE}/vendor-product-validation/post-validation-action/1`,
    headers: getHeaders('vendor-token'),
    body: {
      action: 'TO_DRAFT'
    }
  },

  // 4. Lister les produits en attente (admin)
  listPending: {
    method: 'GET',
    url: `${API_BASE}/vendor-product-validation/pending`,
    headers: getHeaders('admin-token')
  },

  // 5. Valider le produit (admin)
  validateProduct: {
    method: 'POST',
    url: `${API_BASE}/vendor-product-validation/validate/1`,
    headers: getHeaders('admin-token'),
    body: {
      approved: true
    }
  },

  // 6. Publier manuellement (si TO_DRAFT)
  publishProduct: {
    method: 'POST',
    url: `${API_BASE}/vendor-product-validation/publish/1`,
    headers: getHeaders('vendor-token')
  },

  // 7. Lister les produits vendeur
  listVendorProducts: {
    method: 'GET',
    url: `${API_BASE}/vendor/products`,
    headers: getHeaders('vendor-token')
  }
};

// Fonction pour exécuter un test
async function runTest(testName, testConfig) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log(`📡 ${testConfig.method} ${testConfig.url}`);
  
  if (testConfig.body) {
    console.log(`📦 Body:`, JSON.stringify(testConfig.body, null, 2));
  }

  try {
    const response = await fetch(testConfig.url, {
      method: testConfig.method,
      headers: testConfig.headers,
      body: testConfig.body ? JSON.stringify(testConfig.body) : undefined
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Succès (${response.status}):`, data);
    } else {
      console.log(`❌ Erreur (${response.status}):`, data);
    }
  } catch (error) {
    console.log(`💥 Erreur réseau:`, error.message);
  }
}

// Script pour tester manuellement
console.log('🎯 Tests du système de validation vendeur');
console.log('=====================================');

console.log('\n📋 Scénario 1: AUTO_PUBLISH');
console.log('1. Créer produit avec AUTO_PUBLISH');
console.log('2. Soumettre pour validation');
console.log('3. Admin valide → Doit devenir PUBLISHED');

console.log('\n📋 Scénario 2: TO_DRAFT');
console.log('1. Créer produit avec TO_DRAFT');
console.log('2. Soumettre pour validation');
console.log('3. Admin valide → Doit rester DRAFT avec isValidated=true');
console.log('4. Vendeur publie manuellement → Devient PUBLISHED');

console.log('\n📋 Scénario 3: Rejet');
console.log('1. Créer produit');
console.log('2. Soumettre pour validation');
console.log('3. Admin rejette → Retour DRAFT avec rejectionReason');

console.log('\n🔧 Pour tester avec curl:');
console.log(`
# 1. Créer un produit
curl -X POST ${API_BASE}/vendor/products \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \\
  -d '{
    "name": "Test Produit",
    "description": "Test validation",
    "price": 25.99,
    "postValidationAction": "AUTO_PUBLISH"
  }'

# 2. Soumettre pour validation
curl -X POST ${API_BASE}/vendor-product-validation/submit/PRODUCT_ID \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \\
  -d '{"postValidationAction": "AUTO_PUBLISH"}'

# 3. Valider (admin)
curl -X POST ${API_BASE}/vendor-product-validation/validate/PRODUCT_ID \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -d '{"approved": true}'
`);

console.log('\n✅ États attendus après validation:');
console.log('- AUTO_PUBLISH + validé → status: PUBLISHED, isValidated: true');
console.log('- TO_DRAFT + validé → status: DRAFT, isValidated: true');
console.log('- Rejeté → status: DRAFT, isValidated: false, rejectionReason: "..."');

// Export pour utilisation en module
if (typeof module !== 'undefined') {
  module.exports = { tests, runTest };
} 
 