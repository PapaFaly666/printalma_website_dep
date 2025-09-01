/**
 * Test de validation - Correction format Cloudinary
 * 
 * Ce script teste que les URLs Cloudinary sont correctement générées
 * sans l'erreur "Invalid extension in transformation: auto"
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
  console.log('');

  try {
    console.log('📡 Envoi de la requête de test...');
    
    const response = await fetch(`${API_BASE_URL}/vendor/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session'  // Session de test
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
      
      // Vérifier les URLs générées
      if (result.imagesProcessed) {
        console.log('🖼️ Images traitées:', result.imagesProcessed);
        
        // Analyser les URLs pour détecter des problèmes
        const responseStr = JSON.stringify(result);
        if (responseStr.includes('.auto')) {
          console.log('⚠️ ATTENTION: URLs avec extension .auto détectées');
        } else {
          console.log('✅ URLs correctement formatées (pas d\'extension .auto)');
        }
      }
      
      return true;
    } else {
      console.log('❌ ÉCHEC - Erreur détectée:');
      console.log('📄 Détails:', JSON.stringify(result, null, 2));
      
      // Analyser le type d'erreur
      const errorMessage = result.message || result.error || 'Erreur inconnue';
      
      if (errorMessage.includes('Invalid extension in transformation: auto')) {
        console.log('🚨 ERREUR CONFIRMÉE: Le problème de format Cloudinary persiste');
        console.log('💡 Action requise: Appliquer la correction backend documentée');
      } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
        console.log('🔐 Erreur d\'authentification - Normal pour ce test');
      } else {
        console.log('🔍 Autre erreur détectée:', errorMessage);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Erreur réseau:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🌐 Le backend semble inaccessible');
      console.log('💡 Vérifiez que le serveur backend est démarré sur', API_BASE_URL);
    }
    
    return false;
  }
}

/**
 * Test de validation des URLs Cloudinary
 */
function validateCloudinaryUrls(urls) {
  console.log('🔍 Validation des URLs Cloudinary...');
  
  const issues = [];
  
  urls.forEach((url, index) => {
    console.log(`📎 URL ${index + 1}:`, url);
    
    // Vérifications
    if (url.includes('.auto')) {
      issues.push(`URL ${index + 1}: Extension .auto problématique`);
    }
    
    if (url.includes('f_auto.')) {
      issues.push(`URL ${index + 1}: Paramètre f_auto mal formaté`);
    }
    
    if (!url.includes('res.cloudinary.com')) {
      issues.push(`URL ${index + 1}: Ne semble pas être une URL Cloudinary valide`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ Toutes les URLs sont correctement formatées');
  } else {
    console.log('⚠️ Problèmes détectés:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return issues.length === 0;
}

/**
 * Affichage du guide de correction
 */
function showFixGuide() {
  console.log('');
  console.log('📋 === GUIDE DE CORRECTION ===');
  console.log('');
  console.log('🔧 Backend - Fichiers à modifier:');
  console.log('   • services/cloudinaryService.js');
  console.log('   • controllers/vendorController.js');
  console.log('');
  console.log('⚡ Correction rapide:');
  console.log('   • Remplacer format: "auto" par format: "webp"');
  console.log('   • OU corriger la syntaxe du paramètre f_auto');
  console.log('');
  console.log('🧪 Tests:');
  console.log('   • Redémarrer le backend après correction');
  console.log('   • Relancer ce script de test');
  console.log('   • Tester la publication depuis l\'interface');
  console.log('');
  console.log('📖 Documentation complète: BACKEND_CLOUDINARY_FORMAT_FIX.md');
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
    showFixGuide();
  }
  
  console.log('');
  console.log('🏁 Test terminé');
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCloudinaryFormat,
  validateCloudinaryUrls
}; 