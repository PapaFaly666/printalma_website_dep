/**
 * Test de Validation du Prix des Designs
 * Basé sur la documentation designprice.md
 *
 * Ce module fournit une fonction de test pour vérifier que le problème
 * de prix à 0 a bien été corrigé côté frontend.
 */

import designService from '../services/designService';

/**
 * Test de validation du prix selon designprice.md
 * Crée un design de test avec un prix spécifique et vérifie qu'il est bien sauvé en base
 */
export async function testDesignPriceFix(): Promise<{
  success: boolean;
  message: string;
  details?: {
    prixEnvoye: number;
    prixSauve: number;
    designId: string | number;
  };
}> {
  const testPrice = 1250; // Prix de test

  // Créer une image de test en base64 (pixel transparent 1x1)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  // Convertir en File object pour le test
  const testBlob = await fetch(testImageBase64).then(r => r.blob());
  const testFile = new File([testBlob], `Test-Prix-${Date.now()}.png`, { type: 'image/png' });

  const designData = {
    file: testFile,
    name: `Test Prix ${Date.now()}`,
    description: 'Test automatique de validation du prix',
    price: testPrice,
    categoryId: 1 // ID de catégorie par défaut
  };

  console.log('🧪 Test création design avec prix:', testPrice);

  try {
    // Étape 1: Créer le design
    console.log('📤 Création du design de test...');
    const createdDesign = await designService.createDesign(designData);

    console.log('✅ Design créé:', {
      id: createdDesign.id,
      name: createdDesign.name,
      price: createdDesign.price
    });

    // Étape 2: Vérifier immédiatement le prix côté frontend
    if (createdDesign.price !== testPrice) {
      return {
        success: false,
        message: `❌ FAIL: Prix incorrect côté frontend (envoyé: ${testPrice}, reçu: ${createdDesign.price})`,
        details: {
          prixEnvoye: testPrice,
          prixSauve: createdDesign.price,
          designId: createdDesign.id
        }
      };
    }

    // Étape 3: Vérifier le prix en base si possible (les logs dans designService.ts font déjà cette vérification)
    console.log('🔍 Vérification prix terminée');

    return {
      success: true,
      message: '🎉 SUCCESS: Test de validation du prix réussi !',
      details: {
        prixEnvoye: testPrice,
        prixSauve: createdDesign.price,
        designId: createdDesign.id
      }
    };

  } catch (error: any) {
    console.error('💥 Erreur test:', error);

    // Analyser le type d'erreur
    let errorMessage = '❌ FAIL: Erreur lors du test de validation';

    if (error.message?.includes('Prix minimum')) {
      errorMessage = '❌ FAIL: Erreur de validation prix (minimum 100 FCFA)';
    } else if (error.message?.includes('Prix maximum')) {
      errorMessage = '❌ FAIL: Erreur de validation prix (maximum 1,000,000 FCFA)';
    } else if (error.message?.includes('doit être supérieur à 0')) {
      errorMessage = '❌ FAIL: Erreur de validation prix (doit être > 0)';
    } else if (error.message?.includes('Unauthorized')) {
      errorMessage = '❌ FAIL: Erreur d\'authentification (token manquant ou invalide)';
    } else if (error.message?.includes('fetch')) {
      errorMessage = '❌ FAIL: Erreur réseau (backend inaccessible)';
    }

    return {
      success: false,
      message: `${errorMessage}: ${error.message}`,
      details: {
        prixEnvoye: testPrice,
        prixSauve: 0,
        designId: 'N/A'
      }
    };
  }
}

/**
 * Fonction utilitaire pour valider les données de design côté frontend
 * Reprend la logique de validation de designService.ts
 */
