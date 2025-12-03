// Script de débogage pour vérifier le token
console.log('🔍 Débogage du token d\'authentification');

// 1. Vérifier localStorage
const authSession = localStorage.getItem('auth_session');
console.log('📦 Session localStorage:', authSession);

if (authSession) {
  try {
    const parsed = JSON.parse(authSession);
    console.log('📊 Session parsée:', {
      hasUser: !!parsed.user,
      hasToken: !!parsed.token,
      hasJwt: !!parsed.jwt,
      isAuthenticated: parsed.isAuthenticated,
      userId: parsed.user?.id,
      userEmail: parsed.user?.email
    });

    if (parsed.token) {
      console.log('🔑 Token trouvé dans localStorage:', parsed.token.substring(0, 50) + '...');
    } else if (parsed.jwt) {
      console.log('🔑 JWT trouvé dans localStorage:', parsed.jwt.substring(0, 50) + '...');
    } else {
      console.log('❌ Aucun token trouvé dans la session');
    }
  } catch (e) {
    console.error('❌ Erreur parsing session:', e);
  }
} else {
  console.log('❌ Aucune session trouvée dans localStorage');
}

// 2. Vérifier les cookies
console.log('🍪 Cookies document.cookie:', document.cookie);

// 3. Importer et tester le service hybride
try {
  const { hybridAuthService } = require('./src/services/hybridAuthService.ts');

  console.log('🔍 Test du service hybride:');
  console.log('- hasToken():', hybridAuthService.hasToken());
  console.log('- getToken():', hybridAuthService.getToken() ? hybridAuthService.getToken().substring(0, 50) + '...' : null);

  // Forcer le rechargement du token
  hybridAuthService.loadTokenFromStorage();
  console.log('- Après loadTokenFromStorage():');
  console.log('- hasToken():', hybridAuthService.hasToken());
  console.log('- getToken():', hybridAuthService.getToken() ? hybridAuthService.getToken().substring(0, 50) + '...' : null);

} catch (e) {
  console.error('❌ Erreur import service hybride:', e);
}

console.log('\n📋 Instructions:');
console.log('1. Copiez-collez ce code dans la console du navigateur');
console.log('2. Vérifiez si le token est trouvé');
console.log('3. Si token trouvé, essayez de valider un design');
console.log('4. Si token NON trouvé, le problème est dans le processus de login');