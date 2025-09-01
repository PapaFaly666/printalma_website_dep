const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your_admin_token_here'; // Remplacez par un vrai token admin

async function testReadyProducts() {
  console.log('🧪 Test des endpoints Produits Prêts\n');

  try {
    // 1. Lister les produits prêts
    console.log('1. Test GET /products/ready');
    const listResponse = await fetch(`${BASE_URL}/products/ready`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Liste des produits prêts récupérée');
      console.log(`   Nombre de produits: ${listData.products?.length || 0}`);
    } else {
      console.log('❌ Erreur lors de la récupération de la liste');
      console.log(`   Status: ${listResponse.status}`);
    }

    // 2. Créer un produit prêt de test
    console.log('\n2. Test POST /products/ready');
    
    const testProductData = {
      name: "T-Shirt Premium Prêt Test",
      description: "Un t-shirt premium prêt à l'emploi pour les tests",
      price: 2500,
      stock: 50,
      status: "draft",
      categories: ["T-shirts", "Prêt-à-porter"],
      sizes: ["S", "M", "L", "XL"],
      colorVariations: [
        {
          name: "Blanc",
          colorCode: "#FFFFFF",
          images: [
            {
              fileId: "front_white_test",
              view: "Front"
            },
            {
              fileId: "back_white_test", 
              view: "Back"
            }
          ]
        }
      ]
    };

    const createResponse = await fetch(`${BASE_URL}/products/ready`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        productData: JSON.stringify(testProductData)
      }),
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Produit prêt créé avec succès');
      console.log(`   ID: ${createData.id}`);
      console.log(`   Nom: ${createData.name}`);
      
      const productId = createData.id;

      // 3. Récupérer le produit prêt spécifique
      console.log('\n3. Test GET /products/ready/:id');
      const getResponse = await fetch(`${BASE_URL}/products/ready/${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ Produit prêt récupéré');
        console.log(`   Nom: ${getData.name}`);
        console.log(`   Statut: ${getData.status}`);
        console.log(`   Variations de couleur: ${getData.colorVariations?.length || 0}`);
      } else {
        console.log('❌ Erreur lors de la récupération du produit');
        console.log(`   Status: ${getResponse.status}`);
      }

      // 4. Mettre à jour le produit prêt
      console.log('\n4. Test PATCH /products/ready/:id');
      const updateData = {
        name: "T-Shirt Premium Prêt Test - Mis à jour",
        description: "Description mise à jour pour les tests",
        price: 3000,
        stock: 75,
        status: "published"
      };

      const updateResponse = await fetch(`${BASE_URL}/products/ready/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        console.log('✅ Produit prêt mis à jour avec succès');
      } else {
        console.log('❌ Erreur lors de la mise à jour');
        console.log(`   Status: ${updateResponse.status}`);
      }

      // 5. Supprimer le produit prêt de test
      console.log('\n5. Test DELETE /products/ready/:id');
      const deleteResponse = await fetch(`${BASE_URL}/products/ready/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (deleteResponse.ok) {
        console.log('✅ Produit prêt supprimé avec succès');
      } else {
        console.log('❌ Erreur lors de la suppression');
        console.log(`   Status: ${deleteResponse.status}`);
      }

    } else {
      console.log('❌ Erreur lors de la création du produit prêt');
      console.log(`   Status: ${createResponse.status}`);
      const errorData = await createResponse.text();
      console.log(`   Erreur: ${errorData}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🏁 Test terminé');
}

// Test avec authentification par cookies (alternative)
async function testReadyProductsWithCookies() {
  console.log('\n🧪 Test avec authentification par cookies\n');

  try {
    // 1. Lister les produits prêts
    console.log('1. Test GET /products/ready (avec cookies)');
    const listResponse = await fetch(`${BASE_URL}/products/ready`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Liste des produits prêts récupérée (cookies)');
      console.log(`   Nombre de produits: ${listData.products?.length || 0}`);
    } else {
      console.log('❌ Erreur lors de la récupération de la liste (cookies)');
      console.log(`   Status: ${listResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale (cookies):', error.message);
  }
}

// Exécuter les tests
testReadyProducts();
testReadyProductsWithCookies(); 