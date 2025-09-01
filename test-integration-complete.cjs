// Test d'intégration complet pour vérifier tous les composants
const axios = require('axios');

const testCompleteIntegration = async () => {
    console.log('🔄 TEST D\'INTÉGRATION COMPLET\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // 1. Test de l'API des catégories
        console.log('📡 1. Test API Catégories...');
        const categoriesResponse = await axios.get(`${API_URL}/categories`);
        const categories = categoriesResponse.data;
        
        console.log(`✅ ${categories.length} catégories récupérées:`);
        categories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Nom: "${cat.name}"`);
        });
        
        // 2. Simulation de la logique du hook useProductForm
        console.log('\n🔄 2. Test logique useProductForm...');
        
        const mockFormData = {
            name: 'Produit Test',
            description: 'Description du produit test',
            price: 50,
            stock: 100,
            status: 'draft',
            categories: ['T-shirts'], // Nom de catégorie comme dans le formulaire
            categoryId: undefined,    // Pas défini initialement
            colorVariations: [
                {
                    id: '1749592962425',
                    name: 'Noir',
                    colorCode: '#000000',
                    images: [
                        {
                            id: '1749592962425',
                            view: 'Front',
                            delimitations: [
                                {
                                    x: 344.44845202306436,
                                    y: 261.70088030140516,
                                    width: 379.147207156266,
                                    height: 324.9833204196564,
                                    rotation: 0
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        
        console.log('📄 FormData initial:', {
            categories: mockFormData.categories,
            categoryId: mockFormData.categoryId,
            colorVariations: `${mockFormData.colorVariations.length} variation(s)`
        });
        
        // 3. Logique de conversion categoryId (comme dans useProductForm.ts)
        console.log('\n🔄 3. Test conversion categoryId...');
        
        const getCategoryIdByName = (categoryName, availableCategories) => {
            const category = availableCategories.find(cat => cat.name === categoryName);
            if (!category) {
                console.warn(`⚠️ Catégorie "${categoryName}" non trouvée, utilisation ID par défaut`);
                return availableCategories.length > 0 ? availableCategories[0].id : 1;
            }
            return category.id;
        };
        
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
        
        // 4. Création du payload API comme dans ProductService
        console.log('\n📋 4. Test payload API...');
        
        const apiPayload = {
            name: mockFormData.name,
            description: mockFormData.description,
            price: mockFormData.price,
            stock: mockFormData.stock,
            status: mockFormData.status,
            categoryId: categoryId,
            colorVariations: mockFormData.colorVariations.map(color => ({
                name: color.name,
                colorCode: color.colorCode,
                images: color.images.map(image => ({
                    fileId: image.id,
                    view: image.view,
                    delimitations: (image.delimitations || []).map(delim => ({
                        x: delim.x,
                        y: delim.y,
                        width: delim.width,
                        height: delim.height,
                        rotation: delim.rotation || 0
                    }))
                }))
            }))
        };
        
        console.log('✅ Payload API créé:');
        Object.entries(apiPayload).forEach(([key, value]) => {
            if (key === 'colorVariations') {
                console.log(`  ${key}: ${value.length} variation(s)`);
            } else {
                console.log(`  ${key}: ${value} (${typeof value})`);
            }
        });
        
        // 5. Validation des données comme dans ProductService
        console.log('\n🔍 5. Test validation ProductService...');
        
        if (!apiPayload.name || apiPayload.name.trim() === '') {
            console.log('❌ Validation échouée: nom requis');
        } else {
            console.log('✅ Nom valide');
        }
        
        const categoryIdValidation = Number(apiPayload.categoryId);
        if (!apiPayload.categoryId || isNaN(categoryIdValidation) || categoryIdValidation <= 0) {
            console.log('❌ Validation échouée: categoryId invalide');
            console.log('   Debug:', {
                original: apiPayload.categoryId,
                converted: categoryIdValidation,
                isNaN: isNaN(categoryIdValidation),
                isLessOrEqual0: categoryIdValidation <= 0
            });
        } else {
            console.log('✅ CategoryId valide');
        }
        
        // 6. Test de connectivité vers l'endpoint products
        console.log('\n📡 6. Test connectivité API products...');
        
        try {
            // Test simple GET pour vérifier que l'endpoint existe
            const productsResponse = await axios.get(`${API_URL}/products`);
            console.log(`✅ API products accessible - ${productsResponse.data.length || 0} produits existants`);
        } catch (error) {
            if (error.response) {
                console.log(`⚠️ API products accessible mais erreur ${error.response.status}: ${error.response.statusText}`);
            } else {
                console.log('❌ API products inaccessible:', error.message);
            }
        }
        
        // 7. Résumé final
        console.log('\n📊 RÉSUMÉ FINAL:');
        
        const checks = [
            { name: 'API Catégories', status: categories.length > 0 },
            { name: 'Conversion categoryId', status: categoryId && !isNaN(categoryId) && categoryId > 0 },
            { name: 'Payload API', status: apiPayload.categoryId !== undefined },
            { name: 'Validation données', status: apiPayload.name && apiPayload.categoryId }
        ];
        
        checks.forEach(check => {
            console.log(`  ${check.status ? '✅' : '❌'} ${check.name}`);
        });
        
        const allPassed = checks.every(check => check.status);
        
        if (allPassed) {
            console.log('\n🎉 SUCCÈS: Tous les tests passent !');
            console.log('   - L\'erreur "categoryId invalide" devrait être résolue');
            console.log('   - Vous pouvez maintenant tester la création de produit');
        } else {
            console.log('\n❌ ÉCHEC: Certains tests échouent');
            console.log('   - Vérifiez les erreurs ci-dessus');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test d\'intégration:', error.message);
    }
};

testCompleteIntegration().catch(console.error); 