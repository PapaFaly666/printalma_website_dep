#!/usr/bin/env node

/**
 * 🧪 TEST BACKEND CASCADE VALIDATION
 * 
 * Script pour tester le système de validation cascade après implémentation backend
 * Usage: node test-backend-cascade-validation.cjs
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3004';

// Couleurs pour les logs
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log('cyan', `🧪 ${title}`);
    console.log('='.repeat(60));
}

function logTest(testName) {
    log('blue', `\n🔍 Test: ${testName}`);
}

function logSuccess(message) {
    log('green', `✅ ${message}`);
}

function logError(message) {
    log('red', `❌ ${message}`);
}

function logWarning(message) {
    log('yellow', `⚠️ ${message}`);
}

function logInfo(message) {
    log('white', `ℹ️ ${message}`);
}

// Helper pour les requêtes HTTP
async function makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'credentials': 'include',
            ...headers
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.message || result.error || 'Unknown error'}`);
        }
        
        return result;
    } catch (error) {
        logError(`Request failed: ${method} ${endpoint}`);
        logError(`Error: ${error.message}`);
        throw error;
    }
}

// Variables globales pour les tests
let testData = {
    designId: null,
    productIds: [],
    vendorId: null
};

async function testDatabaseStructure() {
    logSection('VÉRIFICATION STRUCTURE BASE DE DONNÉES');
    
    logTest('Vérification table design_product_links');
    try {
        // Test si la table existe en essayant une requête
        const result = await makeRequest('GET', '/api/admin/designs/1/products');
        logSuccess('Table design_product_links existe et accessible');
    } catch (error) {
        logError('Table design_product_links manquante ou inaccessible');
        logError('Exécuter: CREATE TABLE design_product_links...');
        return false;
    }
    
    return true;
}

async function testCreateDesign() {
    logSection('CRÉATION DESIGN DE TEST');
    
    logTest('Création d\'un nouveau design');
    try {
        const designData = {
            name: `Test Design ${Date.now()}`,
            description: 'Design pour test cascade validation',
            imageUrl: 'https://example.com/test-design.png',
            price: 500 // 5.00€
        };
        
        const result = await makeRequest('POST', '/api/designs', designData);
        testData.designId = result.designId || result.id;
        
        logSuccess(`Design créé avec ID: ${testData.designId}`);
        logInfo(`Design non validé par défaut: isValidated = false`);
        
        return true;
    } catch (error) {
        logError('Impossible de créer un design de test');
        return false;
    }
}

async function testCreateProductsWithDesign() {
    logSection('CRÉATION PRODUITS AVEC DESIGN');
    
    const testCases = [
        {
            name: 'Produit Auto-Publication',
            workflow: 'AUTO-PUBLISH',
            postValidationAction: 'AUTO_PUBLISH'
        },
        {
            name: 'Produit Publication Manuelle',
            workflow: 'MANUAL-PUBLISH',
            postValidationAction: 'TO_DRAFT'
        }
    ];
    
    for (const testCase of testCases) {
        logTest(`Création: ${testCase.name}`);
        
        try {
            const productData = {
                baseProductId: 1, // Assuming base product exists
                designId: testData.designId,
                vendorName: `Test ${testCase.name}`,
                vendorDescription: `Description ${testCase.name}`,
                vendorPrice: 2000, // 20.00€
                workflow: testCase.workflow,
                postValidationAction: testCase.postValidationAction,
                selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
                selectedSizes: [{ id: 1, sizeName: 'M' }],
                forcedStatus: 'PENDING'
            };
            
            const result = await makeRequest('POST', '/api/vendor/products', productData);
            const productId = result.productId;
            testData.productIds.push(productId);
            
            logSuccess(`Produit créé avec ID: ${productId}`);
            logInfo(`Workflow: ${testCase.workflow}`);
            logInfo(`Status initial: PENDING`);
            logInfo(`isValidated: false (design pas encore validé)`);
            
            // Vérifier le lien design-produit
            const linkCheck = await makeRequest('GET', `/api/vendor/products/${productId}/design`);
            if (linkCheck.hasLinkedDesign && linkCheck.design.id == testData.designId) {
                logSuccess(`Lien design-produit créé correctement`);
            } else {
                logError(`Lien design-produit manquant`);
            }
            
        } catch (error) {
            logError(`Échec création ${testCase.name}`);
        }
    }
    
    return testData.productIds.length > 0;
}

async function testProductStatusBeforeValidation() {
    logSection('VÉRIFICATION STATUS AVANT VALIDATION');
    
    for (const productId of testData.productIds) {
        logTest(`Vérification produit ${productId}`);
        
        try {
            const result = await makeRequest('GET', `/api/vendor/products/${productId}`);
            const product = result.data || result;
            
            logInfo(`Status: ${product.status}`);
            logInfo(`isValidated: ${product.isValidated}`);
            logInfo(`readyToPublish: ${product.readyToPublish}`);
            logInfo(`pendingAutoPublish: ${product.pendingAutoPublish}`);
            logInfo(`workflow: ${product.workflow}`);
            
            // Vérifications attendues
            if (product.status === 'PENDING' && !product.isValidated) {
                logSuccess('Status correct avant validation');
            } else {
                logWarning('Status inattendu avant validation');
            }
            
        } catch (error) {
            logError(`Impossible de vérifier le produit ${productId}`);
        }
    }
}

async function testDesignValidation() {
    logSection('VALIDATION DESIGN PAR ADMIN');
    
    logTest('Validation du design par l\'admin');
    
    try {
        const result = await makeRequest('POST', `/api/admin/designs/${testData.designId}/validate`);
        
        logSuccess('Design validé par l\'admin');
        logInfo(`Produits mis à jour: ${result.updatedProducts}`);
        
        if (result.cascadeActions && result.cascadeActions.length > 0) {
            logSuccess('Actions cascade exécutées:');
            result.cascadeActions.forEach(action => {
                logInfo(`  Produit ${action.productId}: ${action.oldStatus} → ${action.newStatus}`);
                logInfo(`  Workflow: ${action.workflow}`);
            });
        }
        
        return true;
    } catch (error) {
        logError('Échec validation design');
        return false;
    }
}

async function testProductStatusAfterValidation() {
    logSection('VÉRIFICATION STATUS APRÈS VALIDATION');
    
    for (const productId of testData.productIds) {
        logTest(`Vérification produit ${productId} après validation`);
        
        try {
            const result = await makeRequest('GET', `/api/vendor/products/${productId}`);
            const product = result.data || result;
            
            logInfo(`Status: ${product.status}`);
            logInfo(`isValidated: ${product.isValidated}`);
            logInfo(`readyToPublish: ${product.readyToPublish}`);
            logInfo(`pendingAutoPublish: ${product.pendingAutoPublish}`);
            logInfo(`workflow: ${product.workflow}`);
            
            // Vérifications selon le workflow
            if (product.isValidated) {
                logSuccess('✅ isValidated = true (SUCCÈS!)');
                
                if (product.workflow === 'AUTO-PUBLISH') {
                    if (product.status === 'PUBLISHED') {
                        logSuccess('✅ Auto-publication réussie');
                    } else {
                        logError('❌ Auto-publication échouée');
                    }
                } else if (product.workflow === 'MANUAL-PUBLISH') {
                    if (product.status === 'DRAFT' && product.readyToPublish) {
                        logSuccess('✅ Prêt pour publication manuelle');
                    } else {
                        logError('❌ Status incorrect pour publication manuelle');
                    }
                }
            } else {
                logError('❌ isValidated = false (ÉCHEC!)');
            }
            
        } catch (error) {
            logError(`Impossible de vérifier le produit ${productId}`);
        }
    }
}

async function testManualPublication() {
    logSection('TEST PUBLICATION MANUELLE');
    
    // Trouver un produit prêt à publier manuellement
    for (const productId of testData.productIds) {
        try {
            const result = await makeRequest('GET', `/api/vendor/products/${productId}`);
            const product = result.data || result;
            
            if (product.workflow === 'MANUAL-PUBLISH' && product.readyToPublish) {
                logTest(`Publication manuelle du produit ${productId}`);
                
                const publishResult = await makeRequest('PUT', `/api/vendor/products/${productId}/publish`);
                
                if (publishResult.success && publishResult.newStatus === 'PUBLISHED') {
                    logSuccess('✅ Publication manuelle réussie');
                } else {
                    logError('❌ Publication manuelle échouée');
                }
                
                break;
            }
        } catch (error) {
            logError(`Erreur test publication manuelle: ${error.message}`);
        }
    }
}

async function testDesignProductLinks() {
    logSection('VÉRIFICATION LIENS DESIGN-PRODUITS');
    
    logTest('Récupération des produits liés au design');
    
    try {
        const result = await makeRequest('GET', `/api/admin/designs/${testData.designId}/products`);
        
        logSuccess(`${result.totalProducts} produit(s) lié(s) au design`);
        
        result.linkedProducts.forEach(product => {
            logInfo(`Produit ${product.id}: ${product.vendor_name}`);
            logInfo(`  Status: ${product.status}`);
            logInfo(`  Workflow: ${product.workflow}`);
            logInfo(`  isValidated: ${product.isValidated}`);
        });
        
        if (result.totalProducts === testData.productIds.length) {
            logSuccess('✅ Tous les produits sont correctement liés');
        } else {
            logError('❌ Nombre de produits liés incorrect');
        }
        
    } catch (error) {
        logError('Impossible de récupérer les liens design-produits');
    }
}

async function testCleanup() {
    logSection('NETTOYAGE DES DONNÉES DE TEST');
    
    // Supprimer les produits de test
    for (const productId of testData.productIds) {
        try {
            await makeRequest('DELETE', `/api/vendor/products/${productId}`);
            logSuccess(`Produit ${productId} supprimé`);
        } catch (error) {
            logWarning(`Impossible de supprimer le produit ${productId}`);
        }
    }
    
    // Supprimer le design de test
    if (testData.designId) {
        try {
            await makeRequest('DELETE', `/api/designs/${testData.designId}`);
            logSuccess(`Design ${testData.designId} supprimé`);
        } catch (error) {
            logWarning(`Impossible de supprimer le design ${testData.designId}`);
        }
    }
}

async function runAllTests() {
    log('magenta', '🚀 DÉBUT DES TESTS CASCADE VALIDATION BACKEND');
    log('white', `API URL: ${API_BASE_URL}`);
    
    try {
        // Tests séquentiels
        const structureOk = await testDatabaseStructure();
        if (!structureOk) {
            logError('Structure base de données incorrecte - Arrêt des tests');
            return;
        }
        
        const designCreated = await testCreateDesign();
        if (!designCreated) {
            logError('Impossible de créer un design - Arrêt des tests');
            return;
        }
        
        const productsCreated = await testCreateProductsWithDesign();
        if (!productsCreated) {
            logError('Impossible de créer des produits - Arrêt des tests');
            return;
        }
        
        await testProductStatusBeforeValidation();
        
        const validationOk = await testDesignValidation();
        if (!validationOk) {
            logError('Validation design échouée - Arrêt des tests');
            return;
        }
        
        // Attendre un peu pour la propagation
        log('yellow', '⏳ Attente 2 secondes pour la propagation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testProductStatusAfterValidation();
        await testManualPublication();
        await testDesignProductLinks();
        
        logSection('RÉSUMÉ DES TESTS');
        logSuccess('🎉 Tests cascade validation terminés');
        logInfo('Vérifiez les logs ci-dessus pour les détails');
        
        // Nettoyage
        await testCleanup();
        
    } catch (error) {
        logError(`Erreur générale: ${error.message}`);
    }
}

// Exécution des tests
if (require.main === module) {
    runAllTests().catch(error => {
        logError(`Erreur fatale: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testData
}; 