const bcrypt = require('bcrypt');

// 🎯 Configuration de l'utilisateur de test
const TEST_USER = {
  firstName: 'Test',
  lastName: 'Vendeur',
  email: 'test.vendeur@printalma.com',
  password: 'TestPassword123!', // Mot de passe différent pour les tests
  role: 'VENDEUR',
  vendeur_type: 'DESIGNER',
  status: true,
  must_change_password: false
};

async function createTestUser() {
  console.log('🚀 Création de l\'utilisateur de test pour les messages de sécurité...\n');

  try {
    // Hash du mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(TEST_USER.password, saltRounds);

    console.log('📧 Email de test:', TEST_USER.email);
    console.log('🔑 Mot de passe de test:', TEST_USER.password);
    console.log('🏷️ Rôle:', TEST_USER.role);
    console.log('🎨 Type de vendeur:', TEST_USER.vendeur_type);
    console.log('\n💾 Données SQL à insérer :\n');

    // Générer la requête SQL
    const sqlQuery = `
-- 🆕 Créer l'utilisateur de test pour les messages de sécurité
INSERT INTO "User" (
    "firstName", 
    "lastName", 
    "email", 
    "password", 
    "role", 
    "vendeur_type", 
    "status", 
    "must_change_password",
    "login_attempts",
    "locked_until",
    "created_at", 
    "updated_at"
) VALUES (
    '${TEST_USER.firstName}',
    '${TEST_USER.lastName}',
    '${TEST_USER.email}',
    '${hashedPassword}',
    '${TEST_USER.role}',
    '${TEST_USER.vendeur_type}',
    ${TEST_USER.status},
    ${TEST_USER.must_change_password},
    0,
    NULL,
    NOW(),
    NOW()
);

-- 🔍 Vérifier l'insertion
SELECT id, "firstName", "lastName", email, role, "vendeur_type", status, "must_change_password", "login_attempts"
FROM "User" 
WHERE email = '${TEST_USER.email}';
`;

    console.log(sqlQuery);

    console.log('\n📋 Instructions d\'utilisation :');
    console.log('1. Copiez la requête SQL ci-dessus');
    console.log('2. Exécutez-la dans votre base de données PostgreSQL');
    console.log('3. Utilisez ces identifiants pour tester :');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Mot de passe CORRECT: ${TEST_USER.password}`);
    console.log(`   Mot de passe INCORRECT: mauvais123 (pour tester les tentatives)`);

    console.log('\n🧪 Tests à effectuer :');
    console.log('1. Tentative 1-4: Messages avec tentatives restantes');
    console.log('2. Tentative 5: Message "Dernière tentative"');
    console.log('3. Tentative 6: Message de verrouillage');
    console.log('4. Tentatives suivantes: Messages avec temps restant');

    console.log('\n⚠️ Pour supprimer l\'utilisateur de test après les tests :');
    console.log(`DELETE FROM "User" WHERE email = '${TEST_USER.email}';`);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur de test:', error);
  }
}

// 🎯 Alternative: Créer via l'API (si vous avez un admin connecté)
function generateAPITestCall() {
  console.log('\n🔄 Alternative: Créer via l\'API admin\n');
  
  const curlCommand = `
curl -X POST http://localhost:3004/auth/admin/create-client \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -d '{
    "firstName": "${TEST_USER.firstName}",
    "lastName": "${TEST_USER.lastName}",
    "email": "${TEST_USER.email}",
    "password": "${TEST_USER.password}",
    "vendeur_type": "${TEST_USER.vendeur_type}"
  }'
`;

  console.log('📡 Commande cURL (remplacez YOUR_ADMIN_TOKEN):');
  console.log(curlCommand);
}

// Exécuter la fonction
createTestUser();
generateAPITestCall();

module.exports = { TEST_USER }; 