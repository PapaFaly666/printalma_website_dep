#!/usr/bin/env node

import axios from 'axios';

const testAPI = async () => {
  console.log('🧪 Test rapide de l\'API Best Sellers...\n');
  
  try {
    // Test 1: Endpoint principal
    console.log('1️⃣ Test de /api/best-sellers...');
    const response = await axios.get('http://localhost:3004/api/best-sellers?limit=3');
    
    if (response.status === 200) {
      console.log('✅ Status:', response.status);
      console.log('📊 Structure complète:', JSON.stringify(response.data, null, 2));
      
      const { success, data, message } = response.data;
      console.log('\n🔍 Analyse:');
      console.log('- Success:', success);
      console.log('- Message:', message);
      console.log('- Has data:', !!data);
      
      if (data) {
        console.log('- Data keys:', Object.keys(data));
        console.log('- BestSellers length:', data.bestSellers?.length || 0);
        console.log('- Has pagination:', !!data.pagination);
        console.log('- Has stats:', !!data.stats);
        
        if (data.bestSellers && data.bestSellers.length > 0) {
          console.log('\n🏆 Premier produit:');
          const product = data.bestSellers[0];
          console.log(JSON.stringify(product, null, 2));
        } else {
          console.log('\n⚠️ Aucun produit trouvé dans bestSellers');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testAPI(); 