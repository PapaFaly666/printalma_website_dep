// Script de test complet pour diagnostiquer le problème des catégories
const axios = require('axios');

const testCategoriesComplete = async () => {
    console.log('🔍 DIAGNOSTIC COMPLET - Problème des catégories\n');
    
    let workingURL = null;
    let categories = [];
    
    // 1. Test de connectivité API
    console.log('🌐 Test de connectivité API...');
    
    // Test HTTP
    try {
        console.log('  📡 Test HTTP (http://localhost:3004/categories)...');
        const httpResponse = await axios.get('http://localhost:3004/categories');
        console.log('  ✅ HTTP fonctionne !');
        workingURL = 'http://localhost:3004';
        categories = httpResponse.data;
    } catch (error) {
        console.log('  ❌ HTTP échoué:', error.message);
    }
    
    // Test HTTPS
    if (!workingURL) {
        try {
            console.log('  📡 Test HTTPS (https://localhost:3004/categories)...');
            const httpsResponse = await axios.get('https://localhost:3004/categories', {
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false
                })
            });
            console.log('  ✅ HTTPS fonctionne !');
            workingURL = 'https://localhost:3004';
            categories = httpsResponse.data;
        } catch (error) {
            console.log('  ❌ HTTPS échoué:', error.message);
        }
    }
    
    if (!workingURL) {
        console.log('❌ ERREUR CRITIQUE: Aucune URL ne fonctionne !');
        return;
    }
    
    console.log(`\n🎯 URL fonctionnelle détectée: ${workingURL}`);
    
    // 2. Analyse des données reçues
    console.log('\n📊 ANALYSE DES DONNÉES CATÉGORIES:');
    console.log('Raw data:', JSON.stringify(categories, null, 2));
    
    const validCategories = [];
    const invalidCategories = [];
    
    categories.forEach((cat, index) => {
        console.log(`\n  📋 Catégorie ${index + 1}:`);
        console.log(`     ID: ${cat.id} (Type: ${typeof cat.id})`);
        console.log(`     Nom: "${cat.name}" (Type: ${typeof cat.name}, Longueur: ${cat.name ? cat.name.length : 0})`);
        console.log(`     Description: ${cat.description} (Type: ${typeof cat.description})`);
        
        // Validation similaire à celle du frontend
        if (cat && typeof cat === 'object' && cat.id && cat.name && cat.name.trim().length > 0) {
            validCategories.push({
                id: Number(cat.id),
                name: String(cat.name).trim(),
                description: cat.description ? String(cat.description).trim() : undefined
            });
            console.log('     ✅ VALIDE');
        } else {
            invalidCategories.push(cat);
            console.log('     ❌ INVALIDE');
            
            // Diagnostics spécifiques
            if (!cat.id) console.log('       - ID manquant');
            if (!cat.name) console.log('       - Nom manquant');
            if (cat.name && cat.name.trim().length === 0) console.log('       - Nom vide');
        }
    });
    
    // 3. Résumé de validation
    console.log('\n📈 RÉSUMÉ DE VALIDATION:');
    console.log(`  Total catégories reçues: ${categories.length}`);
    console.log(`  Catégories valides: ${validCategories.length}`);
    console.log(`  Catégories invalides: ${invalidCategories.length}`);
    
    if (validCategories.length > 0) {
        console.log('\n✅ CATÉGORIES VALIDES:');
        validCategories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Nom: "${cat.name}"`);
        });
    }
    
    if (invalidCategories.length > 0) {
        console.log('\n❌ CATÉGORIES INVALIDES:');
        invalidCategories.forEach((cat, index) => {
            console.log(`  - Index ${index}: ${JSON.stringify(cat)}`);
        });
    }
    
    // 4. Test de simulation du contexte CategoryContext
    console.log('\n🔄 SIMULATION DU CONTEXTE CATEGORYCONTEXT:');
    
    const simulateContext = () => {
        // Simulation de la logique du CategoryContext
        if (validCategories.length === 0) {
            console.log('  ⚠️ Aucune catégorie valide, une catégorie par défaut sera créée');
            return [{
                id: 1,
                name: 'Catégorie par défaut',
                description: 'Catégorie créée automatiquement'
            }];
        }
        return validCategories;
    };
    
    const contextCategories = simulateContext();
    console.log('  📋 Catégories disponibles dans le contexte:');
    contextCategories.forEach(cat => {
        console.log(`    - ID: ${cat.id}, Nom: "${cat.name}"`);
    });
    
    // 5. Recommandations
    console.log('\n🎯 RECOMMANDATIONS:');
    
    if (workingURL === 'http://localhost:3004') {
        console.log('  1. ✅ L\'API fonctionne en HTTP - Vérifiez que src/services/api.ts utilise HTTP');
    } else {
        console.log('  1. ✅ L\'API fonctionne en HTTPS - Vérifiez que src/services/api.ts utilise HTTPS');
    }
    
    if (invalidCategories.length > 0) {
        console.log('  2. ⚠️  Nettoyez les catégories invalides dans la base de données:');
        invalidCategories.forEach((cat, index) => {
            if (cat.id && (!cat.name || cat.name.trim() === '')) {
                console.log(`    - Supprimer ou corriger la catégorie ID ${cat.id} (nom vide)`);
            }
        });
    }
    
    if (validCategories.length > 0) {
        console.log('  3. ✅ La validation côté frontend fonctionne correctement');
        console.log('  4. ✅ Le composant ProductCharacteristics devrait recevoir des catégories valides');
    }
    
    console.log('\n🔧 ACTIONS À EFFECTUER:');
    console.log('  1. Vérifiez l\'URL dans src/services/api.ts');
    console.log('  2. Si le problème persiste, vérifiez les logs de la console navigateur');
    console.log('  3. Assurez-vous que le CategoryProvider englobe bien ProductCharacteristics');
    
    console.log('\n✅ DIAGNOSTIC TERMINÉ');
};

testCategoriesComplete().catch(console.error); 