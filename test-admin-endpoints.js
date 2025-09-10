// 🔧 Test des endpoints admin pour PATCH

const BACKEND_URL = 'https://printalma-back-dep.onrender.com';

console.log('🔍 TEST ENDPOINTS ADMIN POUR PATCH');
console.log('==================================');

async function testAdminEndpoints() {
  const endpoints = [
    { name: 'PATCH Public', url: `${BACKEND_URL}/products/20`, method: 'PATCH' },
    { name: 'PATCH Admin', url: `${BACKEND_URL}/admin/products/20`, method: 'PATCH' },
    { name: 'PUT Admin', url: `${BACKEND_URL}/admin/products/20`, method: 'PUT' },
    { name: 'PATCH Vendor', url: `${BACKEND_URL}/vendor/products/20`, method: 'PATCH' },
    { name: 'PUT Vendor', url: `${BACKEND_URL}/vendor/products/20`, method: 'PUT' }
  ];
  
  const testPayload = {
    suggestedPrice: 25000
  };
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Test ${endpoint.name}: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   📥 Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Succès:', data.message || 'OK');
        return { endpoint: endpoint.name, url: endpoint.url, method: endpoint.method };
      } else if (response.status === 401) {
        console.log('   🔐 Unauthorized - Problème d\'authentification');
      } else if (response.status === 404) {
        console.log('   🚫 Not Found - Endpoint n\'existe pas');
      } else {
        const errorText = await response.text();
        console.log('   ❌ Erreur:', errorText.substring(0, 100));
      }
      
    } catch (error) {
      console.log(`   💥 Erreur réseau: ${error.message}`);
    }
  }
  
  return null;
}

// Test de vérification des cookies d'auth
function checkAuthCookies() {
  console.log('\n🔐 VÉRIFICATION COOKIES D\'AUTHENTIFICATION:');
  
  // Simulation des cookies (dans un vrai navigateur)
  const cookies = document?.cookie || '';
  console.log('   📋 Cookies présents:', cookies ? 'Oui' : 'Non');
  
  if (cookies.includes('token=')) {
    console.log('   ✅ Token JWT trouvé dans les cookies');
  } else {
    console.log('   ❌ Aucun token JWT dans les cookies');
    console.log('   💡 Solution: Vérifiez l\'authentification dans ProductFormMain');
  }
  
  console.log('   🔍 Headers à vérifier:');
  console.log('     - credentials: "include"');
  console.log('     - Content-Type: "application/json"');
}

// Suggestion de solution
function suggestSolution() {
  console.log('\n💡 SOLUTIONS POUR PRODUCTFORMMAIN:');
  console.log('===================================');
  
  console.log('   🔧 1. Utiliser l\'endpoint admin:');
  console.log('     - Remplacer `/products/` par `/admin/products/`');
  console.log('     - Ou `/vendor/products/` selon le rôle');
  console.log('');
  
  console.log('   🔧 2. Vérifier l\'authentification:');
  console.log('     - useAuth() retourne bien un utilisateur connecté');
  console.log('     - Le token JWT est valide');
  console.log('     - Les cookies sont transmis');
  console.log('');
  
  console.log('   🔧 3. Code à modifier dans ProductService:');
  console.log('');
  console.log('     // Au lieu de:');
  console.log('     const response = await safeApiCall(`/products/${productId}`, {');
  console.log('');
  console.log('     // Utiliser:');
  console.log('     const response = await safeApiCall(`/admin/products/${productId}`, {');
  console.log('     // ou');
  console.log('     const response = await safeApiCall(`/vendor/products/${productId}`, {');
  console.log('');
  
  console.log('   🔧 4. Alternative - Tester les endpoints:');
  console.log('     - GET /products/:id → fonctionne');
  console.log('     - POST /products → fonctionne');
  console.log('     - PATCH /admin/products/:id → à tester');
}

async function runTest() {
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  
  const workingEndpoint = await testAdminEndpoints();
  checkAuthCookies();
  suggestSolution();
  
  if (workingEndpoint) {
    console.log('\n🎉 ENDPOINT FONCTIONNEL TROUVÉ:');
    console.log(`   ✅ ${workingEndpoint.name}: ${workingEndpoint.method} ${workingEndpoint.url}`);
    console.log('   ➡️  Modifier ProductService pour utiliser cet endpoint');
  } else {
    console.log('\n❌ AUCUN ENDPOINT PATCH/PUT FONCTIONNEL:');
    console.log('   ➡️  Vérifier l\'authentification ou les permissions backend');
  }
}

runTest().catch(console.error);