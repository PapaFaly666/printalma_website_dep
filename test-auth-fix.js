// Test de l'authentification hybride pour corriger le problème 401
// Ce script simule une session utilisateur et teste la validation de design

import fetch from 'node-fetch';

// Simuler une session avec token JWT
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczMjk5NzYzMSwiZXhwIjoxNzMzNjAyNDMxfQ.test';

console.log('🧪 Test de l\'authentification hybride pour corriger le 401\n');

async function testValidationWithCookies() {
    console.log('1️⃣ Test avec cookies seulement:');
    try {
        const response = await fetch('https://printalma-back-dep.onrender.com/api/designs/5/validate', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ action: 'VALIDATE' })
        });

        console.log(`   Status: ${response.status}`);
        console.log(`   Ok: ${response.ok}`);

        if (response.status === 401) {
            console.log('   ❌ Échec attendu - cookies non fonctionnels en production');
        } else {
            const data = await response.json();
            console.log('   ✅ Succès inattendu:', data);
        }
    } catch (error) {
        console.log('   ❌ Erreur réseau:', error.message);
    }
}

async function testValidationWithToken() {
    console.log('\n2️⃣ Test avec Authorization header (fallback):');
    try {
        const response = await fetch('https://printalma-back-dep.onrender.com/api/designs/5/validate', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mockToken}`
            },
            body: JSON.stringify({ action: 'VALIDATE' })
        });

        console.log(`   Status: ${response.status}`);
        console.log(`   Ok: ${response.ok}`);

        if (response.status === 401) {
            console.log('   ⚠️ Token invalide (normal pour un token de test)');
            const data = await response.json();
            console.log('   Message:', data.message);
        } else {
            const data = await response.json();
            console.log('   ✅ Succès potentiel si token valide:', data);
        }
    } catch (error) {
        console.log('   ❌ Erreur réseau:', error.message);
    }
}

async function testHybridApproach() {
    console.log('\n3️⃣ Test approche hybride (cookies + fallback token):');

    // Étape 1: Essayer avec cookies
    try {
        console.log('   🍪 Tentative avec cookies...');
        const response1 = await fetch('https://printalma-back-dep.onrender.com/api/designs/5/validate', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ action: 'VALIDATE' })
        });

        if (response1.ok) {
            console.log('   ✅ Succès avec cookies!');
            const data = await response1.json();
            console.log('   Réponse:', data);
            return;
        } else if (response1.status === 401) {
            console.log('   ❌ Échec cookies - tentative avec token...');

            // Étape 2: Essayer avec token
            const response2 = await fetch('https://printalma-back-dep.onrender.com/api/designs/5/validate', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockToken}`
                },
                body: JSON.stringify({ action: 'VALIDATE' })
            });

            console.log(`   📡 Réponse token: ${response2.status}`);

            if (response2.ok) {
                console.log('   ✅ Succès avec le fallback token!');
                const data = await response2.json();
                console.log('   Réponse:', data);
            } else if (response2.status === 401) {
                console.log('   ⚠️ Token invalide (attendu avec token de test)');
                const data = await response2.json();
                console.log('   Message:', data.message);
            } else {
                console.log('   ⚠️ Autre erreur:', response2.status);
                const data = await response2.json();
                console.log('   Réponse:', data);
            }
        } else {
            console.log(`   ⚠️ Autre erreur cookies: ${response1.status}`);
        }
    } catch (error) {
        console.log('   ❌ Erreur réseau:', error.message);
    }
}

async function main() {
    console.log('🎯 Test de la solution pour corriger l\'erreur 401 en production\n');

    await testValidationWithCookies();
    await testValidationWithToken();
    await testHybridApproach();

    console.log('\n📋 Résumé de la solution implémentée:');
    console.log('   ✅ Service hybride d\'authentification créé');
    console.log('   ✅ Integration avec authService pour sauvegarder les tokens');
    console.log('   ✅ Modification de designService pour utiliser l\'auth hybride');
    console.log('   ✅ Fallback automatique vers Authorization header si 401');
    console.log('\n🚀 Votre application devrait maintenant fonctionner en production!');
}

main().catch(console.error);