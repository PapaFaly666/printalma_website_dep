/**
 * Script de Test - Validation DTO colorImages Backend
 * Valide la structure exacte envoyée par le frontend
 */

const samplePayload = {
  "baseProductId": 287,
  "designUrl": "blob:http://localhost:5174/724d35be-8b22-459e-a45f-71740e10fbd3",
  "finalImages": {
    "colorImages": {
      "Blanc": {
        "colorInfo": {
          "id": 340,
          "name": "Blanc",
          "colorCode": "#e0e0dc"
        },
        "imageUrl": "blob:http://localhost:5174/7f82336b-517b-4b8e-b84e-16b492e2dcb9",
        "imageKey": "Blanc"
      },
      "Blue": {
        "colorInfo": {
          "id": 341,
          "name": "Blue",
          "colorCode": "#245d96"
        },
        "imageUrl": "blob:http://localhost:5174/f84bdcaf-e741-4a31-84bf-c87013783b2f",
        "imageKey": "Blue"
      },
      "Noir": {
        "colorInfo": {
          "id": 342,
          "name": "Noir",
          "colorCode": "#2c2c2c"
        },
        "imageUrl": "blob:http://localhost:5174/28d081da-ff64-49cc-ac72-e0769a953106",
        "imageKey": "Noir"
      },
      "Rouge": {
        "colorInfo": {
          "id": 343,
          "name": "Rouge",
          "colorCode": "#aa2424"
        },
        "imageUrl": "blob:http://localhost:5174/526da1a8-5f9d-4a81-96d0-d26fbb4f02d6",
        "imageKey": "Rouge"
      }
    },
    "statistics": {
      "totalColorImages": 4,
      "hasDefaultImage": false,
      "availableColors": ["Blanc", "Blue", "Noir", "Rouge"],
      "totalImagesGenerated": 4
    }
  },
  "finalImagesBase64": {
    "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
    "Blue": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
    "Noir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
    "Rouge": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
  },
  "vendorPrice": 25,
  "vendorName": "Tshirt prenium",
  "basePriceAdmin": 15,
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" }
  ],
  "selectedColors": [
    { "id": 340, "name": "Blanc", "colorCode": "#e0e0dc" },
    { "id": 341, "name": "Blue", "colorCode": "#245d96" }
  ],
  "previewView": {
    "viewType": "FRONT",
    "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1750412374/printalma/1750412373475-T-Shirt_Premium_Blanc.jpg",
    "id": 319
  },
  "publishedAt": "2024-01-20T10:30:45.123Z"
};

/**
 * Validation de la structure DTO
 */
function validateDTOStructure(payload) {
  console.log('🔍 === VALIDATION DTO STRUCTURE ===');
  
  const errors = [];
  
  // 1. Vérifier finalImages
  if (!payload.finalImages) {
    errors.push('finalImages manquant');
    return { isValid: false, errors };
  }
  
  // 2. Vérifier colorImages
  if (!payload.finalImages.colorImages) {
    errors.push('finalImages.colorImages manquant');
    return { isValid: false, errors };
  }
  
  const colorImages = payload.finalImages.colorImages;
  const colorKeys = Object.keys(colorImages);
  
  console.log('📋 Couleurs trouvées:', colorKeys);
  
  // 3. Vérifier chaque couleur
  colorKeys.forEach(colorName => {
    const colorEntry = colorImages[colorName];
    
    console.log(`\n🎨 Validation couleur: ${colorName}`);
    
    // Vérifier colorInfo
    if (!colorEntry.colorInfo) {
      errors.push(`${colorName}: colorInfo manquant`);
    } else {
      const { id, name, colorCode } = colorEntry.colorInfo;
      
      if (typeof id !== 'number') {
        errors.push(`${colorName}: colorInfo.id doit être un nombre`);
      }
      if (typeof name !== 'string') {
        errors.push(`${colorName}: colorInfo.name doit être une string`);
      }
      if (typeof colorCode !== 'string') {
        errors.push(`${colorName}: colorInfo.colorCode doit être une string`);
      }
      
      console.log(`   ✅ colorInfo: id=${id} (${typeof id}), name="${name}" (${typeof name}), colorCode="${colorCode}" (${typeof colorCode})`);
    }
    
    // Vérifier imageUrl (ERREUR ACTUELLE BACKEND)
    if (!colorEntry.imageUrl) {
      errors.push(`${colorName}: imageUrl manquant`);
    } else if (typeof colorEntry.imageUrl !== 'string') {
      errors.push(`${colorName}: imageUrl doit être une string`);
    } else {
      console.log(`   ✅ imageUrl: "${colorEntry.imageUrl.substring(0, 50)}..." (${typeof colorEntry.imageUrl})`);
    }
    
    // Vérifier imageKey (ERREUR ACTUELLE BACKEND)  
    if (!colorEntry.imageKey) {
      errors.push(`${colorName}: imageKey manquant`);
    } else if (typeof colorEntry.imageKey !== 'string') {
      errors.push(`${colorName}: imageKey doit être une string`);
    } else {
      console.log(`   ✅ imageKey: "${colorEntry.imageKey}" (${typeof colorEntry.imageKey})`);
    }
  });
  
  // 4. Vérifier statistics
  if (!payload.finalImages.statistics) {
    errors.push('finalImages.statistics manquant');
  } else {
    const stats = payload.finalImages.statistics;
    console.log('\n📊 Statistics validation:');
    console.log(`   totalColorImages: ${stats.totalColorImages} (${typeof stats.totalColorImages})`);
    console.log(`   hasDefaultImage: ${stats.hasDefaultImage} (${typeof stats.hasDefaultImage})`);
    console.log(`   availableColors: [${stats.availableColors.join(', ')}] (array of ${stats.availableColors.length})`);
    console.log(`   totalImagesGenerated: ${stats.totalImagesGenerated} (${typeof stats.totalImagesGenerated})`);
  }
  
  // 5. Vérifier correspondance avec finalImagesBase64
  if (payload.finalImagesBase64) {
    const base64Keys = Object.keys(payload.finalImagesBase64);
    console.log('\n🔗 Correspondance clés:');
    console.log(`   colorImages: [${colorKeys.join(', ')}]`);
    console.log(`   finalImagesBase64: [${base64Keys.join(', ')}]`);
    
    const match = colorKeys.every(key => base64Keys.includes(key)) && 
                  base64Keys.every(key => colorKeys.includes(key) || key === 'default');
    
    console.log(`   Correspondance: ${match ? '✅ PARFAITE' : '❌ INCORRECTE'}`);
    
    if (!match) {
      errors.push('Clés colorImages et finalImagesBase64 ne correspondent pas');
    }
  }
  
  const isValid = errors.length === 0;
  
  console.log(`\n🎯 RÉSULTAT: ${isValid ? '✅ STRUCTURE VALIDE' : '❌ ERREURS DÉTECTÉES'}`);
  
  if (!isValid) {
    console.log('\n❌ Erreurs trouvées:');
    errors.forEach(error => console.log(`   - ${error}`));
  }
  
  return { isValid, errors };
}

