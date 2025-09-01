// Vérification de la configuration API
console.log('🔍 Vérification de la configuration PrintAlma...\n');

// Import de la configuration
import { API_CONFIG, API_ENDPOINTS } from './src/config/api.ts';

console.log('📋 Configuration API:');
console.log('BASE_URL:', API_CONFIG.BASE_URL);
console.log('HEADERS:', API_CONFIG.HEADERS);
console.log('LOGIN_ENDPOINT:', API_ENDPOINTS.AUTH.LOGIN);
console.log('URL complète de login:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);

console.log('\n✅ Configuration vérifiée!');
console.log('URL de login attendue: https://printalma-back-dep.onrender.com/auth/login');

// Test que l'URL est correcte
const expectedUrl = 'https://printalma-back-dep.onrender.com';
if (API_CONFIG.BASE_URL === expectedUrl) {
    console.log('✅ Configuration correcte!');
} else {
    console.log('❌ Configuration incorrecte!');
    console.log('Attendu:', expectedUrl);
    console.log('Actuel:', API_CONFIG.BASE_URL);
}