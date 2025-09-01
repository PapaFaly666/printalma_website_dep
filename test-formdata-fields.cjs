// Test avec champs FormData séparés au lieu de JSON productData
const testFormDataFields = async () => {
    console.log('🔄 TEST - Champs FormData séparés au lieu de JSON\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // Créer une image simple
        const createSimpleImage = () => {
            const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA';
            return Buffer.from(pngBase64, 'base64');
        };
        
        console.log('📡 Test 1: Champs FormData individuels...');
        
        // Créer FormData avec champs séparés (pas de JSON productData)
        const formData1 = new FormData();
        formData1.append('name', 'Test Product Champs Séparés');
        formData1.append('description', 'Test avec champs FormData individuels');
        formData1.append('price', '25');
        formData1.append('stock', '50');
        formData1.append('status', 'draft');
        formData1.append('categoryId', '1');
        
        // Ajouter image
        const imageBuffer1 = createSimpleImage();
        const imageBlob1 = new Blob([imageBuffer1], { type: 'image/png' });
        formData1.append('images', imageBlob1, 'test-fields.png');
        
        console.log('📄 Champs FormData individuels envoyés');
        
        try {
            const response1 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData1
            });
            
            const result1 = await response1.json();
            console.log('\n📊 Status:', response1.status);
            console.log('📄 Réponse:', JSON.stringify(result1, null, 2));
            
            if (response1.status === 200 || response1.status === 201) {
                console.log('\n🎉 SUCCÈS! Les champs FormData individuels fonctionnent!');
            }
            
        } catch (error) {
            console.log('❌ Erreur Test 1:', error.message);
        }
        
        console.log('\n--- Test 2: Comparaison avec JSON productData ---');
        
        // Test avec JSON productData comme avant
        const formData2 = new FormData();
        const productDataJson = {
            name: 'Test Product JSON',
            description: 'Test avec JSON productData',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1
        };
        
        formData2.append('productData', JSON.stringify(productDataJson));
        
        const imageBuffer2 = createSimpleImage();
        const imageBlob2 = new Blob([imageBuffer2], { type: 'image/png' });
        formData2.append('images', imageBlob2, 'test-json.png');
        
        console.log('📄 JSON productData:', JSON.stringify(productDataJson, null, 2));
        
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
        
        console.log('\n🎯 CONCLUSIONS:');
        console.log('- Si Test 1 fonctionne: le backend attend des champs FormData séparés');
        console.log('- Si Test 2 échoue: le backend ne peut pas parser le JSON productData');
        console.log('- Cela expliquerait l\'erreur .map() undefined');
        
        // Test 3: JSON productData avec arrays vides
        console.log('\n--- Test 3: JSON productData avec arrays vides ---');
        
        const formData3 = new FormData();
        const productDataWithArrays = {
            name: 'Test Product Avec Arrays',
            description: 'Test avec arrays vides pour éviter undefined',
            price: 25,
            stock: 50,
            status: 'draft',
            categoryId: 1,
            colors: [],
            sizes: [],
            colorVariations: []
        };
        
        formData3.append('productData', JSON.stringify(productDataWithArrays));
        
        const imageBuffer3 = createSimpleImage();
        const imageBlob3 = new Blob([imageBuffer3], { type: 'image/png' });
        formData3.append('images', imageBlob3, 'test-arrays.png');
        formData3.append('mainImageIndex', '0');
        
        console.log('📄 ProductData avec arrays:', JSON.stringify(productDataWithArrays, null, 2));
        
        try {
            const response3 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData3
            });
            
            const result3 = await response3.json();
            console.log('\n📊 Status:', response3.status);
            console.log('📄 Réponse:', JSON.stringify(result3, null, 2));
            
            if (response3.status === 200 || response3.status === 201) {
                console.log('\n🎉 SUCCÈS! Les arrays vides ont résolu le problème!');
                console.log('L\'erreur .map() undefined venait des champs array manquants');
            } else if (response3.status === 500) {
                console.log('\n❌ Toujours erreur 500 - autres champs manquants');
            }
            
        } catch (error) {
            console.log('❌ Erreur Test 3:', error.message);
        }
        
        // Test 4: Format ProductService final - champs FormData séparés + images
        console.log('\n--- Test 4: Format ProductService final (champs séparés) ---');
        
        const formData4 = new FormData();
        // Champs individuels comme dans ProductService
        formData4.append('name', 'Test Product Final');
        formData4.append('description', 'Format final ProductService avec champs séparés');
        formData4.append('price', '25');
        formData4.append('stock', '50');
        formData4.append('status', 'draft');
        formData4.append('categoryId', '1');
        
        // Image
        const imageBuffer4 = createSimpleImage();
        const imageBlob4 = new Blob([imageBuffer4], { type: 'image/png' });
        formData4.append('images', imageBlob4, 'test-final.png');
        formData4.append('mainImageIndex', '0');
        
        console.log('📄 Champs FormData séparés (comme ProductService):');
        console.log('  - name: Test Product Final');
        console.log('  - categoryId: 1');
        console.log('  - images: test-final.png');
        
        try {
            const response4 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData4
            });
            
            const result4 = await response4.json();
            console.log('\n📊 Status:', response4.status);
            console.log('📄 Réponse:', JSON.stringify(result4, null, 2));
            
            if (response4.status === 200 || response4.status === 201) {
                console.log('\n🎉 SUCCÈS TOTAL! Champs FormData séparés fonctionnent!');
                console.log('Cette solution devrait résoudre l\'erreur 500 dans l\'application');
            } else if (response4.status === 500) {
                console.log('\n❌ Encore erreur 500 - problème plus profond');
            }
            
        } catch (error) {
            console.log('❌ Erreur Test 4:', error.message);
        }
        
        // Test 5: Approche hybride - productData minimal + champs si nécessaire
        console.log('\n--- Test 5: Approche hybride ---');
        
        const formData5 = new FormData();
        
        // Ajouter productData minimal (requis par le backend)
        const minimalProductData = {
            name: 'Test Product Hybride',
            description: 'Approche hybride minimal',
            categoryId: 1
        };
        
        formData5.append('productData', JSON.stringify(minimalProductData));
        
        // Ajouter les autres champs comme FormData séparés si besoin
        formData5.append('price', '25');
        formData5.append('stock', '50');
        formData5.append('status', 'draft');
        
        // Image
        const imageBuffer5 = createSimpleImage();
        const imageBlob5 = new Blob([imageBuffer5], { type: 'image/png' });
        formData5.append('images', imageBlob5, 'test-hybride.png');
        formData5.append('mainImageIndex', '0');
        
        console.log('📄 Approche hybride:');
        console.log('  - productData JSON:', JSON.stringify(minimalProductData, null, 2));
        console.log('  - price FormData: 25');
        console.log('  - images: test-hybride.png');
        
        try {
            const response5 = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData5
            });
            
            const result5 = await response5.json();
            console.log('\n📊 Status:', response5.status);
            console.log('📄 Réponse:', JSON.stringify(result5, null, 2));
            
            if (response5.status === 200 || response5.status === 201) {
                console.log('\n🎉 SUCCÈS HYBRIDE! Cette approche fonctionne!');
            } else if (response5.status === 500) {
                console.log('\n❌ Encore erreur 500');
            } else {
                console.log('\n⚠️ Autre erreur:', response5.status);
            }
            
        } catch (error) {
            console.log('❌ Erreur Test 5:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
};

testFormDataFields().catch(console.error); 