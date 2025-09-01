/**
 * 🧪 TEST - Réception Design par le Backend
 * 
 * Ce script teste si le backend arrive à récupérer le design
 * envoyé par le frontend dans le champ designUrl
 */

const API_BASE_URL = 'http://localhost:3004';

const testDesignReception = async (token) => {
  console.log('🧪 === TEST RÉCEPTION DESIGN BACKEND ===');
  
  // Design de test minimal (1x1 pixel transparent)
  const testDesign = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==';
  
  const testPayload = {
    baseProductId: 1,
    vendorName: 'Test Design Reception',
    vendorPrice: 25000,
    vendorDescription: 'Test pour vérifier la réception du design',
    vendorStock: 10,
    
    // ✅ DESIGN ORIGINAL - Ce que le backend doit récupérer
    designUrl: testDesign,
    
    // ✅ MOCKUPS avec design incorporé
    finalImagesBase64: {
      'blanc': testDesign,
      'noir': testDesign
    },
    
    selectedColors: [
      { id: 1, name: 'blanc', colorCode: '#FFFFFF' },
      { id: 2, name: 'noir', colorCode: '#000000' }
    ],
    selectedSizes: [
      { id: 1, sizeName: 'S' },
      { id: 2, sizeName: 'M' }
    ],
    basePriceAdmin: 15000,
    publishedAt: new Date().toISOString()
  };
  
  console.log('📦 Analyse payload envoyé:');
  console.log(`   - designUrl présent: ${!!testPayload.designUrl}`);
  console.log(`   - designUrl longueur: ${testPayload.designUrl.length} caractères`);
  console.log(`   - designUrl début: ${testPayload.designUrl.substring(0, 50)}...`);
  console.log(`   - designUrl est base64: ${testPayload.designUrl.startsWith('data:image/')}`);
  console.log(`   - finalImagesBase64 couleurs: ${Object.keys(testPayload.finalImagesBase64).join(', ')}`);
  console.log(`   - Taille totale payload: ${JSON.stringify(testPayload).length} caractères`);
  
  try {
    console.log('\n📡 Envoi requête au backend...');
    
    const response = await fetch(`${API_BASE_URL}/api/vendor/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log(`\n📡 Status: ${response.status}`);
    console.log('📦 Response:', JSON.stringify(result, null, 2));
    
    // Analyser la réponse
    if (response.ok) {
      console.log('\n✅ SUCCÈS: Requête acceptée par le backend');
      
      if (result.originalDesign && result.originalDesign.designUrl) {
        console.log('🎉 ✅ DESIGN REÇU ET TRAITÉ avec succès !');
        console.log(`   - Design URL: ${result.originalDesign.designUrl}`);
      } else {
        console.log('⚠️ Design reçu mais pas dans la réponse attendue');
      }
      
    } else {
      console.log('\n❌ ERREUR: Requête rejetée par le backend');
      
      // Diagnostics spécifiques
      if (response.status === 413) {
        console.log('🔧 PROBLÈME DÉTECTÉ: Payload trop volumineux');
        console.log('   SOLUTION: Augmenter les limites dans app.js:');
        console.log('   app.use(express.json({ limit: "50mb" }));');
        
      } else if (response.status === 400) {
        console.log('🔧 PROBLÈME DÉTECTÉ: Erreur de validation');
        
        if (result.message && result.message.includes('designUrl')) {
          console.log('   CAUSE: Le champ designUrl n\'est pas reçu correctement');
          console.log('   SOLUTION: Vérifier req.body.designUrl dans le controller');
        } else if (result.message && result.message.includes('finalImages')) {
          console.log('   CAUSE: Problème avec finalImagesBase64');
          console.log('   SOLUTION: Vérifier la validation DTO');
        }
        
      } else if (response.status === 401 || response.status === 403) {
        console.log('🔧 PROBLÈME DÉTECTÉ: Authentification');
        console.log('   SOLUTION: Vérifier le token fourni');
        
      } else if (response.status === 500) {
        console.log('🔧 PROBLÈME DÉTECTÉ: Erreur serveur interne');
        console.log('   SOLUTION: Vérifier les logs du serveur backend');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur de connexion:', error.message);
    console.log('🔧 VÉRIFICATIONS:');
    console.log('   - Le serveur backend est-il démarré ?');
    console.log('   - L\'URL est-elle correcte ?', API_BASE_URL);
    console.log('   - Le token est-il valide ?');
  }
};

// Usage
const token = process.argv[2];
if (token) {
  testDesignReception(token);
} else {
  console.log('❌ Token requis');
  console.log('Usage: node test-backend-design-reception.cjs <TOKEN>');
  console.log('');
  console.log('Exemple:');
  console.log('node test-backend-design-reception.cjs eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
} 