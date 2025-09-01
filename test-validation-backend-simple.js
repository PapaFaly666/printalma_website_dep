// Test simple des endpoints de validation vendeur
// Utilise credentials: 'include' comme le frontend

const axios = require('axios');

const API_BASE = 'http://localhost:3004/api';

// Configuration axios avec credentials (comme le frontend)
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // IMPORTANT : credentials: 'include'
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteurs pour debug
api.interceptors.request.use((config) => {
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
  if (config.data) {
    console.log('📦 Body:', JSON.stringify(config.data, null, 2));
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} - ${response.statusText}`);
    return response;
  },
  (error) => {
    console.log(`❌ ${error.response?.status} - ${error.response?.statusText}`);
    console.log('Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tests étape par étape
async function testValidationSystem() {
  console.log('🎯 Test du système de validation vendeur');
  console.log('==========================================\n');

  try {
    // Étape 1 : Connexion vendeur
    console.log('1️⃣ Connexion vendeur...');
    await api.post('/auth/login', {
      email: 'vendor@test.com', // Remplacer par vos identifiants
      password: 'password'
    });
    console.log('✅ Vendeur connecté\n');

    // Étape 2 : Créer un produit avec choix AUTO_PUBLISH
    console.log('2️⃣ Création produit avec AUTO_PUBLISH...');
    const productResponse = await api.post('/vendor/products', {
      name: 'Test Validation AUTO_PUBLISH',
      description: 'Produit test pour validation automatique',
      price: 2599, // 25.99€ en centimes
      stock: 100,
      postValidationAction: 'AUTO_PUBLISH'
    });
    
    const productId = productResponse.data.product.id;
    console.log(`✅ Produit créé avec ID: ${productId}\n`);

    // Étape 3 : Soumettre pour validation
    console.log('3️⃣ Soumission pour validation...');
    await api.post(`/vendor-product-validation/submit/${productId}`, {
      postValidationAction: 'AUTO_PUBLISH'
    });
    console.log('✅ Produit soumis (status devrait être PENDING)\n');

    // Étape 4 : Modifier le choix vers TO_DRAFT
    console.log('4️⃣ Modification du choix vers TO_DRAFT...');
    await api.put(`/vendor-product-validation/post-validation-action/${productId}`, {
      action: 'TO_DRAFT'
    });
    console.log('✅ Choix modifié vers TO_DRAFT\n');

    // Étape 5 : Connexion admin
    console.log('5️⃣ Connexion admin...');
    await api.post('/auth/login', {
      email: 'admin@test.com', // Remplacer par vos identifiants admin
      password: 'admin_password'
    });
    console.log('✅ Admin connecté\n');

    // Étape 6 : Lister les produits en attente
    console.log('6️⃣ Liste des produits en attente...');
    const pendingResponse = await api.get('/vendor-product-validation/pending');
    const pendingCount = pendingResponse.data.products?.length || 0;
    console.log(`✅ ${pendingCount} produits en attente trouvés\n`);

    // Étape 7 : Valider le produit
    console.log('7️⃣ Validation du produit par admin...');
    const validationResponse = await api.post(`/vendor-product-validation/validate/${productId}`, {
      approved: true
    });
    const newStatus = validationResponse.data.newStatus;
    console.log(`✅ Produit validé ! Nouveau statut: ${newStatus}`);
    console.log('📝 Avec TO_DRAFT, le produit devrait être en DRAFT avec isValidated=true\n');

    // Étape 8 : Reconnexion vendeur
    console.log('8️⃣ Reconnexion vendeur pour publication...');
    await api.post('/auth/login', {
      email: 'vendor@test.com',
      password: 'password'
    });
    console.log('✅ Vendeur reconnecté\n');

    // Étape 9 : Publication manuelle (si TO_DRAFT)
    if (newStatus === 'DRAFT') {
      console.log('9️⃣ Publication manuelle du produit validé...');
      await api.post(`/vendor-product-validation/publish/${productId}`);
      console.log('✅ Produit publié manuellement ! Status devrait être PUBLISHED\n');
    }

    // Étape 10 : Vérifier la liste des produits vendeur
    console.log('🔟 Vérification finale - Liste produits vendeur...');
    const finalResponse = await api.get('/vendor/products');
    const finalProduct = finalResponse.data.products.find(p => p.id === productId);
    
    if (finalProduct) {
      console.log('✅ Produit final trouvé:');
      console.log(`   - Status: ${finalProduct.status}`);
      console.log(`   - isValidated: ${finalProduct.isValidated}`);
      console.log(`   - postValidationAction: ${finalProduct.postValidationAction}`);
      console.log(`   - validatedAt: ${finalProduct.validatedAt}`);
      console.log(`   - publishedAt: ${finalProduct.publishedAt}`);
    }

    console.log('\n🎉 Test complet terminé avec succès !');
    console.log('\n📋 Résumé du workflow testé:');
    console.log('   1. Création produit (DRAFT)');
    console.log('   2. Soumission (DRAFT → PENDING)');
    console.log('   3. Modification choix (TO_DRAFT)');
    console.log('   4. Validation admin (PENDING → DRAFT validé)');
    console.log('   5. Publication manuelle (DRAFT → PUBLISHED)');

  } catch (error) {
    console.error('\n💥 Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('📋 Détails de l\'erreur:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || 'Pas de message'}`);
      
      if (error.response.status === 401) {
        console.error('\n🔐 Erreur d\'authentification:');
        console.error('   - Vérifiez les identifiants de connexion');
        console.error('   - Assurez-vous que les sessions fonctionnent');
        console.error('   - Vérifiez la configuration CORS avec credentials: true');
      }
      
      if (error.response.status === 404) {
        console.error('\n🔍 Endpoint non trouvé:');
        console.error('   - Vérifiez que les routes sont bien configurées');
        console.error('   - Vérifiez l\'URL de base de l\'API');
      }
    }
  }
}

