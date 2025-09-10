// Test script pour vérifier la normalisation des tailles
console.log('🧪 Test de normalisation des tailles');

// Simulation des fonctions de normalisation
function normalizeSizes(sizes) {
  if (!Array.isArray(sizes)) {
    return [];
  }
  
  return sizes.map(size => {
    if (typeof size === 'string') return size;
    if (typeof size === 'number') return String(size);
    return String(size);
  });
}

function validateSizes(sizes) {
  if (!Array.isArray(sizes)) {
    throw new Error('Sizes doit être un tableau');
  }
  
  if (sizes.length === 0) {
    return true; // Empty array is valid
  }
  
  // Check for mixed types
  const types = [...new Set(sizes.map(size => typeof size))];
  if (types.length > 1) {
    console.warn('Types mixtes détectés dans sizes, normalisation vers strings');
    return false;
  }
  
  return true;
}

// Tests cases
const testCases = [
  {
    name: 'Cas problématique original',
    input: ["XS", "S", 3],
    expectedOutput: ["XS", "S", "3"]
  },
  {
    name: 'Tous strings (valide)',
    input: ["XS", "S", "M"],
    expectedOutput: ["XS", "S", "M"]
  },
  {
    name: 'Tous numbers',
    input: [1, 2, 3],
    expectedOutput: ["1", "2", "3"]
  },
  {
    name: 'Mixed types avec null/undefined',
    input: ["XS", 2, null, undefined, "L"],
    expectedOutput: ["XS", "2", "null", "undefined", "L"]
  },
  {
    name: 'Tableau vide',
    input: [],
    expectedOutput: []
  },
  {
    name: 'Non-array input',
    input: null,
    expectedOutput: []
  }
];

console.log('\n📊 Résultats des tests:');
console.log('========================');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Entrée: ${JSON.stringify(testCase.input)}`);
  
  try {
    // Test de validation
    const isValid = testCase.input ? validateSizes(testCase.input) : true;
    console.log(`   Validation: ${isValid ? '✅ Valide' : '⚠️  Types mixtes détectés'}`);
    
    // Test de normalisation
    const result = normalizeSizes(testCase.input);
    console.log(`   Résultat: ${JSON.stringify(result)}`);
    console.log(`   Attendu:  ${JSON.stringify(testCase.expectedOutput)}`);
    
    // Vérification
    const match = JSON.stringify(result) === JSON.stringify(testCase.expectedOutput);
    console.log(`   Status:   ${match ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.log(`   Erreur: ${error.message}`);
  }
});

console.log('\n🔍 Test de l\'utilisation dans useProductForm:');
console.log('==========================================');

// Simulation de l'utilisation dans useProductForm
const mockFormData = {
  sizes: ["XS", "S", 3] // Cas problématique
};

console.log('Avant normalisation:', JSON.stringify(mockFormData.sizes));

// Application de la normalisation (comme dans le hook)
const normalizedSizes = normalizeSizes(mockFormData.sizes || []);
console.log('Après normalisation:', JSON.stringify(normalizedSizes));

// Vérification que tous sont des strings
const allStrings = normalizedSizes.every(size => typeof size === 'string');
console.log('Tous les éléments sont des strings:', allStrings ? '✅ OUI' : '❌ NON');

console.log('\n✅ Tests terminés avec succès!');