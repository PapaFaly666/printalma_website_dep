// Test avec upload d'image pour reproduire l'erreur 500
const fs = require('fs');
const path = require('path');

const testImageUpload = async () => {
    console.log('🔄 TEST - Upload d\'image pour reproduire erreur 500\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // Créer une image simple (1x1 pixel PNG)
        const createSimpleImage = () => {
            // PNG 1x1 transparent en Base64
            const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA';
            return Buffer.from(pngBase64, 'base64');
        };
        
        console.log('📡 Test avec image et productData...');
        
        const productDataJson = {
            name: 'Test Product Avec Image',
            description: 'Test avec vraie image',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1
        };
        
        // Créer FormData avec image
        const formData = new FormData();
        formData.append('productData', JSON.stringify(productDataJson));
        
        // Ajouter une image simple
        const imageBuffer = createSimpleImage();
        const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('images', imageBlob, 'test-image.png');
        
        console.log('📄 ProductData:', JSON.stringify(productDataJson, null, 2));
        console.log('📸 Image ajoutée: test-image.png (1x1 PNG)');
        
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('\n📊 Status:', response.status);
            console.log('📄 Réponse:', JSON.stringify(result, null, 2));
            
            if (response.status === 500) {
                console.log('\n🎯 ERREUR 500 REPRODUCE !');
                console.log('Cela confirme que le problème vient du traitement des données côté backend');
            }
            
        } catch (error) {
            console.log('❌ Erreur:', error.message);
        }
        
        // Test 2: Avec colorVariations dans productData pour voir si ça cause le .map() undefined
        console.log('\n--- Test 2: Avec colorVariations explicites ---');
        
        const productDataWithColors = {
            name: 'Test Product Couleurs',
            description: 'Test avec colorVariations',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1,
            colorVariations: [
                {
                    name: 'Rouge',
                    colorCode: '#FF0000',
                    images: [
                        {
                            fileId: '123',
                            view: 'Front',
                            delimitations: []
                        }
                    ]
                }
            ]
        };
        
        const formData2 = new FormData();
        formData2.append('productData', JSON.stringify(productDataWithColors));
        
        const imageBuffer2 = createSimpleImage();
        const imageBlob2 = new Blob([imageBuffer2], { type: 'image/png' });
        formData2.append('images', imageBlob2, 'test-image-2.png');
        
        console.log('📄 ProductData avec couleurs:', JSON.stringify(productDataWithColors, null, 2));
        
        try {
            const response2 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData2
            });
            
            const result2 = await response2.json();
            console.log('\n📊 Status:', response2.status);
            console.log('📄 Réponse:', JSON.stringify(result2, null, 2));
            
        } catch (error) {
            console.log('❌ Erreur Test 2:', error.message);
        }
        
        console.log('\n🎯 ANALYSE:');
        console.log('- Test 1: ProductData simple + image -> voir si erreur 500');
        console.log('- Test 2: ProductData + colorVariations + image -> voir différence');
        console.log('- L\'erreur .map() undefined vient probablement d\'un champ manquant dans productData');
        
        // Test 3: Version simplifiée exactement comme ProductService maintenant
        console.log('\n--- Test 3: Version simplifiée (comme ProductService) ---');
        
        const simpleProductData = {
            name: 'Test Product Simple',
            description: 'Version simplifiée sans colorVariations',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1
            // PAS de colorVariations
        };
        
        const formData3 = new FormData();
        formData3.append('productData', JSON.stringify(simpleProductData));
        
        const imageBuffer3 = createSimpleImage();
        const imageBlob3 = new Blob([imageBuffer3], { type: 'image/png' });
        formData3.append('images', imageBlob3, 'test-simple.png');
        formData3.append('mainImageIndex', '0');
        
        console.log('📄 ProductData simplifié:', JSON.stringify(simpleProductData, null, 2));
        
        try {
            const response3 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData3
            });
            
            const result3 = await response3.json();
            console.log('\n📊 Status:', response3.status);
            console.log('📄 Réponse:', JSON.stringify(result3, null, 2));
            
            if (response3.status === 200 || response3.status === 201) {
                console.log('\n🎉 SUCCÈS! La version simplifiée fonctionne!');
                console.log('Le problème venait bien des colorVariations complexes');
            } else if (response3.status === 500) {
                console.log('\n❌ Toujours erreur 500 - le problème est ailleurs');
            }
            
        } catch (error) {
            console.log('❌ Erreur Test 3:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
};

testImageUpload().catch(console.error); 