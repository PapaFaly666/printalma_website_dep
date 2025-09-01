const fetch = require('node-fetch');

/**
 * Script de diagnostic - Produits Vendeur Désorganisés
 * Vérifie les données renvoyées par l'API pour identifier le problème
 */

const config = {
  baseUrl: 'http://localhost:3000', // Ajustez selon votre config
  // Remplacez par un vrai token vendeur
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
};

async function diagnosticProduitsVendeur() {
  console.log('\n🔍 DIAGNOSTIC - Produits Vendeur Désorganisés');
  console.log('================================================\n');

  try {
    // 1. Test de l'API produits vendeur
    console.log('📡 Test API: /api/vendor/products');
    
    const response = await fetch(`${config.baseUrl}/api/vendor/products`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    console.log(`✅ Réponse reçue: ${products.length} produits\n`);

    // 2. Analyse détaillée des données
    console.log('🔍 ANALYSE DÉTAILLÉE DES DONNÉES:');
    console.log('=====================================\n');

    const analysis = {
      totalProducts: products.length,
      productsWithColorVariations: 0,
      productsWithoutColorVariations: 0,
      problematicProducts: [],
      typeDistribution: {},
      colorVariationIssues: []
    };

    products.forEach((product, index) => {
      console.log(`\n📦 PRODUIT ${index + 1}:`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Nom: ${product.name}`);
      console.log(`   Type: ${product.type || 'NON DÉFINI ❌'}`);
      console.log(`   Image principale: ${product.imageUrl || 'AUCUNE ❌'}`);

      // Analyse du type
      const productType = product.type?.toLowerCase() || 'unknown';
      analysis.typeDistribution[productType] = (analysis.typeDistribution[productType] || 0) + 1;

      // Analyse des variations de couleur
      if (product.colorVariations && product.colorVariations.length > 0) {
        analysis.productsWithColorVariations++;
        console.log(`   Variations de couleur: ${product.colorVariations.length}`);

        product.colorVariations.forEach((variation, vIndex) => {
          console.log(`\n   🎨 VARIATION ${vIndex + 1}:`);
          console.log(`      ID: ${variation.id}`);
          console.log(`      Nom: ${variation.name}`);
          console.log(`      Code couleur: ${variation.colorCode || 'N/A'}`);
          
          if (variation.images && variation.images.length > 0) {
            console.log(`      Images: ${variation.images.length}`);
            variation.images.forEach((image, imgIndex) => {
              console.log(`         ${imgIndex + 1}. ${image.url}`);
              
              // 🚨 VÉRIFICATION CRITIQUE: Correspondance type-image
              const imageUrl = image.url.toLowerCase();
              const expectedType = productType;
              
              let isCorrect = false;
              if (expectedType === 'tshirt' && imageUrl.includes('tshirt')) isCorrect = true;
              if (expectedType === 'casquette' && imageUrl.includes('casquette')) isCorrect = true;
              if (expectedType === 'mug' && imageUrl.includes('mug')) isCorrect = true;
              if (expectedType === 'sac' && imageUrl.includes('sac')) isCorrect = true;

              if (!isCorrect && expectedType !== 'unknown') {
                const issue = {
                  productId: product.id,
                  productName: product.name,
                  productType: expectedType,
                  variationName: variation.name,
                  imageUrl: image.url,
                  issue: `Image ne correspond pas au type "${expectedType}"`
                };
                analysis.colorVariationIssues.push(issue);
                analysis.problematicProducts.push(product.id);
                console.log(`         ❌ PROBLÈME: Image ne correspond pas au type "${expectedType}"`);
              } else {
                console.log(`         ✅ OK: Image correspond au type`);
              }
            });
          } else {
            console.log(`      ❌ Images: AUCUNE`);
          }
        });
      } else {
        analysis.productsWithoutColorVariations++;
        console.log(`   ❌ Variations de couleur: AUCUNE`);
      }

      console.log(`   ${'─'.repeat(50)}`);
    });

    // 3. Résumé de l'analyse
    console.log('\n\n📊 RÉSUMÉ DE L\'ANALYSE:');
    console.log('========================\n');

    console.log(`📦 Total produits: ${analysis.totalProducts}`);
    console.log(`✅ Avec variations de couleur: ${analysis.productsWithColorVariations}`);
    console.log(`❌ Sans variations de couleur: ${analysis.productsWithoutColorVariations}`);
    console.log(`🚨 Produits problématiques: ${[...new Set(analysis.problematicProducts)].length}`);

    console.log('\n🏷️  Distribution par type:');
    Object.entries(analysis.typeDistribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} produit(s)`);
    });

    if (analysis.colorVariationIssues.length > 0) {
      console.log('\n🚨 PROBLÈMES DÉTECTÉS:');
      console.log('======================');
      analysis.colorVariationIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. Produit: ${issue.productName} (ID: ${issue.productId})`);
        console.log(`   Type attendu: ${issue.productType}`);
        console.log(`   Variation: ${issue.variationName}`);
        console.log(`   Image problématique: ${issue.imageUrl}`);
        console.log(`   Problème: ${issue.issue}`);
      });

      console.log('\n\n🔧 ACTIONS RECOMMANDÉES:');
      console.log('=========================');
      console.log('1. Vérifiez la génération d\'images dans le backend');
      console.log('2. Contrôlez les associations produit -> variations -> images en base');
      console.log('3. Utilisez les requêtes SQL du fichier BACKEND_PROMPT_FIX_PRODUITS_DESORDONNES.md');
      console.log('4. Corrigez les URLs d\'images incorrectes');
    } else {
      console.log('\n✅ AUCUN PROBLÈME DÉTECTÉ dans les correspondances type-image');
      console.log('   Le problème pourrait être ailleurs (frontend, cache, etc.)');
    }

    // 4. Test spécifique pour le frontend
    console.log('\n\n🖥️  TEST FRONTEND:');
    console.log('==================');
    console.log('Dans la console du navigateur sur /vendeur/products, exécutez:');
    console.log(`
products.forEach(p => {
  console.log(\`\${p.name} (\${p.type})\`);
  if (p.colorVariations?.length > 0) {
    const firstVariation = p.colorVariations[0];
    const firstImage = firstVariation.images?.[0]?.url;
    console.log(\`  Première variation: \${firstVariation.name}\`);
    console.log(\`  Première image: \${firstImage}\`);
    console.log(\`  Correspondance OK: \${firstImage?.toLowerCase().includes(p.type?.toLowerCase())}\`);
  }
  console.log('---');
});
    `);

  } catch (error) {
    console.error('\n❌ ERREUR lors du diagnostic:', error.message);
    
    if (error.message.includes('API Error: 401')) {
      console.log('\n🔑 Problème d\'authentification:');
      console.log('   - Vérifiez le token dans la variable config.token');
      console.log('   - Connectez-vous en tant que vendeur et récupérez un token valide');
    }
    
    if (error.message.includes('fetch')) {
      console.log('\n🌐 Problème de connexion:');
      console.log('   - Vérifiez que le backend est démarré');
      console.log('   - Vérifiez l\'URL dans config.baseUrl');
    }
  }
}

// Configuration pour test local
if (require.main === module) {
  console.log('⚠️  CONFIGURATION REQUISE:');
  console.log('   1. Modifiez config.baseUrl si nécessaire');
  console.log('   2. Remplacez config.token par un vrai token vendeur');
  console.log('   3. Assurez-vous que le backend est démarré\n');
  
  // Décommentez la ligne suivante quand la config est prête
  // diagnosticProduitsVendeur();
  
  console.log('💡 Pour lancer le diagnostic, décommentez la dernière ligne du script');
}

module.exports = { diagnosticProduitsVendeur }; 