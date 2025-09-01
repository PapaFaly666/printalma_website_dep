// Script de test pour diagnostiquer le problème des catégories
const axios = require('axios');

const testCategories = async () => {
    console.log('🔍 Test de l\'API des catégories...\n');
    
    // Test avec HTTP
    try {
        console.log('📡 Test HTTP (http://localhost:3004/categories)...');
        const httpResponse = await axios.get('http://localhost:3004/categories');
        console.log('✅ HTTP fonctionne !');
        console.log('📄 Données reçues:', JSON.stringify(httpResponse.data, null, 2));
        
        // Analyser les catégories
        const categories = httpResponse.data;
        console.log('\n🔍 Analyse des catégories:');
        categories.forEach((cat, index) => {
            console.log(`  ${index + 1}. ID: ${cat.id}, Nom: "${cat.name}", Description: ${cat.description || 'null'}`);
            if (!cat.name || cat.name.trim() === '') {
                console.log(`     ⚠️  Catégorie avec nom vide détectée !`);
            }
        });
        
    } catch (error) {
        console.log('❌ HTTP échoué:', error.message);
    }
    
    // Test avec HTTPS
    try {
        console.log('\n📡 Test HTTPS (https://localhost:3004/categories)...');
        const httpsResponse = await axios.get('https://localhost:3004/categories', {
            httpsAgent: new (require('https')).Agent({
                rejectUnauthorized: false // Ignore les certificats auto-signés
            })
        });
        console.log('✅ HTTPS fonctionne !');
        console.log('📄 Données reçues:', JSON.stringify(httpsResponse.data, null, 2));
        
    } catch (error) {
        console.log('❌ HTTPS échoué:', error.message);
    }
    
    console.log('\n🎯 Recommandations:');
    console.log('- Vérifiez quelle URL fonctionne (HTTP ou HTTPS)');
    console.log('- Nettoyez la catégorie avec nom vide dans la base de données');
    console.log('- La validation côté frontend filtre déjà les catégories invalides');
};

testCategories().catch(console.error); 