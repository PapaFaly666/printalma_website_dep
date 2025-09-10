// 🔍 Script de diagnostic pour identifier pourquoi les données ne s'enregistrent pas en base

const BACKEND_URL = 'https://printalma-back-dep.onrender.com';

console.log('🔍 DIAGNOSTIC SAUVEGARDE EN BASE DE DONNÉES');
console.log('==========================================');

// 1. Test de connexion backend
async function testBackendConnection() {
  console.log('\n1. 🧪 TEST CONNEXION BACKEND:');
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Backend accessible`);
      console.log(`   📊 Nombre de produits retournés: ${Array.isArray(data) ? data.length : 'N/A'}`);
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

// 2. Test de création de produit minimal
async function testProductCreation() {
  console.log('\n2. 🧪 TEST CRÉATION PRODUIT MINIMAL:');
  
  const testProduct = {
    name: "TEST DEBUG " + Date.now(),
    description: "Produit de test pour debug",
    price: 1000,
    suggestedPrice: 1000,
    stock: 1,
    status: "draft",
    categories: ["Test"],
    sizes: ["M"],
    genre: "UNISEXE",
    isReadyProduct: false,
    colorVariations: []
  };
  
  console.log('   📤 Données de test:', JSON.stringify(testProduct, null, 2));
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testProduct)
    });
    
    console.log(`   📥 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Réponse positive du backend');
      console.log('   📋 Produit retourné:', {
        id: result.id,
        name: result.name,
        suggestedPrice: result.suggestedPrice,
        status: result.status
      });
      
      // Test de vérification immédiate
      if (result.id) {
        console.log('\n   🔍 VÉRIFICATION IMMÉDIATE EN BASE:');
        const verifyResponse = await fetch(`${BACKEND_URL}/products/${result.id}`, {
          credentials: 'include'
        });
        
        if (verifyResponse.ok) {
          const savedProduct = await verifyResponse.json();
          console.log('   ✅ Produit trouvé en base avec ID:', savedProduct.id);
          console.log('   📊 suggestedPrice en base:', savedProduct.suggestedPrice);
          console.log('   📊 Status en base:', savedProduct.status);
          console.log('   📊 Sizes en base:', savedProduct.sizes);
          
          return { created: true, id: result.id, found: true };
        } else {
          console.log('   ❌ Produit NON trouvé en base !');
          return { created: true, id: result.id, found: false };
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

// 3. Test de liste des produits pour voir si le nouveau apparaît
async function testProductList(createdId) {
  console.log('\n3. 🧪 TEST LISTE PRODUITS:');
  
  try {
    const response = await fetch(`${BACKEND_URL}/products`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const products = await response.json();
      console.log(`   📊 Total produits en base: ${products.length}`);
      
      if (createdId) {
        const found = products.find(p => p.id == createdId);
        if (found) {
          console.log(`   ✅ Produit ID ${createdId} trouvé dans la liste`);
          console.log('   📋 Données:', {
            name: found.name,
            suggestedPrice: found.suggestedPrice,
            status: found.status,
            createdAt: found.createdAt
          });
        } else {
          console.log(`   ❌ Produit ID ${createdId} NON trouvé dans la liste`);
        }
      }
      
      // Afficher les 5 derniers produits
      const lastProducts = products.slice(-5);
      console.log('   📋 5 derniers produits:');
      lastProducts.forEach(p => {
        console.log(`     - ID ${p.id}: ${p.name} (suggestedPrice: ${p.suggestedPrice})`);
      });
      
    } else {
      console.log('   ❌ Erreur récupération liste');
    }
  } catch (error) {
    console.log('   💥 Erreur liste:', error.message);
  }
}

// 4. Test des logs serveur (simulation)
function analyzeExpectedServerBehavior() {
  console.log('\n4. 🔍 ANALYSE COMPORTEMENT SERVEUR ATTENDU:');
  
  console.log('   📋 Le serveur devrait loguer:');
  console.log('   - "🔄 [ProductService] Création du produit..."');
  console.log('   - "🔍 [DEBUG] Données reçues: {...}"');
  console.log('   - "🧹 Payload nettoyé: {...}"');
  console.log('   - "✅ [ProductService] Produit créé avec succès"');
  console.log('   ');
  console.log('   ❓ QUESTIONS À VÉRIFIER:');
  console.log('   - Voyez-vous ces logs dans le terminal backend ?');
  console.log('   - Y a-t-il des erreurs de base de données dans les logs ?');
  console.log('   - La connexion à la base est-elle active ?');
  console.log('   - Les transactions sont-elles bien commitées ?');
}

// 5. Suggestions de diagnostic backend
function backendDiagnosticSuggestions() {
  console.log('\n5. 💡 SUGGESTIONS DIAGNOSTIC BACKEND:');
  
  console.log('   🔧 Vérifications à faire côté serveur:');
  console.log('   ');
  console.log('   A. Logs backend (dans votre terminal serveur):');
  console.log('      npm run start:dev');
  console.log('      # Cherchez ces logs lors de la création');
  console.log('   ');
  console.log('   B. Vérification base de données:');
  console.log('      - La connexion DB est-elle active ?');
  console.log('      - Les tables existent-elles ?');
  console.log('      - Y a-t-il des contraintes qui bloquent ?');
  console.log('   ');
  console.log('   C. Vérifications NestJS:');
  console.log('      - Les DTOs acceptent-ils suggestedPrice ?');
  console.log('      - Le service sauvegarde-t-il vraiment ?');
  console.log('      - Y a-t-il des middlewares qui bloquent ?');
  console.log('   ');
  console.log('   D. Test direct base de données:');
  console.log('      - Connectez-vous à votre DB');
  console.log('      - SELECT * FROM products ORDER BY id DESC LIMIT 5;');
  console.log('      - Vérifiez si le dernier produit est bien là');
}

// Exécution du diagnostic
async function runDiagnosis() {
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  
  // Test 1: Connexion
  const connected = await testBackendConnection();
  if (!connected) {
    console.log('\n❌ DIAGNOSTIC ARRÊTÉ: Backend non accessible');
    return;
  }
  
  // Test 2: Création
  const createResult = await testProductCreation();
  
  // Test 3: Liste
  await testProductList(createResult.id);
  
  // Test 4: Analyse
  analyzeExpectedServerBehavior();
  
  // Test 5: Suggestions
  backendDiagnosticSuggestions();
  
  // Conclusion
  console.log('\n🎯 CONCLUSION DIAGNOSTIC:');
  if (createResult.created && createResult.found) {
    console.log('   ✅ Le backend fonctionne correctement');
    console.log('   ✅ Les données se sauvegardent en base');
    console.log('   ➡️  Le problème pourrait être ailleurs (cache, etc.)');
  } else if (createResult.created && !createResult.found) {
    console.log('   ⚠️  Le backend répond OK mais les données ne sont pas en base');
    console.log('   ➡️  Problème probable: transaction non commitée ou DB');
  } else {
    console.log('   ❌ Le backend ne traite pas correctement les requêtes');
    console.log('   ➡️  Problème probable: endpoint, DTO, ou erreur serveur');
  }
}

// Lancer le diagnostic
runDiagnosis().catch(console.error);