/**
 * Test de l'erreur actuelle backend
 */
function simulateBackendError() {
  console.log('\n🚨 === SIMULATION ERREUR BACKEND ACTUELLE ===');
  
  const colorImages = samplePayload.finalImages.colorImages;
  
  // Simulation de l'erreur backend actuelle
  console.log('❌ Backend cherche au mauvais niveau:');
  console.log(`   colorImages.imageUrl: ${colorImages.imageUrl || 'UNDEFINED'} (${typeof colorImages.imageUrl})`);
  console.log(`   colorImages.imageKey: ${colorImages.imageKey || 'UNDEFINED'} (${typeof colorImages.imageKey})`);
  
  console.log('\n✅ Données réelles (par couleur):');
  Object.keys(colorImages).forEach(colorName => {
    const colorEntry = colorImages[colorName];
    console.log(`   colorImages.${colorName}.imageUrl: "${colorEntry.imageUrl.substring(0, 40)}..." (${typeof colorEntry.imageUrl})`);
    console.log(`   colorImages.${colorName}.imageKey: "${colorEntry.imageKey}" (${typeof colorEntry.imageKey})`);
  });
}

/**
 * Test de la structure DTO corrigée
 */
function testCorrectedDTO() {
  console.log('\n✅ === TEST DTO CORRIGÉ ===');
  
  const payload = samplePayload;
  const colorImages = payload.finalImages.colorImages;
  
  console.log('Structure attendue par le DTO corrigé:');
  console.log('Record<string, ColorImageDto> où ColorImageDto contient:');
  console.log('- colorInfo: ColorInfoDto');
  console.log('- imageUrl: string');
  console.log('- imageKey: string');
  
  console.log('\nValidation sur données réelles:');
  Object.keys(colorImages).forEach(colorName => {
    const colorEntry = colorImages[colorName];
    
    const validColorInfo = colorEntry.colorInfo && 
                          typeof colorEntry.colorInfo.id === 'number' &&
                          typeof colorEntry.colorInfo.name === 'string' &&
                          typeof colorEntry.colorInfo.colorCode === 'string';
    
    const validImageUrl = typeof colorEntry.imageUrl === 'string';
    const validImageKey = typeof colorEntry.imageKey === 'string';
    
    console.log(`${colorName}:`);
    console.log(`   colorInfo: ${validColorInfo ? '✅' : '❌'}`);
    console.log(`   imageUrl: ${validImageUrl ? '✅' : '❌'} (${typeof colorEntry.imageUrl})`);
    console.log(`   imageKey: ${validImageKey ? '✅' : '❌'} (${typeof colorEntry.imageKey})`);
  });
}

// Exécution des tests
console.log('🚀 === TEST VALIDATION DTO COLORIMAGES ===\n');

// Test 1: Validation complète
const validation = validateDTOStructure(samplePayload);

// Test 2: Simulation erreur backend
simulateBackendError();

// Test 3: Test DTO corrigé
testCorrectedDTO();

console.log('\n📋 === RÉSUMÉ ===');
console.log(`Structure frontend: ${validation.isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
console.log('Problème backend: ❌ DTO cherche imageUrl/imageKey au niveau root');
console.log('Solution: ✅ DTO doit valider Record<string, ColorImageDto>');
console.log('\n🎯 Avec le DTO corrigé, la validation passera !');

module.exports = { validateDTOStructure, samplePayload }; 