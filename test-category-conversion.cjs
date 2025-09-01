// Script de test pour vérifier la conversion nom de catégorie -> ID
const axios = require('axios');

const testCategoryConversion = async () => {
    console.log('🔄 TEST - Conversion nom de catégorie vers ID\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // 1. Récupérer les catégories depuis l'API
        console.log('📡 Récupération des catégories...');
        const response = await axios.get(`${API_URL}/categories`);
        const categories = response.data;
        
        console.log('✅ Catégories récupérées:');
        categories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Nom: "${cat.name}"`);
        });
        
        // 2. Fonction de conversion (reproduit la logique du hook)
        const getCategoryIdByName = (categoryName, availableCategories) => {
            const category = availableCategories.find(cat => cat.name === categoryName);
            if (!category) {
                console.warn(`⚠️ Catégorie "${categoryName}" non trouvée, utilisation ID par défaut`);
                return availableCategories.length > 0 ? availableCategories[0].id : 1;
            }
            return category.id;
        };
        
        // 3. Test de conversion avec différents noms
        console.log('\n🧪 Tests de conversion:');
        
        const testCases = [
            'T-shirts',    // Cas normal
            'Polos',       // Cas normal
            'Flyers',      // Cas normal
            'Inexistant',  // Cas d'erreur
            '',            // Cas d'erreur
            null           // Cas d'erreur
        ];
        
        testCases.forEach(testName => {
            try {
                const result = getCategoryIdByName(testName, categories);
                console.log(`  ✅ "${testName}" -> ID ${result}`);
            } catch (error) {
                console.log(`  ❌ "${testName}" -> Erreur: ${error.message}`);
            }
        });
        
        // 4. Simulation du payload API complet
        console.log('\n📋 Simulation du payload API:');
        
        const mockFormData = {
            name: 'Test Product',
            description: 'Description test',
            price: 100,
            stock: 10,
            status: 'draft',
            categories: ['T-shirts'], // Comme dans l'erreur originale
            categoryId: undefined     // Pas défini initialement
        };
        
        console.log('📄 FormData simulé:', {
            categories: mockFormData.categories,
            categoryId: mockFormData.categoryId
        });
        
        // Logique de conversion (reproduit le code du hook)
        let categoryId = mockFormData.categoryId;
        
        if (!categoryId && mockFormData.categories.length > 0) {
            categoryId = getCategoryIdByName(mockFormData.categories[0], categories);
            console.log(`🔄 Conversion: "${mockFormData.categories[0]}" -> ID ${categoryId}`);
        }
        
        if (!categoryId) {
            categoryId = categories.length > 0 ? categories[0].id : 1;
            console.log(`🔄 Fallback: ID ${categoryId}`);
        }
        
        console.log(`🎯 CategoryId final: ${categoryId} (type: ${typeof categoryId})`);
        
        // 5. Créer le payload API final
        const apiPayload = {
            name: mockFormData.name,
            description: mockFormData.description,
            price: mockFormData.price,
            stock: mockFormData.stock,
            status: mockFormData.status,
            categoryId: categoryId
        };
        
        console.log('\n✅ Payload API final:');
        Object.entries(apiPayload).forEach(([key, value]) => {
            console.log(`  ${key}: ${value} (${typeof value})`);
        });
        
        // 6. Validation finale
        if (categoryId && !isNaN(categoryId) && categoryId > 0) {
            console.log('\n🎉 SUCCESS: La conversion fonctionne correctement !');
            console.log(`   - categoryId valide: ${categoryId}`);
            console.log(`   - Type correct: ${typeof categoryId}`);
            console.log('   - L\'erreur "categoryId invalide" devrait être résolue');
        } else {
            console.log('\n❌ ÉCHEC: La conversion ne fonctionne pas');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
};

testCategoryConversion().catch(console.error); 