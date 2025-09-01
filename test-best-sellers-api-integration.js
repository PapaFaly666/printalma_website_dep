#!/usr/bin/env node

/**
 * 🧪 Script de Test - Intégration API Best Sellers PrintAlma
 * 
 * Ce script teste tous les endpoints de l'API Best Sellers selon la documentation
 * et valide l'intégration frontend.
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3004/api';
const FALLBACK_BASE = 'http://localhost:3004/public';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}📋 ${msg}${colors.reset}\n`)
};

// Fonctions utilitaires
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatJSON = (obj) => JSON.stringify(obj, null, 2);

const testEndpoint = async (name, url, options = {}) => {
  try {
    log.test(`Test: ${name}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, options);
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data) {
      log.success(`${name} - ${duration}ms`);
      
      // Analyser la structure de la réponse
      const data = response.data;
      if (data.success !== undefined) {
        console.log(`   Success: ${data.success}`);
      }
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   Data: Array(${data.data.length})`);
        } else if (typeof data.data === 'object') {
          console.log(`   Data: Object(${Object.keys(data.data).length} keys)`);
        }
      }
      if (data.pagination) {
        console.log(`   Pagination: ${data.pagination.total} total, ${data.pagination.limit} limit`);
      }
      if (data.stats) {
        console.log(`   Stats: ${Object.keys(data.stats).length} metrics`);
      }
      if (data.cacheInfo) {
        console.log(`   Cache: ${data.cacheInfo.cached ? 'HIT' : 'MISS'} (${data.cacheInfo.cacheAge}ms)`);
      }
      
      return { success: true, data: response.data, duration };
    } else {
      log.error(`${name} - Status: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    log.error(`${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
};

const testPostEndpoint = async (name, url, payload, options = {}) => {
  try {
    log.test(`Test POST: ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Payload: ${formatJSON(payload)}`);
    
    const startTime = Date.now();
    const response = await axios.post(url, payload, options);
    const duration = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      log.success(`${name} - ${duration}ms`);
      console.log(`   Response: ${formatJSON(response.data)}`);
      return { success: true, data: response.data, duration };
    } else {
      log.error(`${name} - Status: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    log.error(`${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Tests des endpoints publics
const testPublicEndpoints = async () => {
  log.section('TESTS DES ENDPOINTS PUBLICS');
  
  const results = [];
  
  // 1. Test endpoint principal best-sellers
  let result = await testEndpoint(
    'Best Sellers Principal',
    `${API_BASE}/best-sellers?period=month&limit=10`
  );
  results.push({ name: 'Best Sellers Principal', ...result });
  
  // 2. Test avec différents paramètres
  result = await testEndpoint(
    'Best Sellers avec Filtres',
    `${API_BASE}/best-sellers?period=week&limit=5&minSales=1`
  );
  results.push({ name: 'Best Sellers avec Filtres', ...result });
  
  // 3. Test pagination
  result = await testEndpoint(
    'Best Sellers Pagination',
    `${API_BASE}/best-sellers?limit=5&offset=5`
  );
  results.push({ name: 'Best Sellers Pagination', ...result });
  
  // 4. Test statistiques rapides
  result = await testEndpoint(
    'Statistiques Rapides',
    `${API_BASE}/best-sellers/stats`
  );
  results.push({ name: 'Statistiques Rapides', ...result });
  
  // 5. Test analyse des tendances
  result = await testEndpoint(
    'Analyse des Tendances',
    `${API_BASE}/best-sellers/trends`
  );
  results.push({ name: 'Analyse des Tendances', ...result });
  
  // 6. Test best sellers par vendeur (exemple avec vendorId 1)
  result = await testEndpoint(
    'Best Sellers par Vendeur',
    `${API_BASE}/best-sellers/vendor/1?period=month&limit=5`
  );
  results.push({ name: 'Best Sellers par Vendeur', ...result });
  
  return results;
};

// Tests des endpoints admin (nécessitent authentification)
const testAdminEndpoints = async (token) => {
  log.section('TESTS DES ENDPOINTS ADMINISTRATEUR');
  
  if (!token) {
    log.warning('Token d\'authentification manquant - Tests admin ignorés');
    return [];
  }
  
  const results = [];
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 1. Test tableau de bord admin
  let result = await testEndpoint(
    'Dashboard Admin',
    `${API_BASE}/admin/best-sellers/dashboard`,
    authHeaders
  );
  results.push({ name: 'Dashboard Admin', ...result });
  
  // 2. Test statistiques du cache
  result = await testEndpoint(
    'Statistiques Cache',
    `${API_BASE}/admin/best-sellers/cache/stats`,
    authHeaders
  );
  results.push({ name: 'Statistiques Cache', ...result });
  
  // 3. Test rapport de performance
  result = await testEndpoint(
    'Rapport Performance',
    `${API_BASE}/admin/best-sellers/reports/performance?period=month`,
    authHeaders
  );
  results.push({ name: 'Rapport Performance', ...result });
  
  // 4. Test recalcul des statistiques (POST)
  result = await testPostEndpoint(
    'Recalcul Statistiques',
    `${API_BASE}/admin/best-sellers/recalculate-all`,
    { force: false, notifyOnComplete: true },
    authHeaders
  );
  results.push({ name: 'Recalcul Statistiques', ...result });
  
  // 5. Test marquage des best sellers (POST)
  result = await testPostEndpoint(
    'Marquage Best Sellers',
    `${API_BASE}/admin/best-sellers/mark-best-sellers`,
    { period: 'month', minSales: 5, limit: 50 },
    authHeaders
  );
  results.push({ name: 'Marquage Best Sellers', ...result });
  
  // 6. Test nettoyage du cache (POST)
  result = await testPostEndpoint(
    'Nettoyage Cache',
    `${API_BASE}/admin/best-sellers/cache/clear`,
    {},
    authHeaders
  );
  results.push({ name: 'Nettoyage Cache', ...result });
  
  return results;
};

// Test de fallback vers l'ancien système
const testFallbackEndpoints = async () => {
  log.section('TESTS DE FALLBACK (ANCIEN SYSTÈME)');
  
  const results = [];
  
  // Test ancien endpoint
  let result = await testEndpoint(
    'Ancien Endpoint Best Sellers',
    `${FALLBACK_BASE}/real-best-sellers?limit=10`
  );
  results.push({ name: 'Ancien Endpoint Best Sellers', ...result });
  
  // Test refresh cache ancien
  result = await testEndpoint(
    'Ancien Refresh Cache',
    `${FALLBACK_BASE}/real-best-sellers/refresh-cache`
  );
  results.push({ name: 'Ancien Refresh Cache', ...result });
  
  return results;
};

// Test de performance
const testPerformance = async () => {
  log.section('TESTS DE PERFORMANCE');
  
  const results = [];
  
  // Test de charge avec plusieurs requêtes simultanées
  log.test('Test de charge - 5 requêtes simultanées');
  
  const startTime = Date.now();
  const promises = Array(5).fill().map((_, i) => 
    axios.get(`${API_BASE}/best-sellers?limit=10&offset=${i * 10}`)
      .catch(error => ({ error: error.message }))
  );
  
  const responses = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  const successCount = responses.filter(r => r.status === 200).length;
  const errorCount = responses.length - successCount;
  
  if (successCount > 0) {
    log.success(`Test de charge - ${successCount}/${responses.length} réussies en ${duration}ms`);
  } else {
    log.error(`Test de charge - ${errorCount}/${responses.length} échouées`);
  }
  
  results.push({
    name: 'Test de charge',
    success: successCount > 0,
    duration,
    successCount,
    errorCount
  });
  
  return results;
};

// Test de validation des données
const testDataValidation = async () => {
  log.section('TESTS DE VALIDATION DES DONNÉES');
  
  const results = [];
  
  try {
    // Test structure des données best sellers
    const response = await axios.get(`${API_BASE}/best-sellers?limit=3`);
    
    if (response.data && response.data.success && response.data.data) {
      const products = response.data.data;
      
      if (Array.isArray(products) && products.length > 0) {
        const product = products[0];
        
        // Vérifier les champs requis selon la documentation
        const requiredFields = [
          'id', 'name', 'description', 'price', 'totalQuantitySold',
          'totalRevenue', 'averageUnitPrice', 'uniqueCustomers',
          'firstSaleDate', 'lastSaleDate', 'rank', 'vendor',
          'baseProduct', 'design', 'mainImage'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in product));
        
        if (missingFields.length === 0) {
          log.success('Structure des données - Tous les champs requis présents');
          
          // Vérifier la structure des objets imbriqués
          if (product.vendor && typeof product.vendor === 'object') {
            const vendorFields = ['id', 'name', 'shopName'];
            const missingVendorFields = vendorFields.filter(field => !(field in product.vendor));
            
            if (missingVendorFields.length === 0) {
              log.success('Structure vendor - OK');
            } else {
              log.warning(`Structure vendor - Champs manquants: ${missingVendorFields.join(', ')}`);
            }
          }
          
          if (product.baseProduct && typeof product.baseProduct === 'object') {
            const baseProductFields = ['id', 'name', 'categories'];
            const missingBaseFields = baseProductFields.filter(field => !(field in product.baseProduct));
            
            if (missingBaseFields.length === 0) {
              log.success('Structure baseProduct - OK');
            } else {
              log.warning(`Structure baseProduct - Champs manquants: ${missingBaseFields.join(', ')}`);
            }
          }
          
          results.push({ name: 'Validation Structure', success: true });
        } else {
          log.error(`Champs manquants: ${missingFields.join(', ')}`);
          results.push({ name: 'Validation Structure', success: false, error: 'Champs manquants' });
        }
      } else {
        log.error('Aucun produit dans la réponse');
        results.push({ name: 'Validation Structure', success: false, error: 'Aucun produit' });
      }
    } else {
      log.error('Format de réponse invalide');
      results.push({ name: 'Validation Structure', success: false, error: 'Format invalide' });
    }
  } catch (error) {
    log.error(`Erreur validation: ${error.message}`);
    results.push({ name: 'Validation Structure', success: false, error: error.message });
  }
  
  return results;
};

// Génération du rapport final
const generateReport = (allResults) => {
  log.section('RAPPORT FINAL');
  
  const totalTests = allResults.length;
  const successTests = allResults.filter(r => r.success).length;
  const failedTests = totalTests - successTests;
  const successRate = ((successTests / totalTests) * 100).toFixed(1);
  
  console.log(`📊 Résultats des tests:`);
  console.log(`   Total: ${totalTests}`);
  console.log(`   Réussis: ${colors.green}${successTests}${colors.reset}`);
  console.log(`   Échoués: ${colors.red}${failedTests}${colors.reset}`);
  console.log(`   Taux de réussite: ${successRate >= 80 ? colors.green : colors.red}${successRate}%${colors.reset}`);
  
  if (failedTests > 0) {
    console.log(`\n${colors.red}❌ Tests échoués:${colors.reset}`);
    allResults
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.error || 'Erreur inconnue'}`));
  }
  
  // Recommandations
  console.log(`\n${colors.cyan}💡 Recommandations:${colors.reset}`);
  
  if (successRate >= 90) {
    log.success('Excellente intégration ! L\'API Best Sellers fonctionne parfaitement.');
  } else if (successRate >= 70) {
    log.warning('Bonne intégration avec quelques problèmes mineurs à corriger.');
  } else if (successRate >= 50) {
    log.warning('Intégration partielle - Plusieurs endpoints nécessitent une attention.');
  } else {
    log.error('Intégration problématique - Révision complète recommandée.');
  }
  
  // Conseils spécifiques
  const hasAdminFailures = allResults.some(r => !r.success && r.name.includes('Admin'));
  if (hasAdminFailures) {
    console.log('   - Vérifiez l\'authentification pour les endpoints admin');
  }
  
  const hasMainEndpointFailure = allResults.some(r => !r.success && r.name.includes('Principal'));
  if (hasMainEndpointFailure) {
    console.log('   - Le endpoint principal Best Sellers semble inaccessible');
    console.log('   - Vérifiez que le serveur backend est démarré sur le port 3004');
  }
  
  const hasStructureFailure = allResults.some(r => !r.success && r.name.includes('Structure'));
  if (hasStructureFailure) {
    console.log('   - La structure des données ne correspond pas à la documentation');
    console.log('   - Mettez à jour les types TypeScript si nécessaire');
  }
};

// Fonction principale
const main = async () => {
  console.log(`${colors.magenta}🚀 Test d'Intégration API Best Sellers PrintAlma${colors.reset}\n`);
  
  const allResults = [];
  
  // Tests publics
  const publicResults = await testPublicEndpoints();
  allResults.push(...publicResults);
  
  await sleep(1000); // Pause entre les sections
  
  // Tests admin (token optionnel)
  const token = process.env.AUTH_TOKEN || process.argv[2];
  const adminResults = await testAdminEndpoints(token);
  allResults.push(...adminResults);
  
  await sleep(1000);
  
  // Tests de fallback
  const fallbackResults = await testFallbackEndpoints();
  allResults.push(...fallbackResults);
  
  await sleep(1000);
  
  // Tests de performance
  const performanceResults = await testPerformance();
  allResults.push(...performanceResults);
  
  await sleep(1000);
  
  // Tests de validation
  const validationResults = await testDataValidation();
  allResults.push(...validationResults);
  
  // Rapport final
  generateReport(allResults);
  
  // Code de sortie
  const hasFailures = allResults.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
};

// Gestion des erreurs globales
process.on('unhandledRejection', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

// Lancement du script
if (require.main === module) {
  main().catch(error => {
    log.error(`Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testPublicEndpoints,
  testAdminEndpoints,
  testFallbackEndpoints,
  testPerformance,
  testDataValidation,
  generateReport
}; 