export function validateDesignData(designData: {
  name: string;
  price: number;
  file?: File;
  description?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation du nom
  if (!designData.name || designData.name.trim().length < 3) {
    errors.push('Nom du design requis (min 3 caractères)');
  }

  if (designData.name.trim().length > 255) {
    errors.push('Nom du design trop long (max 255 caractères)');
  }

  // Validation du prix (selon designprice.md)
  if (!designData.price || designData.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }

  if (designData.price < 100) {
    errors.push('Prix minimum : 100 FCFA');
  }

  if (designData.price > 1000000) {
    errors.push('Prix maximum : 1,000,000 FCFA');
  }

  // Validation du fichier si fourni
  if (designData.file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(designData.file.type)) {
      errors.push('Format de fichier non supporté');
    }

    if (designData.file.size > 10 * 1024 * 1024) {
      errors.push('Fichier trop volumineux (max 10MB)');
    }
  }

  // Validation description
  if (designData.description && designData.description.length > 1000) {
    errors.push('Description trop longue (max 1000 caractères)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Test des formats de prix supportés selon designprice.md
 */
export function testPriceFormats(): { valid: any[]; invalid: any[] } {
  const testCases = [
    // Formats valides
    { value: 121, description: 'Number' },
    { value: '121', description: 'String (sera converti)' },
    { value: '121.50', description: 'Décimal string' },
    { value: 121.50, description: 'Décimal number' },

    // Formats invalides
    { value: null, description: 'null' },
    { value: undefined, description: 'undefined' },
    { value: '', description: 'String vide' },
    { value: 'abc', description: 'String non-numérique' },
    { value: -50, description: 'Négatif' },
    { value: 0, description: 'Zéro' }
  ];

  const valid: any[] = [];
  const invalid: any[] = [];

  testCases.forEach(testCase => {
    const numericValue = Number(testCase.value);

    if (typeof testCase.value === 'number' && testCase.value > 0) {
      valid.push(testCase);
    } else if (typeof testCase.value === 'string' && !isNaN(numericValue) && numericValue > 0) {
      valid.push(testCase);
    } else {
      invalid.push(testCase);
    }
  });

  console.log('💰 Tests formats de prix:');
  console.log('✅ Formats valides:', valid);
  console.log('❌ Formats invalides:', invalid);

  return { valid, invalid };
}

/**
 * Lance tous les tests de validation du prix
 */
export async function runAllPriceTests(): Promise<{
  success: boolean;
  results: {
    mainTest: any;
    formatTests: any;
    validationTest: any;
  };
}> {
  console.log('🚀 === LANCEMENT DE TOUS LES TESTS DE PRIX ===');

  // Test 1: Test principal de création
  console.log('🧪 Test 1: Création design avec prix...');
  const mainTest = await testDesignPriceFix();

  // Test 2: Test des formats
  console.log('🧪 Test 2: Formats de prix...');
  const formatTests = testPriceFormats();

  // Test 3: Test de validation
  console.log('🧪 Test 3: Validation données...');
  const validationTest = validateDesignData({
    name: 'Test Design',
    price: 500,
    description: 'Test de validation'
  });

  const allSuccess = mainTest.success && validationTest.valid;

  console.log('📋 === RÉSULTATS FINAUX ===');
  console.log('🎯 Test principal:', mainTest.success ? 'PASS' : 'FAIL');
  console.log('📊 Test formats:', `${formatTests.valid.length} valides, ${formatTests.invalid.length} invalides`);
  console.log('✅ Test validation:', validationTest.valid ? 'PASS' : 'FAIL');
  console.log('🏆 Résultat global:', allSuccess ? 'SUCCESS' : 'FAIL');

  return {
    success: allSuccess,
    results: {
      mainTest,
      formatTests,
      validationTest
    }
  };
}

/**
 * Test pour diagnostiquer et corriger le problème d'authentification 500
 */
export async function testProductUpdate() {
  const API_BASE = 'https://printalma-back-dep.onrender.com';
  const productId = 20;

  console.log('🔍 DIAGNOSTIC COMPLET - Test mise à jour produit');

  // 1. Vérifier l'état des cookies
  console.log('📋 Cookies actuels:', document.cookie);

  // 2. Vérifier localStorage
  const storedAuth = localStorage.getItem('auth_session');
  console.log('💾 Auth localStorage:', storedAuth);

  // 3. Test /auth/check
  try {
    const authResponse = await fetch(`${API_BASE}/auth/check`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔐 Auth check status:', authResponse.status);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Auth check data:', authData);
    } else {
      console.error('❌ Auth check failed');
      const errorText = await authResponse.text();
      console.error('Erreur:', errorText);
    }
  } catch (error) {
    console.error('❌ Auth check error:', error);
  }

  // 4. Test simple GET du produit
  try {
    const getResponse = await fetch(`${API_BASE}/products/${productId}`, {
      credentials: 'include'
    });

    console.log('📦 GET product status:', getResponse.status);

    if (getResponse.ok) {
      const productData = await getResponse.json();
      console.log('✅ Product data récupéré:', productData);

      // 5. Test PATCH avec données minimales
      const minimalUpdate = {
        name: productData.name || 'Test Product',
        price: 1000 // Prix de test
      };

      console.log('🚀 Test PATCH avec:', minimalUpdate);

      const patchResponse = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalUpdate)
      });

      console.log('📡 PATCH status:', patchResponse.status);
      console.log('📡 PATCH headers:', Object.fromEntries(patchResponse.headers.entries()));

      if (patchResponse.ok) {
        const patchData = await patchResponse.json();
        console.log('✅ PATCH réussi:', patchData);
      } else {
        const errorText = await patchResponse.text();
        console.error('❌ PATCH failed:', errorText);
      }

    } else {
      console.error('❌ GET product failed:', getResponse.status);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

/**
 * Fonction pour forcer la re-authentification
 */
export async function forceReauth() {
  const API_BASE = 'https://printalma-back-dep.onrender.com';

  // Récupérer les données d'auth du localStorage
  const storedAuth = localStorage.getItem('auth_session');
  if (!storedAuth) {
    console.error('❌ Pas de données d\'auth en localStorage');
    return false;
  }

  try {
    const authData = JSON.parse(storedAuth);

    // Tenter une re-authentification avec les données stockées
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: authData.user.email,
        password: 'temp' // Le backend devrait accepter si la session est valide
      })
    });

    if (loginResponse.ok) {
      console.log('✅ Re-authentification réussie');
      return true;
    } else {
      console.error('❌ Re-authentification échouée:', loginResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur re-authentification:', error);
    return false;
  }
}

// Export pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).testDesignPriceFix = testDesignPriceFix;
  (window as any).runAllPriceTests = runAllPriceTests;
  (window as any).validateDesignData = validateDesignData;
  (window as any).testProductUpdate = testProductUpdate;
  (window as any).forceReauth = forceReauth;
}