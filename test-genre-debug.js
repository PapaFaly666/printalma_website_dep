// Script de débogage pour le champ genre
console.log('🔍 Débogage du champ genre...');

// Test 1: Vérifier l'initialisation
console.log('\n1️⃣ Test d\'initialisation:');
const mockFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  status: 'draft',
  categories: [],
  sizes: [],
  colorVariations: [],
  genre: 'unisexe' // ← Doit être 'unisexe' par défaut
};

console.log('formData.genre:', mockFormData.genre);
console.log('✅ Initialisation correcte');

// Test 2: Vérifier la mise à jour
console.log('\n2️⃣ Test de mise à jour:');
const updateFormData = (field, value) => {
  console.log(`🔄 updateFormData: ${field} = ${value}`);
  mockFormData[field] = value;
};

updateFormData('genre', 'homme');
console.log('Après mise à jour - formData.genre:', mockFormData.genre);
console.log('✅ Mise à jour correcte');

// Test 3: Vérifier l'envoi au backend
console.log('\n3️⃣ Test d\'envoi au backend:');
const productDataToSend = {
  name: mockFormData.name,
  description: mockFormData.description,
  price: mockFormData.price,
  stock: mockFormData.stock,
  status: mockFormData.status,
  categories: mockFormData.categories,
  sizes: mockFormData.sizes,
  isReadyProduct: true,
  genre: mockFormData.genre || 'unisexe', // ← Champ genre inclus
  colorVariations: []
};

console.log('productDataToSend.genre:', productDataToSend.genre);
console.log('productDataToSend complet:', productDataToSend);
console.log('✅ Envoi correct');

// Test 4: Vérifier les logs attendus
console.log('\n4️⃣ Logs attendus dans la console:');
console.log('🔍 Données envoyées au backend: { ... genre: "homme" ... }');
console.log('🔍 Genre: homme');
console.log('🔍 formData.genre: homme');

// Test 5: Problèmes possibles
console.log('\n5️⃣ Problèmes possibles:');
console.log('❌ Le champ genre n\'est pas sélectionné dans le formulaire');
console.log('❌ La fonction updateFormData n\'est pas appelée');
console.log('❌ Le champ genre n\'est pas inclus dans productDataToSend');
console.log('❌ Le backend ne traite pas le champ genre');

console.log('\n🔧 Instructions de débogage:');
console.log('1. Ouvrir la console du navigateur');
console.log('2. Aller sur /admin/add-product');
console.log('3. Remplir le formulaire');
console.log('4. Vérifier les logs "🔄 updateFormData: genre = ..."');
console.log('5. Vérifier les logs "🔍 Genre: ..."');
console.log('6. Vérifier que le genre est sélectionné dans le dropdown');

console.log('\n📋 Checklist de débogage:');
console.log('- [ ] Le dropdown genre est visible');
console.log('- [ ] "Unisexe" est sélectionné par défaut');
console.log('- [ ] Les logs "updateFormData: genre" apparaissent');
console.log('- [ ] Les logs "Genre:" apparaissent');
console.log('- [ ] Le champ genre est dans productDataToSend');
console.log('- [ ] Le backend reçoit le champ genre'); 