// Test simple d'un seul endpoint
async function testSingleEndpoint() {
  console.log('🧪 Test simple - Health check');
  console.log('===============================\n');

  try {
    // Test de l'endpoint de santé (si implémenté)
    const healthResponse = await api.get('/vendor-product-validation/health');
    console.log('✅ Système de validation opérationnel');
    console.log('📊 Statistiques:', healthResponse.data.stats);
  } catch (error) {
    console.log('❌ Endpoint health non disponible ou erreur:', error.message);
  }
}

// Fonction pour tester la création de produit simple
async function testProductCreation() {
  console.log('🛍️ Test création produit simple');
  console.log('================================\n');

  try {
    // Connexion vendeur
    await api.post('/auth/login', {
      email: 'vendor@test.com',
      password: 'password'
    });

    // Créer un produit
    const response = await api.post('/vendor/products', {
      name: 'Produit Test Simple',
      description: 'Test de création basique',
      price: 1999,
      stock: 50,
      postValidationAction: 'AUTO_PUBLISH' // Nouveau champ
    });

    console.log('✅ Produit créé avec succès');
    console.log('📦 Données du produit:', response.data.product);

  } catch (error) {
    console.error('❌ Erreur création produit:', error.response?.data || error.message);
  }
}

// Menu de sélection
function showMenu() {
  console.log('\n🎯 Tests disponibles:');
  console.log('1. Test complet du workflow de validation');
  console.log('2. Test simple - Health check');
  console.log('3. Test création produit avec nouveaux champs');
  console.log('\nPour lancer un test, utilisez:');
  console.log('node test-validation-backend-simple.js [1|2|3]');
  console.log('\nOu modifiez la fonction à appeler à la fin du fichier.');
}

// Exécution selon l'argument
const testType = process.argv[2];

switch (testType) {
  case '1':
    testValidationSystem();
    break;
  case '2':
    testSingleEndpoint();
    break;
  case '3':
    testProductCreation();
    break;
  default:
    showMenu();
    // Par défaut, lancer le test simple
    console.log('\n🚀 Lancement du test health check...\n');
    testSingleEndpoint();
}

// Export pour utilisation en module
module.exports = {
  testValidationSystem,
  testSingleEndpoint,
  testProductCreation,
  api
}; 
 