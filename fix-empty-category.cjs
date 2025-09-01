// Script pour corriger la catégorie avec nom vide
const axios = require('axios');

const fixEmptyCategory = async () => {
    console.log('🔧 CORRECTION - Catégorie avec nom vide\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        // 1. Récupérer les catégories actuelles
        console.log('📡 Récupération des catégories actuelles...');
        const response = await axios.get(`${API_URL}/categories`);
        const categories = response.data;
        
        console.log(`📋 ${categories.length} catégories trouvées`);
        
        // 2. Identifier les catégories avec nom vide
        const emptyCategories = categories.filter(cat => !cat.name || cat.name.trim() === '');
        
        if (emptyCategories.length === 0) {
            console.log('✅ Aucune catégorie avec nom vide trouvée !');
            return;
        }
        
        console.log(`⚠️ ${emptyCategories.length} catégorie(s) avec nom vide trouvée(s):`);
        emptyCategories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Nom: "${cat.name}"`);
        });
        
        // 3. Proposer deux options
        console.log('\n🎯 OPTIONS DE CORRECTION:');
        console.log('1. Supprimer les catégories avec nom vide');
        console.log('2. Corriger avec un nom par défaut');
        
        // Option 1: Supprimer
        console.log('\n🗑️ OPTION 1 - Suppression:');
        for (const cat of emptyCategories) {
            try {
                console.log(`  🔄 Suppression de la catégorie ID ${cat.id}...`);
                await axios.delete(`${API_URL}/categories/${cat.id}`);
                console.log(`  ✅ Catégorie ID ${cat.id} supprimée avec succès`);
            } catch (error) {
                console.log(`  ❌ Erreur lors de la suppression de ID ${cat.id}:`, error.response?.data || error.message);
            }
        }
        
        // 4. Vérification finale
        console.log('\n🔍 VÉRIFICATION FINALE...');
        const finalResponse = await axios.get(`${API_URL}/categories`);
        const finalCategories = finalResponse.data;
        
        console.log(`📋 ${finalCategories.length} catégories après correction:`);
        finalCategories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Nom: "${cat.name}"`);
        });
        
        // Vérifier qu'il n'y a plus de catégories vides
        const stillEmpty = finalCategories.filter(cat => !cat.name || cat.name.trim() === '');
        
        if (stillEmpty.length === 0) {
            console.log('\n✅ SUCCÈS: Toutes les catégories ont maintenant des noms valides !');
        } else {
            console.log('\n⚠️ ATTENTION: Il reste des catégories avec nom vide');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.response?.data || error.message);
    }
};

// Si vous voulez exécuter une correction alternative (renommer au lieu de supprimer)
const fixEmptyCategoryWithRename = async () => {
    console.log('🔧 CORRECTION ALTERNATIVE - Renommer les catégories vides\n');
    
    const API_URL = 'http://localhost:3004';
    
    try {
        const response = await axios.get(`${API_URL}/categories`);
        const categories = response.data;
        
        const emptyCategories = categories.filter(cat => !cat.name || cat.name.trim() === '');
        
        if (emptyCategories.length === 0) {
            console.log('✅ Aucune catégorie avec nom vide trouvée !');
            return;
        }
        
        console.log('\n✏️ RENOMMAGE DES CATÉGORIES VIDES:');
        for (const cat of emptyCategories) {
            try {
                const newName = `Catégorie ${cat.id}`;
                console.log(`  🔄 Renommage de la catégorie ID ${cat.id} vers "${newName}"...`);
                
                await axios.put(`${API_URL}/categories/${cat.id}`, {
                    name: newName,
                    description: 'Catégorie corrigée automatiquement'
                });
                
                console.log(`  ✅ Catégorie ID ${cat.id} renommée avec succès`);
            } catch (error) {
                console.log(`  ❌ Erreur lors du renommage de ID ${cat.id}:`, error.response?.data || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.response?.data || error.message);
    }
};

// Exécution par défaut: suppression
console.log('🚀 Démarrage de la correction (suppression)...');
fixEmptyCategory().catch(console.error);

// Décommentez la ligne suivante pour utiliser le renommage à la place:
// fixEmptyCategoryWithRename().catch(console.error); 