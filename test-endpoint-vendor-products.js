// Test rapide de l'endpoint /vendor/products avec fetch natif Node.js
const testEndpoint = async () => {
  console.log('🧪 === TEST ENDPOINT /vendor/products ===');
  
  const backendUrl = 'http://localhost:3004';
  const testUrl = `${backendUrl}/vendor/products`;
  
  console.log('🔗 URL testée:', testUrl);
  
  try {
    console.log('📡 Test de connectivité...');
    
    // Test simple GET pour vérifier si l'endpoint existe
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    
    if (response.status === 404) {
      console.log('❌ PROBLÈME: Endpoint /vendor/products n\'existe pas sur le backend');
      console.log('🔧 SOLUTION: Le backend doit implémenter cette route');
      console.log('');
      console.log('📋 Routes possibles à vérifier sur le backend:');
      console.log('   - /vendor/products (attendu)');
      console.log('   - /api/vendor/products (avec préfixe /api)');
      console.log('   - /vendors/products (pluriel)');
      console.log('   - /vendor-products (avec tiret)');
    } else if (response.status === 401) {
      console.log('✅ SUCCÈS: Endpoint trouvé (erreur 401 = authentification requise)');
      console.log('🔐 L\'endpoint existe mais nécessite une authentification');
    } else if (response.status === 405) {
      console.log('✅ SUCCÈS: Endpoint trouvé (erreur 405 = méthode non autorisée)');
      console.log('📝 L\'endpoint existe mais n\'accepte pas GET, essayons POST');
    } else {
      console.log('✅ Endpoint accessible avec status:', response.status);
    }
    
    // Si ce n'est pas 404, essayons de voir la réponse
    if (response.status !== 404) {
      try {
        const responseText = await response.text();
        console.log('📄 Réponse:', responseText.substring(0, 200) + '...');
      } catch (e) {
        console.log('📄 Impossible de lire la réponse');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('');
    console.log('🔧 Vérifications:');
    console.log('   - Le backend est-il démarré ?');
    console.log('   - L\'URL http://localhost:3004 est-elle correcte ?');
    console.log('   - CORS est-il configuré ?');
  }
  
  console.log('');
  console.log('🧪 === TEST TERMINÉ ===');
};

// Test avec d'autres endpoints possibles
const testAlternativeEndpoints = async () => {
  console.log('🔍 === TEST ENDPOINTS ALTERNATIFS ===');
  
  const backendUrl = 'http://localhost:3004';
  const alternatives = [
    '/api/vendor/products',
    '/vendors/products', 
    '/vendor-products',
    '/api/vendors/products',
    '/vendor/publish',
    '/vendor-product/publish',
    '/api/vendor-product/publish'
  ];
  
  for (const endpoint of alternatives) {
    try {
      const testUrl = `${backendUrl}${endpoint}`;
      console.log(`📡 Test: ${testUrl}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 404) {
        console.log(`✅ TROUVÉ: ${endpoint} (status: ${response.status})`);
        
        // Si trouvé, essayons POST aussi
        try {
          const postResponse = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          console.log(`   POST: ${postResponse.status} ${postResponse.statusText}`);
        } catch (e) {
          console.log(`   POST: Erreur - ${e.message}`);
        }
      } else {
        console.log(`❌ Non trouvé: ${endpoint}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${endpoint} - ${error.message}`);
    }
  }
  
  console.log('🔍 === FIN TEST ALTERNATIFS ===');
};

// Exécuter les tests
const runAllTests = async () => {
  await testEndpoint();
  console.log('');
  await testAlternativeEndpoints();
};

runAllTests(); 