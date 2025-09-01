const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // Remplacez par un vrai token admin

// Headers pour les requêtes
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ADMIN_TOKEN}`
};

// Test création mockup pour homme
async function testCreateHommeMockup() {
  console.log('🧪 Test création mockup pour homme...');
  
  const hommeMockup = {
    name: 'T-shirt Homme Classic',
    description: 'T-shirt basique pour homme en coton',
    price: 5000,
    status: 'draft',
    isReadyProduct: false,
    genre: 'HOMME',
    categories: ['T-shirts', 'Homme'],
    sizes: ['S', 'M', 'L', 'XL'],
    colorVariations: [
      {
        name: 'Noir',
        colorCode: '#000000',
        images: [
          {
            url: 'https://example.com/tshirt-homme-noir.jpg',
            view: 'Front'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/mockups`, hommeMockup, { headers });
    console.log('✅ Mockup homme créé avec succès:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erreur création mockup homme:', error.response?.data || error.message);
    return null;
  }
}

// Test création mockup pour femme
async function testCreateFemmeMockup() {
  console.log('🧪 Test création mockup pour femme...');
  
  const femmeMockup = {
    name: 'T-shirt Femme Élégant',
    description: 'T-shirt élégant pour femme',
    price: 6000,
    status: 'published',
    isReadyProduct: false,
    genre: 'FEMME',
    categories: ['T-shirts', 'Femme'],
    sizes: ['XS', 'S', 'M', 'L'],
    colorVariations: [
      {
        name: 'Rose',
        colorCode: '#FF69B4',
        images: [
          {
            url: 'https://example.com/tshirt-femme-rose.jpg',
            view: 'Front'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/mockups`, femmeMockup, { headers });
    console.log('✅ Mockup femme créé avec succès:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erreur création mockup femme:', error.response?.data || error.message);
    return null;
  }
}

// Test création mockup unisexe (valeur par défaut)
async function testCreateUnisexeMockup() {
  console.log('🧪 Test création mockup unisexe (valeur par défaut)...');
  
  const unisexeMockup = {
    name: 'T-shirt Unisexe Basic',
    description: 'T-shirt basique pour tous',
    price: 4500,
    status: 'draft',
    isReadyProduct: false,
    // genre non spécifié, devrait être UNISEXE par défaut
    categories: ['T-shirts', 'Unisexe'],
    sizes: ['S', 'M', 'L'],
    colorVariations: [
      {
        name: 'Blanc',
        colorCode: '#FFFFFF',
        images: [
          {
            url: 'https://example.com/tshirt-unisexe-blanc.jpg',
            view: 'Front'
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/mockups`, unisexeMockup, { headers });
    console.log('✅ Mockup unisexe créé avec succès:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erreur création mockup unisexe:', error.response?.data || error.message);
    return null;
  }
}

// Test récupération mockups par genre
async function testGetMockupsByGenre() {
  console.log('🧪 Test récupération mockups par genre...');
  
  try {
    // Test HOMME
    const hommeResponse = await axios.get(`${API_BASE_URL}/mockups/by-genre/HOMME`, { headers });
    console.log(`✅ Mockups HOMME trouvés: ${hommeResponse.data.length}`);
    
    // Test FEMME
    const femmeResponse = await axios.get(`${API_BASE_URL}/mockups/by-genre/FEMME`, { headers });
    console.log(`✅ Mockups FEMME trouvés: ${femmeResponse.data.length}`);
    
    // Test UNISEXE
    const unisexeResponse = await axios.get(`${API_BASE_URL}/mockups/by-genre/UNISEXE`, { headers });
    console.log(`✅ Mockups UNISEXE trouvés: ${unisexeResponse.data.length}`);
    
  } catch (error) {
    console.error('❌ Erreur récupération par genre:', error.response?.data || error.message);
  }
}

// Test récupération genres disponibles
async function testGetAvailableGenres() {
  console.log('🧪 Test récupération genres disponibles...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/mockups/genres`, { headers });
    console.log('✅ Genres disponibles:', response.data);
  } catch (error) {
    console.error('❌ Erreur récupération genres:', error.response?.data || error.message);
  }
}

// Test récupération tous les mockups avec filtre
async function testGetAllMockups() {
  console.log('🧪 Test récupération tous les mockups...');
  
  try {
    // Tous les mockups
    const allResponse = await axios.get(`${API_BASE_URL}/mockups`, { headers });
    console.log(`✅ Tous les mockups: ${allResponse.data.length}`);
    
    // Mockups filtrés par genre
    const hommeResponse = await axios.get(`${API_BASE_URL}/mockups?genre=HOMME`, { headers });
    console.log(`✅ Mockups HOMME (filtre): ${hommeResponse.data.length}`);
    
  } catch (error) {
    console.error('❌ Erreur récupération mockups:', error.response?.data || error.message);
  }
}

// Test validation des erreurs
async function testValidationErrors() {
  console.log('🧪 Test validation des erreurs...');
  
  // Test avec isReadyProduct: true (doit échouer)
  const invalidMockup = {
    name: 'T-shirt Test',
    description: 'Test',
    price: 5000,
    isReadyProduct: true, // Doit être false pour les mockups
    genre: 'HOMME',
    categories: ['T-shirts'],
    sizes: ['S'],
    colorVariations: []
  };

  try {
    await axios.post(`${API_BASE_URL}/mockups`, invalidMockup, { headers });
    console.log('❌ Test échoué: isReadyProduct: true devrait être rejeté');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Test réussi: isReadyProduct: true rejeté correctement');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }

  // Test avec genre invalide
  const invalidGenreMockup = {
    name: 'T-shirt Test',
    description: 'Test',
    price: 5000,
    isReadyProduct: false,
    genre: 'INVALID', // Genre invalide
    categories: ['T-shirts'],
    sizes: ['S'],
    colorVariations: []
  };

  try {
    await axios.post(`${API_BASE_URL}/mockups`, invalidGenreMockup, { headers });
    console.log('❌ Test échoué: genre invalide devrait être rejeté');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Test réussi: genre invalide rejeté correctement');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Démarrage des tests pour l\'implémentation du champ genre...\n');
  
  // Tests de création
  const hommeId = await testCreateHommeMockup();
  const femmeId = await testCreateFemmeMockup();
  const unisexeId = await testCreateUnisexeMockup();
  
  console.log('\n---');
  
  // Tests de récupération
  await testGetMockupsByGenre();
  await testGetAvailableGenres();
  await testGetAllMockups();
  
  console.log('\n---');
  
  // Tests de validation
  await testValidationErrors();
  
  console.log('\n🎉 Tests terminés!');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateHommeMockup,
  testCreateFemmeMockup,
  testCreateUnisexeMockup,
  testGetMockupsByGenre,
  testGetAvailableGenres,
  testGetAllMockups,
  testValidationErrors,
  runTests
}; 