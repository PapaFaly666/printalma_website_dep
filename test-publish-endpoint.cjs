#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST - Endpoint Publication Produit Vendeur
 * 
 * Ce script teste l'endpoint PATCH /vendor/products/:id/publish
 * pour vérifier qu'il fonctionne correctement après implémentation.
 */

const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3004',
  productId: 122, // ID du produit à tester (modifiable)
  timeout: 10000, // 10 secondes
  retries: 3
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(`🚀 ${message}`, 'bright');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(`📋 ${message}`, 'cyan');
  console.log('-'.repeat(40));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testPublishEndpoint(authToken) {
  logHeader('TEST ENDPOINT PUBLICATION PRODUIT VENDEUR');
  
  if (!authToken || authToken === 'VOTRE_TOKEN_JWT_ICI') {
    logError('Token JWT non fourni ou invalide !');
    logInfo('Utilisez : node test-publish-endpoint.cjs <VOTRE_TOKEN_JWT>');
    logInfo('Ou modifiez la variable authToken dans le script');
    return false;
  }

  logSection('CONFIGURATION DU TEST');
  logInfo(`URL de base: ${CONFIG.baseUrl}`);
  logInfo(`ID du produit: ${CONFIG.productId}`);
  logInfo(`Méthode: PATCH`);
  logInfo(`Endpoint: /vendor/products/${CONFIG.productId}/publish`);
  logInfo(`Token: ${authToken.substring(0, 20)}...`);

  logSection('EXÉCUTION DU TEST');
  
  try {
    logInfo('Envoi de la requête...');
    
    const startTime = Date.now();
    
    const response = await fetch(`${CONFIG.baseUrl}/vendor/products/${CONFIG.productId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      timeout: CONFIG.timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    logInfo(`Temps de réponse: ${responseTime}ms`);
    
    logSection('ANALYSE DE LA RÉPONSE');
    logInfo(`Status: ${response.status} ${response.statusText}`);
    logInfo(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    if (response.ok) {
      const result = await response.json();
      
      logSuccess('PUBLICATION RÉUSSIE !');
      logInfo(`Message: ${result.message}`);
      logInfo(`Produit ID: ${result.product?.id}`);
      logInfo(`Nom: ${result.product?.name}`);
      logInfo(`Statut: ${result.product?.status}`);
      logInfo(`Publié le: ${result.product?.publishedAt}`);
      logInfo(`Statut précédent: ${result.previousStatus}`);
      logInfo(`Nouveau statut: ${result.newStatus}`);
      
      return true;
      
    } else {
      const errorData = await response.json().catch(() => ({}));
      
      logError(`PUBLICATION ÉCHOUÉE (${response.status})`);
      logInfo(`Message d'erreur: ${errorData.message || 'Aucun message d\'erreur'}`);
      logInfo(`Détails: ${JSON.stringify(errorData, null, 2)}`);
      
      // Analyse des erreurs courantes
      switch (response.status) {
        case 400:
          logWarning('Erreur 400: Vérifiez les paramètres de la requête');
          break;
        case 401:
          logWarning('Erreur 401: Token JWT invalide ou expiré');
          break;
        case 403:
          logWarning('Erreur 403: Accès refusé - Vérifiez les permissions');
          break;
        case 404:
          logWarning('Erreur 404: Endpoint non trouvé - Vérifiez l\'implémentation backend');
          break;
        case 500:
          logWarning('Erreur 500: Erreur serveur - Vérifiez les logs backend');
          break;
        default:
          logWarning(`Erreur ${response.status}: Erreur inattendue`);
      }
      
      return false;
    }
    
  } catch (error) {
    logError('ERREUR DE CONNEXION');
    logInfo(`Type d'erreur: ${error.name || 'Unknown'}`);
    logInfo(`Message: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      logWarning('Le serveur backend n\'est pas accessible');
      logInfo('Vérifiez que le serveur est démarré sur le port 3004');
    } else if (error.code === 'ENOTFOUND') {
      logWarning('Impossible de résoudre l\'adresse localhost:3004');
      logInfo('Vérifiez votre configuration réseau');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      logWarning('Module fetch non disponible');
      logInfo('Installez node-fetch: npm install node-fetch');
    }
    
    return false;
  }
}

async function runDiagnostics() {
  logSection('DIAGNOSTICS SYSTÈME');
  
  try {
    // Test de connectivité de base
    logInfo('Test de connectivité vers localhost:3004...');
    
    const response = await fetch(`${CONFIG.baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      logSuccess('Serveur accessible sur localhost:3004');
    } else {
      logWarning(`Serveur répond mais endpoint /health non implémenté (${response.status})`);
    }
    
  } catch (error) {
    logError('Serveur inaccessible sur localhost:3004');
    logInfo('Vérifiez que le serveur backend est démarré');
  }
  
  // Vérifications supplémentaires
  logInfo('Vérifications recommandées:');
  logInfo('1. Serveur backend démarré sur le port 3004');
  logInfo('2. Endpoint /vendor/products/:id/publish implémenté');
  logInfo('3. Middleware d\'authentification configuré');
  logInfo('4. Modèle VendorProduct défini');
  logInfo('5. Base de données accessible');
}

async function main() {
  // Récupération du token depuis les arguments de ligne de commande
  const authToken = process.argv[2] || 'VOTRE_TOKEN_JWT_ICI';
  
  if (authToken === 'VOTRE_TOKEN_JWT_ICI') {
    logHeader('MODE DIAGNOSTIC (sans authentification)');
    await runDiagnostics();
    
    logSection('INSTRUCTIONS');
    logInfo('Pour tester avec authentification:');
    logInfo('node test-publish-endpoint.cjs <VOTRE_TOKEN_JWT>');
    logInfo('');
    logInfo('Ou modifiez la variable authToken dans le script');
    
  } else {
    // Test avec authentification
    const success = await testPublishEndpoint(authToken);
    
    if (success) {
      logSection('RÉSULTAT FINAL');
      logSuccess('🎉 L\'endpoint de publication fonctionne correctement !');
      logInfo('Le produit vendeur peut maintenant être publié depuis le frontend.');
    } else {
      logSection('RÉSULTAT FINAL');
      logError('💥 L\'endpoint de publication ne fonctionne pas.');
      logInfo('Consultez le guide d\'implémentation pour résoudre le problème.');
    }
  }
  
  logSection('FIN DU TEST');
  logInfo('Script terminé. Consultez les messages ci-dessus pour le diagnostic.');
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logError('Promesse rejetée non gérée:');
  logInfo(`Raison: ${reason}`);
  logInfo(`Promesse: ${promise}`);
});

process.on('uncaughtException', (error) => {
  logError('Exception non capturée:');
  logInfo(`Erreur: ${error.message}`);
  logInfo(`Stack: ${error.stack}`);
  process.exit(1);
});

// Lancer le script
if (require.main === module) {
  main().catch(error => {
    logError('Erreur fatale dans le script principal:');
    logInfo(error.message);
    process.exit(1);
  });
}

module.exports = { testPublishEndpoint, runDiagnostics };

