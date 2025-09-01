// Test simple d'authentification PrintAlma
// Lancer avec: node simple-auth-test.js

const API_BASE = 'https://printalma-back-dep.onrender.com';

async function testLogin() {
    console.log('🔐 Test de connexion PrintAlma...');
    console.log(`URL: ${API_BASE}/auth/login`);
    
    try {
        // Test 1: Basique comme curl
        console.log('\n1️⃣ Test basique (comme curl)...');
        const basicResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'pfdiagne35@gmail.com',
                password: 'printalmatest123'
            })
        });

        console.log(`Status: ${basicResponse.status} ${basicResponse.statusText}`);
        
        if (basicResponse.ok) {
            const data = await basicResponse.json();
            console.log('✅ Connexion basique réussie!');
            console.log('Utilisateur:', data.user.firstName, data.user.lastName);
            console.log('Rôle:', data.user.role);
        } else {
            const errorText = await basicResponse.text();
            console.log('❌ Erreur:', errorText);
        }

        // Test 2: Avec credentials (comme l'app)
        console.log('\n2️⃣ Test avec credentials...');
        const credResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'pfdiagne35@gmail.com',
                password: 'printalmatest123'
            })
        });

        console.log(`Status: ${credResponse.status} ${credResponse.statusText}`);
        
        // Afficher les headers de réponse
        console.log('Headers de réponse:');
        for (let [key, value] of credResponse.headers.entries()) {
            if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('cookie') || key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        if (credResponse.ok) {
            const data = await credResponse.json();
            console.log('✅ Connexion avec credentials réussie!');
        } else {
            const errorText = await credResponse.text();
            console.log('❌ Erreur avec credentials:', errorText);
        }

    } catch (error) {
        console.log('❌ Erreur de connexion:', error.message);
        console.log('Type d\'erreur:', error.name);
        
        if (error.message.includes('fetch')) {
            console.log('🔍 Problème possible: CORS, DNS ou connectivité réseau');
        }
    }
}

// Test CORS préliminaire
async function testCors() {
    console.log('\n🌐 Test CORS...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'OPTIONS'
        });
        
        console.log(`OPTIONS Status: ${response.status}`);
        console.log('Headers CORS:');
        
        const corsHeaders = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Credentials'
        ];
        
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            console.log(`  ${header}: ${value || 'non défini'}`);
        });
        
    } catch (error) {
        console.log('❌ Erreur CORS:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Diagnostic d\'authentification PrintAlma');
    console.log('=====================================');
    
    await testCors();
    await testLogin();
    
    console.log('\n📋 Résumé:');
    console.log('- Si le test basique fonctionne mais pas avec credentials → problème CORS');
    console.log('- Si les deux échouent → problème de connectivité ou backend');
    console.log('- Vérifiez les headers Access-Control-Allow-Credentials et Allow-Origin');
}

runTests().catch(console.error);