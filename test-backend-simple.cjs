// 🎯 Test simple du backend PrintAlma
// Utilisable sur Node.js 18+ (fetch natif)

const API_URL = 'http://localhost:3004/auth/login';
const TEST_EMAIL = 'test.vendeur@printalma.com';
const WRONG_PASSWORD = 'mauvais123';

// Couleurs console
const red = '\x1b[31m', green = '\x1b[32m', yellow = '\x1b[33m', blue = '\x1b[34m', reset = '\x1b[0m';

async function testBackend() {
  console.log(`${blue}🎯 Test Backend PrintAlma${reset}`);
  console.log(`${blue}📍 URL: ${API_URL}${reset}`);
  console.log(`${blue}📧 Email: ${TEST_EMAIL}${reset}`);
  console.log(`${blue}🔑 Mot de passe: ${WRONG_PASSWORD}${reset}\n`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: WRONG_PASSWORD
      })
    });

    console.log(`${yellow}📊 Status Code: ${response.status}${reset}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      if (errorData && errorData.message) {
        console.log(`${green}✅ Message reçu du backend:${reset}`);
        console.log(`   "${errorData.message}"`);
        
        // Test des extractions
        const remaining = extractNumber(errorData.message, /Il vous reste (\d+) tentative/);
        const isLocked = errorData.message.includes('verrouillé') || errorData.message.includes('Temps restant');
        
        if (remaining !== null) {
          console.log(`${green}✅ Tentatives extraites: ${remaining}${reset}`);
        }
        
        if (isLocked) {
          console.log(`${red}🔒 Compte verrouillé détecté${reset}`);
        }
        
        return { success: false, message: errorData.message };
      } else {
        console.log(`${red}❌ Pas de message d'erreur structuré${reset}`);
        console.log(`   Réponse brute:`, errorData);
      }
    } else {
      const data = await response.json();
      console.log(`${green}✅ Connexion réussie!${reset}`);
      console.log(`   Utilisateur: ${data.user?.firstName} ${data.user?.lastName}`);
    }
    
  } catch (error) {
    console.log(`${red}💥 Erreur de réseau: ${error.message}${reset}`);
    console.log(`${red}❌ Le backend semble ne pas répondre sur ${API_URL}${reset}`);
    
    console.log(`\n${yellow}🔧 Vérifications à faire:${reset}`);
    console.log(`1. Le backend PrintAlma tourne-t-il sur le port 3004 ?`);
    console.log(`2. L'utilisateur de test existe-t-il dans la base ?`);
    console.log(`3. La base de données est-elle connectée ?`);
  }
}

function extractNumber(text, regex) {
  const match = text?.match(regex);
  return match ? parseInt(match[1]) : null;
}

// Tests multiples
async function runMultipleTests() {
  console.log(`${blue}🧪 Test de 3 tentatives consécutives...\n${reset}`);
  
  for (let i = 1; i <= 3; i++) {
    console.log(`${blue}--- Tentative ${i} ---${reset}`);
    await testBackend();
    console.log(''); // Ligne vide
    
    // Pause de 1 seconde
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`${green}🎉 Tests terminés !${reset}`);
  console.log(`\n${yellow}💡 Messages attendus:${reset}`);
  console.log(`- "Il vous reste X tentatives"`);
  console.log(`- "Dernière tentative avant verrouillage"`);
  console.log(`- "Compte verrouillé pour X minutes"`);
}

// Lancer les tests
runMultipleTests().catch(console.error);

// Test simple pour comprendre le format attendu par le backend
const axios = require('axios');

const testBackendFormat = async () => {
    console.log('🔄 TEST - Format de données attendu par le backend\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // 1. Test avec FormData et productData comme JSON string (format correct)
        console.log('📡 1. Test avec FormData et productData JSON string...');
        
        const productData = {
            name: 'Test Product',
            description: 'Test Description',
            price: 50,
            stock: 100,
            categoryId: 1
        };
        
        const formData = new FormData();
        formData.append('productData', JSON.stringify(productData));
        
        // Debug - Afficher ce qui est envoyé
        console.log('🔍 Debug - productData:', JSON.stringify(productData));
        console.log('🔍 Debug - FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
        }
        
        try {
            const response1 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    // ⚠️ NE PAS ajouter Content-Type, il sera automatiquement défini
                },
                body: formData
            });
            const result1 = await response1.json();
            console.log('✅ FormData productData Response:', response1.status, result1);
        } catch (error) {
            console.log('❌ FormData productData Error:', error.message);
        }
        
        // 2. Test avec JSON dans productData (format alternatif)
        console.log('\n📡 2. Test avec productData en JSON...');
        
        const jsonPayload = {
            productData: {
                name: 'Test Product',
                description: 'Test Description',
                price: 50,
                stock: 100,
                categoryId: 1
            }
        };
        
        try {
            const response2 = await axios.post(`${API_URL}/products`, jsonPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ JSON productData Response:', response2.status, response2.data);
        } catch (error) {
            if (error.response) {
                console.log('❌ JSON productData Error:', error.response.status, error.response.data);
            } else {
                console.log('❌ JSON productData Error:', error.message);
            }
        }
        
        // 3. Test avec JSON direct (format incorrect pour certains endpoints)
        console.log('\n📡 3. Test avec JSON direct...');
        
        const directPayload = {
            name: 'Test Product',
            description: 'Test Description',
            price: 50,
            stock: 100,
            categoryId: 1
        };
        
        try {
            const response3 = await axios.post(`${API_URL}/products`, directPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ JSON direct Response:', response3.status, response3.data);
        } catch (error) {
            if (error.response) {
                console.log('❌ JSON direct Error:', error.response.status, error.response.data);
            } else {
                console.log('❌ JSON direct Error:', error.message);
            }
        }
        
        // 4. Test de l'endpoint pour voir la structure attendue
        console.log('\n📡 4. Test GET /products pour voir la structure...');
        
        try {
            const getResponse = await axios.get(`${API_URL}/products`);
            const products = getResponse.data;
            
            if (products && products.length > 0) {
                console.log('✅ Structure produit existant:');
                console.log(JSON.stringify(products[0], null, 2));
            } else {
                console.log('📄 Aucun produit existant pour analyser la structure');
            }
        } catch (error) {
            console.log('❌ Erreur GET products:', error.message);
        }
        
        console.log('\n🎯 CONCLUSIONS:');
        console.log('- Testez les différents formats ci-dessus');
        console.log('- Le backend semble attendre "productData" comme champ parent');
        console.log('- Il faut probablement changer de FormData vers JSON');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
};

testBackendFormat().catch(console.error); 