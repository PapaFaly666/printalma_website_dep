// Fichier de test pour vérifier les endpoints de revenus avec authentification
import axios from 'axios';

const API_BASE = 'http://localhost:3004';

async function testWithAuth() {
  console.log('🔐 Test d\'authentification et des endpoints de revenus...\n');

  let authToken = null;

  try {
    // 1. Tentative de connexion
    console.log('1️⃣ Tentative de connexion...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@printalma.com',
        password: 'admin123'
      });

      if (loginResponse.data.access_token) {
        authToken = loginResponse.data.access_token;
        console.log('✅ Connexion réussie');
        console.log('👤 Utilisateur:', loginResponse.data.user);
      }
    } catch (error) {
      console.log('❌ Erreur de connexion:', error.response?.data || error.message);

      // Essayer avec un autre utilisateur
      try {
        const loginResponse2 = await axios.post(`${API_BASE}/auth/login`, {
          email: 'vendeur@printalma.com',
          password: 'vendeur123'
        });

        if (loginResponse2.data.access_token) {
          authToken = loginResponse2.data.access_token;
          console.log('✅ Connexion réussie avec vendeur');
          console.log('👤 Utilisateur:', loginResponse2.data.user);
        }
      } catch (error2) {
        console.log('❌ Erreur avec vendeur:', error2.response?.data || error2.message);
        return;
      }
    }

    if (!authToken) {
      console.log('\n❌ Impossible d\'obtenir un token d\'authentification');
      return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Test des endpoints avec le token
    const headers = { Authorization: `Bearer ${authToken}` };

    // Test stats
    console.log('2️⃣ GET /vendor/design-revenues/stats');
    try {
      const statsResponse = await axios.get(`${API_BASE}/vendor/design-revenues/stats`, { headers });
      console.log('✅ Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erreur stats:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test designs
    console.log('3️⃣ GET /vendor/design-revenues/designs');
    try {
      const designsResponse = await axios.get(`${API_BASE}/vendor/design-revenues/designs`, { headers });
      console.log('✅ Designs:', JSON.stringify(designsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erreur designs:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test settings
    console.log('4️⃣ GET /vendor/design-revenues/settings');
    try {
      const settingsResponse = await axios.get(`${API_BASE}/vendor/design-revenues/settings`, { headers });
      console.log('✅ Settings:', JSON.stringify(settingsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erreur settings:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

testWithAuth();