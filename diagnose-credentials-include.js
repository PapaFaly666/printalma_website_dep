// 🔍 DIAGNOSTIC PRINTALMA ARCHITECTURE V2 - CREDENTIALS INCLUDE
// Copiez et collez ce script dans la console de votre navigateur

const diagnosePrintAlmaV2CredentialsInclude = async () => {
  console.log('🔍 === DIAGNOSTIC PRINTALMA ARCHITECTURE V2 (CREDENTIALS INCLUDE) ===');
  console.log('=' .repeat(70));
  
  const API_BASE = 'http://localhost:3001/api';
  
  // Configuration des endpoints à tester
  const endpoints = [
    { 
      name: 'Produits Admin', 
      url: `${API_BASE}/products`,
      description: '⚠️ Ne devrait PAS être utilisé pour l\'affichage frontend'
    },
    { 
      name: 'Produits Vendeur V2', 
      url: `${API_BASE}/vendor/products`,
      description: '✅ Endpoint correct pour Architecture V2'
    },
    { 
      name: 'Health Check Vendeur', 
      url: `${API_BASE}/vendor/health`,
      description: '🏥 Vérification santé du service vendeur'
    },
    { 
      name: 'User Profile', 
      url: `${API_BASE}/auth/profile`,
      description: '👤 Profil utilisateur connecté'
    }
  ];

  const results = [];

  console.log('\n🚀 Test des endpoints avec credentials: "include"...\n');

  // Test de chaque endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`🧪 Test: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Description: ${endpoint.description}`);
      
      const startTime = Date.now();
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        credentials: 'include',  // ✅ Configuration credentials include
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;
      const data = await response.json();
      
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
        duration: `${duration}ms`,
        data: data,
        analysis: analyzeResponse(data, endpoint.name)
      };
      
      results.push(result);
      
      if (response.ok) {
        console.log(`   ✅ Succès (${response.status}) - ${duration}ms`);
        console.log(`   📊 Analyse: ${result.analysis.message}`);
      } else {
        console.log(`   ❌ Échec (${response.status}) - ${duration}ms`);
        console.log(`   🚨 Erreur: ${data.message || 'Erreur inconnue'}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'ERROR',
        ok: false,
        error: error.message,
        analysis: { type: 'error', message: error.message }
      });
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }

  // Affichage du résumé
  console.log('\n' + '=' .repeat(70));
  console.log('📋 RÉSUMÉ DU DIAGNOSTIC');
  console.log('=' .repeat(70));
  
  const successCount = results.filter(r => r.ok).length;
  console.log(`\n🎯 Endpoints testés: ${results.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Échecs: ${results.length - successCount}`);
  
  // Analyse spécifique par type
  const v2Endpoint = results.find(r => r.analysis?.type === 'v2_vendor');
  const adminEndpoint = results.find(r => r.analysis?.type === 'admin_products');
  
  console.log('\n🔍 ANALYSE DÉTAILLÉE:');
  
  if (v2Endpoint) {
    if (v2Endpoint.ok) {
      console.log('✅ ARCHITECTURE V2 DÉTECTÉE !');
      console.log(`   📦 Produits vendeur: ${v2Endpoint.analysis.products || 0}`);
      console.log(`   🖼️ Images disponibles: ${v2Endpoint.analysis.hasImages ? 'Oui' : 'Non'}`);
      console.log(`   📍 URL: ${v2Endpoint.url}`);
      
      if (v2Endpoint.analysis.products > 0) {
        console.log('\n   🎉 SOLUTION TROUVÉE: Utilisez cet endpoint dans votre frontend !');
        console.log('   💡 Configuration requise:');
        console.log('      fetch("/api/vendor/products", { credentials: "include" })');
      } else {
        console.log('\n   ⚠️ ATTENTION: Endpoint V2 accessible mais aucun produit trouvé');
        console.log('   💡 Actions à entreprendre:');
        console.log('      1. Créer des produits vendeur');
        console.log('      2. Vérifier les données en base');
      }
    } else {
      console.log('❌ ÉCHEC ARCHITECTURE V2');
      console.log(`   🚨 Erreur: ${v2Endpoint.error || 'Endpoint inaccessible'}`);
      console.log('   💡 Vérifiez:');
      console.log('      1. Que vous êtes connecté');
      console.log('      2. La configuration du backend');
      console.log('      3. Les permissions utilisateur');
    }
  } else {
    console.log('❌ ARCHITECTURE V2 NON DÉTECTÉE');
    console.log('   🚨 L\'endpoint /api/vendor/products ne retourne pas l\'architecture V2');
  }
  
  if (adminEndpoint) {
    if (adminEndpoint.ok) {
      console.log('\n⚠️ PRODUITS ADMIN DÉTECTÉS');
      console.log(`   📦 Produits admin: ${adminEndpoint.analysis.products || 0}`);
      console.log('   🚨 PROBLÈME: Ces données ne sont PAS adaptées pour le frontend');
      console.log('   💡 Solution: Utilisez /api/vendor/products à la place');
    }
  }
  
  // Recommandations finales
  console.log('\n' + '=' .repeat(70));
  console.log('🎯 RECOMMANDATIONS FINALES');
  console.log('=' .repeat(70));
  
  if (v2Endpoint && v2Endpoint.ok && v2Endpoint.analysis.products > 0) {
    console.log('\n✅ CONFIGURATION CORRECTE DÉTECTÉE');
    console.log('   🔧 Configuration frontend recommandée:');
    console.log(`
   // Dans votre service/hook React
   const fetchVendorProducts = async () => {
     const response = await fetch('/api/vendor/products', {
       method: 'GET',
       credentials: 'include',
       headers: {
         'Content-Type': 'application/json'
       }
     });
     
     const result = await response.json();
     
     if (result.architecture === 'v2_preserved_admin') {
       return result.data.products; // ✅ Produits Architecture V2
     } else {
       throw new Error('Architecture V2 non détectée');
     }
   };`);
   
  } else if (adminEndpoint && adminEndpoint.ok) {
    console.log('\n⚠️ CONFIGURATION INCORRECTE DÉTECTÉE');
    console.log('   🚨 Votre frontend utilise probablement le mauvais endpoint');
    console.log('   🔧 Changements requis:');
    console.log('      ❌ Arrêtez d\'utiliser: /api/products');
    console.log('      ✅ Utilisez à la place: /api/vendor/products');
    
  } else {
    console.log('\n❌ PROBLÈME DE CONFIGURATION');
    console.log('   🚨 Aucun endpoint fonctionnel détecté');
    console.log('   🔧 Actions requises:');
    console.log('      1. Vérifiez que le serveur backend fonctionne');
    console.log('      2. Connectez-vous avec un compte vendeur valide');
    console.log('      3. Vérifiez la configuration des cookies/sessions');
  }
  
  console.log('\n📊 Données complètes disponibles dans: window.printalmaDiagnostic');
  
  // Stocker les résultats pour inspection
  (window as any).printalmaDiagnostic = {
    results,
    timestamp: new Date().toISOString(),
    config: 'credentials_include'
  };
  
  return results;
};

// Fonction d'analyse de réponse
const analyzeResponse = (data: any, endpointName: string) => {
  if (!data) return { type: 'empty', message: 'Réponse vide' };
  
  // Architecture V2 Vendeur
  if (data.architecture === 'v2_preserved_admin') {
    return {
      type: 'v2_vendor',
      message: '✅ Architecture V2 Vendeur détectée',
      products: data.data?.products?.length || 0,
      hasImages: data.data?.products?.some((p: any) => 
        p.images?.primaryImageUrl || 
        p.adminProduct?.colorVariations?.some((cv: any) => 
          cv.images?.length > 0
        )
      ) || false
    };
  }
  
  // Produits Admin  
  if (data.products && Array.isArray(data.products)) {
    const firstProduct = data.products[0];
    if (firstProduct && (firstProduct.workflow || firstProduct.pendingAutoPublish !== undefined)) {
      return {
        type: 'admin_products',
        message: '⚠️ Produits Admin détectés (non adaptés frontend)',
        products: data.products.length,
        hasWorkflow: !!firstProduct.workflow
      };
    }
    return {
      type: 'unknown_products',
      message: '❓ Produits de type inconnu',
      products: data.products.length
    };
  }
  
  // User profile
  if (data.user || data.id) {
    return {
      type: 'user_profile',
      message: '👤 Profil utilisateur détecté',
      userId: data.id || data.user?.id
    };
  }
  
  // Health check
  if (data.status || data.health) {
    return {
      type: 'health',
      message: `🏥 Health check: ${data.status || data.health}`,
      status: data.status || data.health
    };
  }
  
  return { type: 'unknown', message: '❓ Type de données inconnu' };
};

// 🚀 Exécution automatique
console.log('🎯 Lancement du diagnostic...');
diagnosePrintAlmaV2CredentialsInclude(); 