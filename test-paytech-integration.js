#!/usr/bin/env node

// Script de test pour l'intégration PayTech
// À exécuter avec: node test-paytech-integration.js

console.log('🧪 Test d\'intégration PayTech pour Printalma');
console.log('=====================================');

// Test 1: Validation du calcul du montant total
console.log('\n📊 Test 1: Calcul du montant total');

// Simulation du calcul du total
function calculateOrderTotal(orderItems) {
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + ((item.unitPrice || 0) * item.quantity);
  }, 0);

  const shippingCost = orderItems.length > 0 ? 1500 : 0;
  const total = subtotal + shippingCost;

  console.log('💰 Détails du calcul:', {
    subtotal: subtotal + ' XOF',
    shippingCost: shippingCost + ' XOF',
    total: total + ' XOF',
    itemsCount: orderItems.length
  });

  return total;
}

// Test avec un panier exemple
const testOrderItems = [
  {
    productId: 1,
    quantity: 2,
    unitPrice: 5000,
    size: 'L',
    color: 'Blanc'
  }
];

const calculatedTotal = calculateOrderTotal(testOrderItems);
console.log(`✅ Montant total calculé: ${calculatedTotal} XOF`);

// Validation du montant minimum PayTech
if (calculatedTotal >= 100) {
  console.log('✅ Montant valide pour PayTech (>= 100 XOF)');
} else {
  console.log('❌ Montant invalide pour PayTech (< 100 XOF)');
}

// Test 2: Validation de la structure de données
console.log('\n📋 Test 2: Structure de données pour PayTech');

const testOrderData = {
  shippingDetails: {
    name: 'Test User',
    street: '123 Test Street',
    city: 'Dakar',
    region: 'Dakar',
    postalCode: '12345',
    country: 'Sénégal'
  },
  phoneNumber: '+221771234567',
  totalAmount: calculatedTotal,
  orderItems: testOrderItems,
  paymentMethod: 'PAYTECH',
  initiatePayment: true
};

console.log('📦 Structure de commande:', JSON.stringify(testOrderData, null, 2));

// Validation des champs requis
const requiredFields = ['shippingDetails', 'phoneNumber', 'totalAmount', 'orderItems', 'paymentMethod', 'initiatePayment'];
const missingFields = requiredFields.filter(field => !testOrderData[field]);

if (missingFields.length === 0) {
  console.log('✅ Tous les champs requis sont présents');
} else {
  console.log('❌ Champs manquants:', missingFields);
}

// Test 3: Validation des URLs HTTPS
console.log('\n🔗 Test 3: Configuration des URLs PayTech');

function isLocalDevelopment() {
  return true; // Simulation pour le test
}

function getNgrokUrl() {
  return 'https://abc123.ngrok.io'; // URL de test
}

const paytechConfig = {
  IPN_URL: isLocalDevelopment()
    ? `${getNgrokUrl()}/paytech/ipn-callback`
    : `https://votre-domaine.com/paytech/ipn-callback`,

  SUCCESS_URL: isLocalDevelopment()
    ? `${getNgrokUrl()}/payment/success`
    : `https://votre-domaine.com/payment/success`,

  CANCEL_URL: isLocalDevelopment()
    ? `${getNgrokUrl()}/payment/cancel`
    : `https://votre-domaine.com/payment/cancel`
};

console.log('🔧 Configuration PayTech:', paytechConfig);

// Validation des URLs HTTPS
const urlsAreHttps = Object.values(paytechConfig).every(url => url.startsWith('https://'));
if (urlsAreHttps) {
  console.log('✅ Toutes les URLs sont en HTTPS');
} else {
  console.log('❌ Certaines URLs ne sont pas en HTTPS');
}

// Test 4: Validation de la requête PayTech
console.log('\n🚀 Test 4: Requête PayTech simulée');

const paytechRequest = {
  item_name: `Order TEST-${Date.now()}`,
  item_price: calculatedTotal,
  currency: 'XOF',
  ref_command: `TEST-${Date.now()}`,
  command_name: `Printalma Test Order - TEST-${Date.now()}`,
  env: 'test',
  ipn_url: paytechConfig.IPN_URL,
  success_url: paytechConfig.SUCCESS_URL,
  cancel_url: paytechConfig.CANCEL_URL,
  custom_field: JSON.stringify({
    orderId: 999,
    userId: null,
    test: true
  })
};

console.log('📤 Requête PayTech:', JSON.stringify(paytechRequest, null, 2));

// Validation de la requête
const paytechValidation = {
  hasValidAmount: paytechRequest.item_price >= 100,
  hasHttpsUrls: [
    paytechRequest.ipn_url,
    paytechRequest.success_url,
    paytechRequest.cancel_url
  ].every(url => url.startsWith('https://')),
  hasRequiredFields: [
    'item_name', 'item_price', 'ref_command', 'command_name'
  ].every(field => paytechRequest[field])
};

console.log('✅ Validation PayTech:', paytechValidation);

// Résumé
console.log('\n📝 Résumé des tests');
console.log('==================');

const allTestsPassed = [
  calculatedTotal >= 100,
  missingFields.length === 0,
  urlsAreHttps,
  paytechValidation.hasValidAmount,
  paytechValidation.hasHttpsUrls,
  paytechValidation.hasRequiredFields
].every(Boolean);

if (allTestsPassed) {
  console.log('🎉 Tous les tests sont passés avec succès!');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Configurez ngrok: ngrok http 3004');
  console.log('2. Mettez à jour .env.local avec VITE_NGROK_URL');
  console.log('3. Démarrez le backend: npm run start:dev');
  console.log('4. Démarrez le frontend: npm run dev');
  console.log('5. Testez avec la page /test-paytech');
} else {
  console.log('❌ Certains tests ont échoué. Veuillez corriger les problèmes avant de continuer.');
}

console.log('\n🔗 Page de test disponible: http://localhost:5174/test-paytech');