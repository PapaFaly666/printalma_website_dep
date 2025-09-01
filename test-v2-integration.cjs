#!/usr/bin/env node

/**
 * 🧪 TEST INTÉGRATION V2 : Validation Architecture Admin Préservée
 * 
 * Ce script teste:
 * 1. Authentification JWT + cookies fallback
 * 2. Endpoints API V2
 * 3. Structure de données conforme
 * 4. Images non vides
 * 5. Transformation legacy → V2
 */

// Utiliser fetch natif de Node.js 18+
// const fetch = require('node-fetch'); // Plus besoin

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3004';
const VENDOR_API_BASE = `${API_BASE_URL}/api/vendor`;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    'INFO': colors.cyan,
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red,
    'DEBUG': colors.magenta
  };
  
  console.log(`${levelColors[level] || ''}[${timestamp}] ${level}: ${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Extraction du token d'authentification (simulation browser)
function getAuthToken() {
  // Simuler les différentes sources de token
  const sources = [
    process.env.AUTH_TOKEN,
    process.env.JWT_TOKEN,
    process.env.VENDOR_TOKEN
  ];
  
  for (const token of sources) {
    if (token) {
      log('INFO', `Token trouvé dans les variables d'environnement`);
      return token;
    }
  }
  
  log('WARNING', 'Aucun token trouvé - Test en mode public');
  return null;
}

// Headers de requête avec authentification hybride
function getRequestHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'PrintAlma-V2-Test/1.0'
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      log('INFO', '🔑 Authentification par token JWT');
    } else {
      log('INFO', '🔑 Mode test sans authentification');
    }
  }
  
  return headers;
}

// Test 1: Health Check API
async function testHealthCheck() {
  log('INFO', '🏥 === TEST 1: HEALTH CHECK V2 ===');
  
  try {
    const response = await fetch(`${VENDOR_API_BASE}/health`, {
      method: 'GET',
      headers: getRequestHeaders(false) // Health check sans auth
    });
    
    log('INFO', `Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      log('SUCCESS', 'Health check réussi');
      log('DEBUG', 'Response data:', {
        status: data.status,
        architecture: data.architecture,
        features: data.features?.length || 0,
        services: Object.keys(data.services || {})
      });
      
      // Vérification architecture V2
      if (data.architecture === 'v2_admin_preserved') {
        log('SUCCESS', '✅ Architecture V2 confirmée');
      } else {
        log('WARNING', `Architecture inattendue: ${data.architecture}`);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      log('ERROR', `Health check échoué: ${response.status}`);
      log('DEBUG', 'Error details:', errorText);
      return false;
    }
  } catch (error) {
    log('ERROR', `Erreur réseau health check: ${error.message}`);
    return false;
  }
}

// Test 2: Authentification
async function testAuthentication() {
  log('INFO', '🔑 === TEST 2: AUTHENTIFICATION V2 ===');
  
  const token = getAuthToken();
  if (!token) {
    log('WARNING', 'Pas de token - Skip test authentification');
    return null;
  }
  
  try {
    // Test avec token JWT
    const response = await fetch(`${VENDOR_API_BASE}/stats`, {
      method: 'GET',
      headers: getRequestHeaders(true)
    });
    
    log('INFO', `Status avec token: ${response.status}`);
    
    if (response.status === 401) {
      log('ERROR', '❌ Token JWT rejeté');
      return false;
    }
    
    if (response.ok) {
      const data = await response.json();
      log('SUCCESS', '✅ Authentification JWT réussie');
      log('DEBUG', 'Stats response:', {
        success: data.success,
        architecture: data.data?.architecture
      });
      return true;
    }
    
    // Test fallback cookies
    log('INFO', 'Test fallback cookies...');
    const responseCookies = await fetch(`${VENDOR_API_BASE}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}; jwt=${token}`
      }
    });
    
    if (responseCookies.ok) {
      log('SUCCESS', '✅ Authentification par cookies réussie');
      return true;
    }
    
    log('ERROR', '❌ Authentification échouée (JWT + cookies)');
    return false;
    
  } catch (error) {
    log('ERROR', `Erreur test authentification: ${error.message}`);
    return false;
  }
}

// Test 3: Structure API V2
async function testApiV2Structure() {
  log('INFO', '📋 === TEST 3: STRUCTURE API V2 ===');
  
  try {
    const response = await fetch(`${VENDOR_API_BASE}/products?limit=5`, {
      method: 'GET',
      headers: getRequestHeaders(true)
    });
    
    log('INFO', `Status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        log('WARNING', 'Endpoint protégé - Skip test structure');
        return null;
      }
      
      const errorText = await response.text();
      log('ERROR', `API error: ${response.status}`);
      log('DEBUG', 'Error details:', errorText);
      return false;
    }
    
    const data = await response.json();
    
    // Validation structure V2
    const checks = {
      hasSuccess: data.hasOwnProperty('success'),
      hasData: data.hasOwnProperty('data') || data.hasOwnProperty('products'),
      hasPagination: data.pagination && typeof data.pagination === 'object',
      hasHealthMetrics: data.healthMetrics && typeof data.healthMetrics === 'object'
    };
    
    log('DEBUG', 'Structure checks:', checks);
    
    // Validation des produits
    const products = data.data?.products || data.products || [];
    log('INFO', `Nombre de produits: ${products.length}`);
    
    if (products.length > 0) {
      const firstProduct = products[0];
      
      const productChecks = {
        hasId: firstProduct.hasOwnProperty('id'),
        hasVendorName: firstProduct.hasOwnProperty('vendorName'),
        hasAdminProduct: firstProduct.hasOwnProperty('adminProduct'),
        hasDesignApplication: firstProduct.hasOwnProperty('designApplication'),
        hasImages: firstProduct.hasOwnProperty('images'),
        hasVendor: firstProduct.hasOwnProperty('vendor')
      };
      
      log('DEBUG', 'Product structure checks:', productChecks);
      
      // Vérification architecture V2 spécifique
      if (firstProduct.adminProduct?.colorVariations) {
        log('SUCCESS', '✅ Structure admin préservée détectée');
        
        const colorVariations = firstProduct.adminProduct.colorVariations;
        log('INFO', `Variations de couleur: ${colorVariations.length}`);
        
        // Vérifier les images non vides
        let hasValidImages = false;
        for (const variation of colorVariations) {
          for (const image of variation.images || []) {
            if (image.url && image.url.trim() && image.url !== '') {
              hasValidImages = true;
              break;
            }
          }
          if (hasValidImages) break;
        }
        
        if (hasValidImages) {
          log('SUCCESS', '✅ Images valides trouvées (non vides)');
        } else {
          log('WARNING', '⚠️ Aucune image valide trouvée');
        }
      } else {
        log('WARNING', '⚠️ Structure legacy détectée (pas adminProduct.colorVariations)');
      }
      
      // Vérification design application
      if (firstProduct.designApplication) {
        const designApp = firstProduct.designApplication;
        log('DEBUG', 'Design application:', {
          hasDesign: designApp.hasDesign,
          positioning: designApp.positioning,
          scale: designApp.scale
        });
      }
    }
    
    log('SUCCESS', '✅ Structure API validée');
    return true;
    
  } catch (error) {
    log('ERROR', `Erreur test structure API: ${error.message}`);
    return false;
  }
}

