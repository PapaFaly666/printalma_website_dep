// Test de création de produit avec le nouveau format FormData + productData
const axios = require('axios');

const testProductCreation = async () => {
    console.log('🔄 TEST - Création de produit avec FormData + productData\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // Test avec FormData comme dans ProductService
        console.log('📡 Test création produit avec FormData + productData...');
        
        // Simuler exactement ce que fait ProductService
        const productDataJson = {
            name: 'Test Product FormData Format',
            description: 'Test de création avec FormData + productData',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1
        };
        
        console.log('📄 ProductData à envoyer:', JSON.stringify(productDataJson, null, 2));
        
        // Test 1: Avec FormData minimal (sans images pour isoler le problème)
        console.log('\n--- Test 1: FormData minimal ---');
        const formData1 = new FormData();
        formData1.append('productData', JSON.stringify(productDataJson));
        
        try {
            const response1 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData1
            });
            
            const result1 = await response1.json();
            console.log('📊 Status:', response1.status);
            console.log('📄 Réponse:', JSON.stringify(result1, null, 2));
            
        } catch (error) {
            console.log('❌ Erreur Test 1:', error.message);
        }
        
        // Test 2: Avec colorVariations vides dans productData
        console.log('\n--- Test 2: ProductData avec colorVariations vides ---');
        const productDataWithColors = {
            ...productDataJson,
            colorVariations: []
        };
        
        const formData2 = new FormData();
        formData2.append('productData', JSON.stringify(productDataWithColors));
        
        try {
            const response2 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData2
            });
            
            const result2 = await response2.json();
            console.log('📊 Status:', response2.status);
            console.log('📄 Réponse:', JSON.stringify(result2, null, 2));
            
        } catch (error) {
            console.log('❌ Erreur Test 2:', error.message);
        }
        
        // Test 3: Debug - voir ce que le backend reçoit
        console.log('\n--- Test 3: Debug avec tous les champs ---');
        const fullProductData = {
            name: 'Test Product Full',
            description: 'Test complet',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1,
            colorVariations: [
                {
                    name: 'Rouge',
                    colorCode: '#FF0000',
                    images: []
                }
            ]
        };
        
        const formData3 = new FormData();
        formData3.append('productData', JSON.stringify(fullProductData));
        
        console.log('📄 Full ProductData:', JSON.stringify(fullProductData, null, 2));
        
        try {
            const response3 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData3
            });
            
            const result3 = await response3.json();
            console.log('📊 Status:', response3.status);
            console.log('📄 Réponse:', JSON.stringify(result3, null, 2));
            
        } catch (error) {
            console.log('❌ Erreur Test 3:', error.message);
        }
        
        console.log('\n🎯 CONCLUSIONS:');
        console.log('- Tester si le problème vient de colorVariations manquantes');
        console.log('- Vérifier le format exact attendu par le backend');
        console.log('- Identifier quel champ cause le .map() undefined');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
};

testProductCreation().catch(console.error); 