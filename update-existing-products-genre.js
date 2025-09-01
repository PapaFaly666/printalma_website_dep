const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script pour mettre à jour les produits existants avec le champ genre
 * Basé sur le nom et la description du produit
 */
async function updateExistingProductsGenre() {
  console.log('🔄 Démarrage de la mise à jour des produits existants...');

  try {
    // Récupérer tous les produits sans genre
    const productsWithoutGenre = await prisma.product.findMany({
      where: { 
        genre: null,
        isDelete: false
      },
      select: {
        id: true,
        name: true,
        description: true,
        isReadyProduct: true
      }
    });

    console.log(`📊 ${productsWithoutGenre.length} produits trouvés sans genre`);

    let updatedCount = 0;
    let hommeCount = 0;
    let femmeCount = 0;
    let bebeCount = 0;
    let unisexeCount = 0;

    for (const product of productsWithoutGenre) {
      // Logique pour déterminer le genre basé sur le nom/description
      let genre = 'UNISEXE'; // Valeur par défaut
      
      const nameLower = product.name.toLowerCase();
      const descriptionLower = product.description?.toLowerCase() || '';
      
      // Mots-clés pour identifier le genre
      const hommeKeywords = ['homme', 'masculin', 'gars', 'mec', 'monsieur'];
      const femmeKeywords = ['femme', 'féminin', 'fille', 'madame', 'dame'];
      const bebeKeywords = ['bébé', 'bebe', 'enfant', 'baby', 'kids', 'enfant'];
      
      // Vérifier les mots-clés dans le nom et la description
      const hasHommeKeyword = hommeKeywords.some(keyword => 
        nameLower.includes(keyword) || descriptionLower.includes(keyword)
      );
      
      const hasFemmeKeyword = femmeKeywords.some(keyword => 
        nameLower.includes(keyword) || descriptionLower.includes(keyword)
      );
      
      const hasBebeKeyword = bebeKeywords.some(keyword => 
        nameLower.includes(keyword) || descriptionLower.includes(keyword)
      );
      
      // Déterminer le genre
      if (hasHommeKeyword && !hasFemmeKeyword && !hasBebeKeyword) {
        genre = 'HOMME';
        hommeCount++;
      } else if (hasFemmeKeyword && !hasHommeKeyword && !hasBebeKeyword) {
        genre = 'FEMME';
        femmeCount++;
      } else if (hasBebeKeyword) {
        genre = 'BEBE';
        bebeCount++;
      } else {
        genre = 'UNISEXE';
        unisexeCount++;
      }
      
      // Mettre à jour le produit
      await prisma.product.update({
        where: { id: product.id },
        data: { genre }
      });
      
      updatedCount++;
      console.log(`✅ Produit ${product.id} mis à jour: ${product.name} -> ${genre}`);
    }

    console.log('\n📊 Résumé de la mise à jour:');
    console.log(`- Total mis à jour: ${updatedCount}`);
    console.log(`- HOMME: ${hommeCount}`);
    console.log(`- FEMME: ${femmeCount}`);
    console.log(`- BEBE: ${bebeCount}`);
    console.log(`- UNISEXE: ${unisexeCount}`);

    // Vérifier qu'il ne reste plus de produits sans genre
    const remainingProductsWithoutGenre = await prisma.product.count({
      where: { 
        genre: null,
        isDelete: false
      }
    });

    if (remainingProductsWithoutGenre === 0) {
      console.log('✅ Tous les produits ont maintenant un genre assigné!');
    } else {
      console.log(`⚠️ Il reste ${remainingProductsWithoutGenre} produits sans genre`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fonction pour afficher les statistiques des genres
 */
async function displayGenreStatistics() {
  console.log('📊 Statistiques des genres de produits...');

  try {
    const stats = await prisma.product.groupBy({
      by: ['genre'],
      where: { isDelete: false },
      _count: {
        id: true
      }
    });

    console.log('\n📈 Répartition par genre:');
    stats.forEach(stat => {
      console.log(`- ${stat.genre || 'NULL'}: ${stat._count.id} produits`);
    });

    // Statistiques pour les mockups uniquement
    const mockupStats = await prisma.product.groupBy({
      by: ['genre'],
      where: { 
        isReadyProduct: false,
        isDelete: false
      },
      _count: {
        id: true
      }
    });

    console.log('\n🎨 Répartition des mockups par genre:');
    mockupStats.forEach(stat => {
      console.log(`- ${stat.genre || 'NULL'}: ${stat._count.id} mockups`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage des statistiques:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fonction pour nettoyer les genres invalides
 */
async function cleanInvalidGenres() {
  console.log('🧹 Nettoyage des genres invalides...');

  try {
    // Récupérer tous les produits avec des genres invalides
    const productsWithInvalidGenre = await prisma.product.findMany({
      where: {
        genre: {
          notIn: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE']
        },
        isDelete: false
      },
      select: {
        id: true,
        name: true,
        genre: true
      }
    });

    console.log(`📊 ${productsWithInvalidGenre.length} produits avec des genres invalides trouvés`);

    let cleanedCount = 0;
    for (const product of productsWithInvalidGenre) {
      console.log(`🔄 Nettoyage produit ${product.id}: ${product.name} (genre: ${product.genre})`);
      
      await prisma.product.update({
        where: { id: product.id },
        data: { genre: 'UNISEXE' }
      });
      
      cleanedCount++;
    }

    console.log(`✅ ${cleanedCount} produits nettoyés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction principale
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'update':
      await updateExistingProductsGenre();
      break;
    case 'stats':
      await displayGenreStatistics();
      break;
    case 'clean':
      await cleanInvalidGenres();
      break;
    case 'all':
      console.log('🚀 Exécution de toutes les opérations...\n');
      await updateExistingProductsGenre();
      console.log('\n---\n');
      await displayGenreStatistics();
      console.log('\n---\n');
      await cleanInvalidGenres();
      break;
    default:
      console.log('Usage:');
      console.log('  node update-existing-products-genre.js update  # Mettre à jour les genres');
      console.log('  node update-existing-products-genre.js stats   # Afficher les statistiques');
      console.log('  node update-existing-products-genre.js clean   # Nettoyer les genres invalides');
      console.log('  node update-existing-products-genre.js all     # Exécuter toutes les opérations');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  updateExistingProductsGenre,
  displayGenreStatistics,
  cleanInvalidGenres,
  main
}; 