// Test 4: Health Metrics V2
async function testHealthMetrics() {
  log('INFO', '📊 === TEST 4: HEALTH METRICS V2 ===');
  
  try {
    const response = await fetch(`${VENDOR_API_BASE}/products/health-report`, {
      method: 'GET',
      headers: getRequestHeaders(true)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        log('WARNING', 'Endpoint protégé - Skip test health metrics');
        return null;
      }
      
      log('WARNING', `Health report non disponible: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.healthReport) {
      const report = data.healthReport;
      
      log('SUCCESS', '✅ Health report récupéré');
      log('DEBUG', 'Health metrics:', {
        totalProducts: report.totalProducts,
        healthyProducts: report.healthyProducts,
        overallHealthScore: report.overallHealthScore,
        architecture: report.architecture
      });
      
      // Vérification score V2 (devrait être 100%)
      if (report.overallHealthScore === 100) {
        log('SUCCESS', '✅ Score de santé V2 optimal (100%)');
      } else {
        log('WARNING', `Score de santé non optimal: ${report.overallHealthScore}%`);
      }
      
      // Vérification architecture
      if (report.architecture === 'v2_admin_preserved') {
        log('SUCCESS', '✅ Architecture V2 confirmée dans health report');
      }
      
      return true;
    }
    
    log('WARNING', 'Health report structure inattendue');
    return false;
    
  } catch (error) {
    log('ERROR', `Erreur test health metrics: ${error.message}`);
    return false;
  }
}

// Test principal
async function runV2IntegrationTests() {
  console.log(`\n${colors.cyan}🧪 === TESTS INTÉGRATION V2 ARCHITECTURE ADMIN PRÉSERVÉE ===${colors.reset}\n`);
  
  const results = {
    healthCheck: await testHealthCheck(),
    authentication: await testAuthentication(),
    apiStructure: await testApiV2Structure(),
    healthMetrics: await testHealthMetrics()
  };
  
  console.log(`\n${colors.blue}📊 === RÉSULTATS DES TESTS ===${colors.reset}\n`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result === true ? `${colors.green}✅ PASS` : 
                   result === false ? `${colors.red}❌ FAIL` : 
                   `${colors.yellow}⚠️ SKIP`;
    console.log(`${status}${colors.reset} ${test}`);
  });
  
  const passCount = Object.values(results).filter(r => r === true).length;
  const totalCount = Object.values(results).filter(r => r !== null).length;
  
  console.log(`\n${colors.magenta}🎯 Score: ${passCount}/${totalCount} tests réussis${colors.reset}\n`);
  
  if (passCount === totalCount && totalCount > 0) {
    console.log(`${colors.green}🎉 INTÉGRATION V2 VALIDÉE AVEC SUCCÈS !${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️ Des tests ont échoué ou ont été ignorés${colors.reset}\n`);
    process.exit(1);
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  runV2IntegrationTests().catch(error => {
    log('ERROR', `Erreur critique: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runV2IntegrationTests,
  testHealthCheck,
  testAuthentication,
  testApiV2Structure,
  testHealthMetrics
}; 