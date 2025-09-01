const fetch = require('node-fetch');

// 🎯 Configuration de test
const API_URL = 'http://localhost:3004/auth/login';
const TEST_USER = {
  email: 'test.vendeur@printalma.com', // ⚠️ Assurez-vous que cet utilisateur existe !
  wrongPassword: 'mauvais123'
};

// 🎨 Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testLogin(attempt) {
  try {
    console.log(`\n${colors.cyan}🧪 Tentative ${attempt}${colors.reset}`);
    console.log(`${colors.blue}📧 Email: ${TEST_USER.email}${colors.reset}`);
    console.log(`${colors.blue}🔑 Password: ${TEST_USER.wrongPassword}${colors.reset}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.wrongPassword
      })
    });

    console.log(`${colors.yellow}📊 Status Code: ${response.status}${colors.reset}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Erreur HTTP ${response.status}` 
      }));
      
      console.log(`${colors.red}❌ Message d'erreur:${colors.reset}`);
      console.log(`   "${errorData.message}"`);
      
      // Analyse du message
      const remaining = extractRemainingAttempts(errorData.message);
      const isLocked = isAccountLocked(errorData.message);
      const lockTime = extractLockTime(errorData.message);
      
      if (remaining !== null) {
        console.log(`${colors.green}✅ Tentatives restantes extraites: ${remaining}${colors.reset}`);
      }
      
      if (isLocked) {
        console.log(`${colors.red}🔒 Compte verrouillé détecté${colors.reset}`);
        if (lockTime) {
          console.log(`${colors.red}⏰ Temps: ${lockTime}${colors.reset}`);
        }
      }
      
      return { success: false, message: errorData.message, isLocked };
    } else {
      const data = await response.json();
      console.log(`${colors.green}✅ Connexion réussie!${colors.reset}`);
      console.log(`   Utilisateur: ${data.user?.firstName} ${data.user?.lastName}`);
      return { success: true, user: data.user };
    }
    
  } catch (error) {
    console.log(`${colors.red}💥 Erreur de connexion: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Fonctions d'extraction (simples)
function extractRemainingAttempts(message) {
  if (!message) return null;
  const match = message.match(/Il vous reste (\d+) tentative/);
  return match ? parseInt(match[1]) : null;
}

function isAccountLocked(message) {
  if (!message) return false;
  return message.includes('verrouillé') || message.includes('Temps restant');
}

function extractLockTime(message) {
  if (!message) return null;
  const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
  return timeMatch ? timeMatch[1].trim() : null;
}

async function runTests() {
  console.log(`${colors.blue}🎯 Test Rapide des Messages Backend PrintAlma${colors.reset}`);
  console.log(`${colors.blue}🌐 URL: ${API_URL}${colors.reset}`);
  console.log(`${colors.yellow}⚠️ IMPORTANT: L'utilisateur de test doit exister dans la base !${colors.reset}`);
  console.log(`${colors.yellow}Exécutez d'abord: node create-test-user.cjs${colors.reset}`);
  
  // Tests multiples pour voir l'évolution des messages
  for (let i = 1; i <= 8; i++) {
    const result = await testLogin(i);
    
    // Pause entre les tentatives
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Arrêter si le compte est verrouillé
    if (result.isLocked && i >= 6) {
      console.log(`\n${colors.red}🚫 Tests arrêtés - Compte verrouillé${colors.reset}`);
      break;
    }
  }
  
  console.log(`\n${colors.green}🎉 Tests terminés !${colors.reset}`);
  console.log(`${colors.cyan}📋 Messages attendus :${colors.reset}`);
  console.log(`${colors.cyan}1-4: "Il vous reste X tentatives"${colors.reset}`);
  console.log(`${colors.cyan}5: "Dernière tentative avant verrouillage"${colors.reset}`);
  console.log(`${colors.cyan}6+: "Compte verrouillé" avec temps${colors.reset}`);
}

// Démarrer les tests
runTests().catch(console.error); 