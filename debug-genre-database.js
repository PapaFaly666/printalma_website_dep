// Script de débogage pour le problème du genre dans la base de données
console.log('🔍 Débogage du problème genre = UNISEXE dans la base de données...');

// Test 1: Vérifier l'interface utilisateur
console.log('\n1️⃣ Test de l\'interface utilisateur:');
console.log('Instructions:');
console.log('1. Aller sur /admin/add-product');
console.log('2. Remplir le formulaire');
console.log('3. Dans l\'étape "Informations", sélectionner "Homme" dans le dropdown genre');
console.log('4. Vérifier que "Homme" est bien sélectionné');
console.log('5. Continuer vers les étapes suivantes');
console.log('6. Dans l\'étape "Validation", vérifier que le badge affiche "Homme"');
console.log('7. Créer le produit');

// Test 2: Vérifier les logs frontend
console.log('\n2️⃣ Logs frontend attendus:');
console.log('🔄 updateFormData: genre = HOMME');
console.log('🔍 Genre sélectionné par l\'utilisateur: HOMME');
console.log('🔍 Genre qui sera envoyé: HOMME');
console.log('🔍 Vérification - genre est-il défini? true');
console.log('🔍 Vérification - genre est-il différent de UNISEXE? true');

// Test 3: Vérifier les logs backend
console.log('\n3️⃣ Logs backend attendus:');
console.log('🔍 [DEBUG] Données reçues: {');
console.log('  "name": "test produit",');
console.log('  "description": "description",');
console.log('  "price": 1000,');
console.log('  "stock": 0,');
console.log('  "status": "published",');
console.log('  "categories": ["Vêtements > T-shirts"],');
console.log('  "sizes": ["S", "M", "L"],');
console.log('  "genre": "HOMME", // ← CE CHAMP DOIT ÊTRE PRÉSENT ET CORRECT');
console.log('  "colorVariations": [...]');
console.log('}');

// Test 4: Problèmes possibles
console.log('\n4️⃣ Problèmes possibles:');

console.log('\n❌ Problème 1: Frontend n\'envoie pas le genre');
console.log('Symptôme: Les logs frontend montrent genre: "UNISEXE"');
console.log('Cause: L\'utilisateur n\'a pas sélectionné de genre ou le dropdown ne fonctionne pas');
console.log('Solution: Vérifier que le dropdown genre fonctionne correctement');

console.log('\n❌ Problème 2: Backend ne reçoit pas le genre');
console.log('Symptôme: Les logs backend ne montrent pas le champ "genre"');
console.log('Cause: Le champ genre n\'est pas inclus dans la requête');
console.log('Solution: Vérifier que le champ genre est bien dans productDataToSend');

console.log('\n❌ Problème 3: Backend reçoit le genre mais l\'ignore');
console.log('Symptôme: Les logs backend montrent genre: "HOMME" mais la DB a "UNISEXE"');
console.log('Cause: Le backend ne traite pas le champ genre ou a une logique par défaut');
console.log('Solution: Vérifier la logique du backend pour le champ genre');

console.log('\n❌ Problème 4: Base de données a une contrainte par défaut');
console.log('Symptôme: Le backend traite correctement mais la DB force "UNISEXE"');
console.log('Cause: Contrainte DEFAULT dans la base de données');
console.log('Solution: Vérifier le schéma de la base de données');

// Test 5: Instructions de débogage
console.log('\n5️⃣ Instructions de débogage étape par étape:');

console.log('\nÉtape 1: Vérifier le frontend');
console.log('1. Ouvrir la console du navigateur (F12)');
console.log('2. Aller sur /admin/add-product');
console.log('3. Sélectionner "Homme" dans le dropdown genre');
console.log('4. Vérifier les logs "🔄 updateFormData: genre = HOMME"');
console.log('5. Si pas de logs, le problème vient du dropdown');

console.log('\nÉtape 2: Vérifier l\'envoi');
console.log('1. Créer un produit avec genre "Homme"');
console.log('2. Vérifier les logs "🔍 Genre: HOMME"');
console.log('3. Si les logs montrent "UNISEXE", le problème vient de l\'envoi');

console.log('\nÉtape 3: Vérifier le backend');
console.log('1. Vérifier les logs du backend');
console.log('2. Chercher "🔍 [DEBUG] Données reçues"');
console.log('3. Vérifier que "genre": "HOMME" est présent');
console.log('4. Si absent, le problème vient de la transmission');

console.log('\nÉtape 4: Vérifier la base de données');
console.log('1. Vérifier le schéma de la table products');
console.log('2. Chercher une contrainte DEFAULT sur le champ genre');
console.log('3. Si contrainte DEFAULT = "UNISEXE", c\'est le problème');

// Test 6: Solutions
console.log('\n6️⃣ Solutions selon le problème:');

console.log('\nSi Problème 1 (Frontend):');
console.log('- Vérifier que le composant ProductFormFields fonctionne');
console.log('- Vérifier que onUpdate est bien appelé');
console.log('- Vérifier que formData.genre est mis à jour');

console.log('\nSi Problème 2 (Envoi):');
console.log('- Vérifier que productDataToSend inclut le genre');
console.log('- Vérifier que formData.genre a la bonne valeur');
console.log('- Vérifier que le fallback || "UNISEXE" ne s\'active pas');

console.log('\nSi Problème 3 (Backend):');
console.log('- Vérifier que le backend traite le champ genre');
console.log('- Vérifier qu\'il n\'y a pas de logique qui force "UNISEXE"');
console.log('- Vérifier que le DTO inclut le champ genre');

console.log('\nSi Problème 4 (Base de données):');
console.log('- Vérifier le schéma Prisma');
console.log('- Chercher @default("UNISEXE") sur le champ genre');
console.log('- Modifier le schéma si nécessaire');

console.log('\n🔧 Test rapide:');
console.log('1. Créer un produit avec genre "Homme"');
console.log('2. Vérifier les logs frontend et backend');
console.log('3. Vérifier la base de données');
console.log('4. Identifier où le genre devient "UNISEXE"'); 