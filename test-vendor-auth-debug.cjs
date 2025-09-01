const axios = require('axios');

// Configuration API pour correspondre au frontend
const api = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: true,
  timeout: 10000,
});

async function testVendorAuth() {
  console.log('🔍 Test d\'authentification vendeur et accès produits\n');
  
  try {
    // 1. Tester l'authentification générale
    console.log('1. Test authentification vendeur...');
    const authResponse = await api.get('/vendor/profile');
    console.log('✅ Authentification OK:', {
      id: authResponse.data?.id,
      email: authResponse.data?.email,
      companyName: authResponse.data?.companyName
    });
    
    const vendorId = authResponse.data?.id;
    
    // 2. Lister les produits du vendeur
    console.log('\n2. Récupération des produits du vendeur...');
    const productsResponse = await api.get('/vendor/products');
    console.log('✅ Produits trouvés:', productsResponse.data?.length || 0);
    
    if (productsResponse.data?.length > 0) {
      console.log('📋 Premiers produits disponibles:');
      productsResponse.data.slice(0, 5).forEach(product => {
        console.log(`   - ID: ${product.id}, Nom: "${product.name}"`);
      });
      
      // 3. Tester l'accès aux design-transforms avec un produit valide
      const validProductId = productsResponse.data[0].id;
      const testDesignUrl = 'https://example.com/test-design.png';
      
      console.log(`\n3. Test design-transforms avec produit ID ${validProductId}...`);
      
      try {
        const transformsResponse = await api.get(`/vendor/design-transforms/${validProductId}`, {
          params: { designUrl: testDesignUrl }
        });
        console.log('✅ Lecture transformations OK:', transformsResponse.data);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️ Aucune transformation trouvée (normal pour premier test)');
        } else {
          console.log('❌ Erreur lecture transformations:', error.response?.data);
        }
      }
      
      // 4. Tester la sauvegarde
      console.log('\n4. Test sauvegarde design-transforms...');
      try {
        const savePayload = {
          productId: validProductId,
          designUrl: testDesignUrl,
          transforms: { 0: { x: 10, y: 20, scale: 0.8 } },
          lastModified: Date.now()
        };
        
        const saveResponse = await api.post('/vendor/design-transforms', savePayload);
        console.log('✅ Sauvegarde transformations OK:', saveResponse.data);
      } catch (error) {
        console.log('❌ Erreur sauvegarde transformations:', error.response?.data);
      }
      
    } else {
      console.log('⚠️ Aucun produit trouvé pour ce vendeur');
    }
    
    // 5. Tester l'accès à un produit inexistant/non autorisé
    console.log('\n5. Test accès produit non autorisé (ID 999)...');
    try {
      await api.get('/vendor/design-transforms/999', {
        params: { designUrl: 'https://example.com/test.png' }
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Erreur 403 attendue pour produit non autorisé');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur authentification:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Actions à effectuer:');
      console.log('   1. Vous connecter en tant que vendeur sur le frontend');
      console.log('   2. Relancer ce script');
    }
  }
}

// Exécuter le test
testVendorAuth().catch(console.error); 