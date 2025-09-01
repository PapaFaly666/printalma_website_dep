// 🔍 Vérifier si l'utilisateur de test existe dans la base
const API_BASE = 'http://localhost:3004';
const TEST_EMAIL = 'test.vendeur@printalma.com';
const CORRECT_PASSWORD = 'TestPassword123!';
const WRONG_PASSWORD = 'mauvais123';

// Couleurs
const red = '\x1b[31m', green = '\x1b[32m', yellow = '\x1b[33m', blue = '\x1b[34m', reset = '\x1b[0m';

async function checkUserExists() {
  console.log(`${blue}🔍 Vérification de l'utilisateur de test${reset}`);
  console.log(`${blue}📧 Email: ${TEST_EMAIL}${reset}\n`);

  // Test 1: Essayer avec le bon mot de passe
  console.log(`${yellow}🧪 Test 1: Connexion avec le BON mot de passe${reset}`);
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: CORRECT_PASSWORD
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${green}✅ UTILISATEUR EXISTE ET MOT DE PASSE CORRECT !${reset}`);
      console.log(`👤 Utilisateur: ${data.user?.firstName} ${data.user?.lastName}`);
      console.log(`🏷️ Rôle: ${data.user?.role}`);
      console.log(`🎨 Type: ${data.user?.vendeur_type}`);
      console.log(`🔢 Login attempts: ${data.user?.login_attempts || 0}`);
      
      return { exists: true, user: data.user };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`${red}❌ Échec avec bon mot de passe: ${errorData.message || 'Erreur inconnue'}${reset}`);
    }
  } catch (error) {
    console.log(`${red}💥 Erreur réseau: ${error.message}${reset}`);
    return { exists: false, error: error.message };
  }

  console.log(`\n${yellow}🧪 Test 2: Connexion avec le MAUVAIS mot de passe${reset}`);
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: WRONG_PASSWORD
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`${yellow}📝 Message avec mauvais mot de passe:${reset}`);
      console.log(`   "${errorData.message}"`);
      
      // Analyser le message
      if (errorData.message && errorData.message.includes('Il vous reste')) {
        console.log(`${green}✅ Messages avec tentatives détectés !${reset}`);
      } else if (errorData.message && errorData.message.includes('Email ou mot de passe incorrect')) {
        console.log(`${yellow}⚠️ Message générique - mais utilisateur probablement présent${reset}`);
      } else {
        console.log(`${red}❌ Message inattendu${reset}`);
      }
      
      return { exists: true, message: errorData.message };
    }
  } catch (error) {
    console.log(`${red}💥 Erreur réseau: ${error.message}${reset}`);
  }

  return { exists: false };
}

async function main() {
  console.log(`${blue}🎯 Diagnostic Utilisateur de Test PrintAlma\n${reset}`);
  
  const result = await checkUserExists();
  
  console.log(`\n${blue}📋 Résumé:${reset}`);
  if (result.exists) {
    if (result.user) {
      console.log(`${green}✅ L'utilisateur de test existe et fonctionne parfaitement !${reset}`);
      console.log(`${green}✅ Vous pouvez maintenant tester l'interface web${reset}`);
    } else {
      console.log(`${yellow}⚠️ L'utilisateur existe mais avec le message générique${reset}`);
      console.log(`${yellow}ℹ️ Cela peut indiquer que le backend n'implémente pas encore les tentatives progressives${reset}`);
    }
  } else {
    console.log(`${red}❌ L'utilisateur de test n'existe PAS dans la base !${reset}`);
    console.log(`${red}🔧 Vous devez d'abord exécuter: node create-test-user.cjs${reset}`);
    console.log(`${red}🔧 Puis insérer la requête SQL dans votre base PostgreSQL${reset}`);
  }

  console.log(`\n${blue}🚀 Prochaines étapes:${reset}`);
  if (result.exists) {
    console.log(`1. Testez l'interface web à http://localhost:5173/login`);
    console.log(`2. Email: ${TEST_EMAIL}`);
    console.log(`3. Mot de passe INCORRECT: ${WRONG_PASSWORD} (pour tester les erreurs)`);
    console.log(`4. Mot de passe CORRECT: ${CORRECT_PASSWORD} (pour se connecter)`);
  } else {
    console.log(`1. Exécutez: node create-test-user.cjs`);
    console.log(`2. Copiez la requête SQL dans votre base PostgreSQL`);
    console.log(`3. Relancez ce script pour vérifier`);
  }
}

main().catch(console.error); 