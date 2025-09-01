/**
 * Test de validation - Correction format Cloudinary
 * Version CommonJS pour éviter les problèmes d'import
 */

const API_BASE_URL = 'http://localhost:3004';

// Données de test minimales
const testPayload = {
  baseProductId: 1,
  vendorName: "Test Produit Cloudinary",
  vendorPrice: 25000,
  vendorDescription: "Test correction format",
  vendorStock: 50,
  basePriceAdmin: 20000,
  selectedColors: [
    { id: 1, name: "Blanc", colorCode: "#FFFFFF" }
  ],
  selectedSizes: [
    { id: 1, sizeName: "M" }
  ],
  previewView: {
    viewType: "front",
    url: "https://example.com/preview.jpg"
  },
  finalImages: {
    colorImages: {
      "Blanc": {
        colorInfo: {
          id: 1,
          name: "Blanc",
          colorCode: "#FFFFFF"
        },
        imageUrl: "blob:test-url",
        imageKey: "blanc"
      }
    },
    statistics: {
      totalColorImages: 1,
      hasDefaultImage: false,
      availableColors: ["Blanc"],
      totalImagesGenerated: 1
    }
  },
  publishedAt: new Date().toISOString()
};

// Image de test simple (1x1 pixel blanc en base64)
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const finalImagesBase64 = {
  'blanc': testImageBase64,
  'design': testImageBase64  // Design original
};

/**
 * Test principal de publication
 */
async function testCloudinaryFormat() {
  console.log('🧪 === TEST CORRECTION FORMAT CLOUDINARY ===');
  console.log('🎯 Objectif: Vérifier que l\'erreur "Invalid extension" est corrigée');
  console.log('🌐 Backend testé:', API_BASE_URL);
  console.log('');

  try {
    console.log('📡 Envoi de la requête de test...');
    
    // Import dynamique de fetch pour Node.js
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${API_BASE_URL}/vendor/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session'
      },
      body: JSON.stringify({
        ...testPayload,
        finalImagesBase64
      })
    });

    console.log('📊 Status:', response.status, response.statusText);

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCÈS - Aucune erreur de format détectée !');
      console.log('📄 Réponse:', JSON.stringify(result, null, 2));
      
      return true;
    } else {
      console.log('❌ ÉCHEC - Erreur détectée:');
      console.log('📄 Détails:', JSON.stringify(result, null, 2));
      
      const errorMessage = result.message || result.error || 'Erreur inconnue';
      
      if (errorMessage.includes('Invalid extension in transformation: auto')) {
        console.log('🚨 ERREUR CONFIRMÉE: Le problème de format Cloudinary persiste');
        console.log('💡 Action requise: Appliquer la correction backend documentée');
        console.log('');
        console.log('🔧 SOLUTION IMMÉDIATE BACKEND:');
        console.log('   1. Ouvrir services/cloudinaryService.js');
        console.log('   2. Remplacer format: "auto" par format: "webp"');
        console.log('   3. Redémarrer le backend');
        console.log('');
      } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
        console.log('🔐 Erreur d\'authentification - Normal pour ce test');
      } else {
        console.log('🔍 Autre erreur détectée:', errorMessage);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Erreur réseau:', error.message);
    
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Le backend semble inaccessible');
      console.log('💡 Vérifiez que le serveur backend est démarré sur', API_BASE_URL);
      console.log('');
      console.log('🚀 Pour démarrer le backend:');
      console.log('   cd ../backend  # ou le dossier de votre backend');
      console.log('   npm start      # ou npm run dev');
    }
    
    return false;
  }
}

/**
 * Exécution principale
 */
async function main() {
  const startTime = Date.now();
  
  console.log('🚀 Démarrage du test de correction Cloudinary...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');
  
  const success = await testCloudinaryFormat();
  
  console.log('');
  console.log('📊 === RÉSUMÉ DU TEST ===');
  console.log('⏱️ Durée:', Date.now() - startTime, 'ms');
  console.log('🎯 Résultat:', success ? '✅ SUCCÈS' : '❌ ÉCHEC');
  
  if (!success) {
    console.log('');
    console.log('📋 === ACTIONS REQUISES ===');
    console.log('');
    console.log('🔧 Backend - Correction urgente:');
    console.log('   • Fichier: services/cloudinaryService.js');
    console.log('   • Changement: format: "auto" → format: "webp"');
    console.log('   • Redémarrage: npm restart ou pm2 restart');
    console.log('');
    console.log('📖 Documentation: BACKEND_CLOUDINARY_FORMAT_FIX.md');
    console.log('🧪 Re-test: node test-cloudinary-format-fix.cjs');
  }
  
  console.log('');
  console.log('🏁 Test terminé');
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCloudinaryFormat
}; 