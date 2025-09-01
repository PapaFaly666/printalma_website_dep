#!/usr/bin/env node

import axios from 'axios';

const testOptimizedAPI = async () => {
  console.log('🚀 Test du Système Optimisé des Meilleures Ventes\n');
  
  const baseUrl = 'http://localhost:3004/optimized-best-sellers';
  const fallbackUrl = 'http://localhost:3004/api/best-sellers';
  
  const tests = [
    {
      name: '🏆 Endpoint Principal Optimisé',
      url: `${baseUrl}?period=month&limit=5&sortBy=sales&sortOrder=desc`,
      fallback: `${fallbackUrl}?period=month&limit=5`
    },
    {
      name: '⚡ Statistiques Rapides',
      url: `${baseUrl}/quick-stats`,
      fallback: null
    },
    {
      name: '👤 Focus Vendeur (ID: 1)',
      url: `${baseUrl}/vendor/1?period=month&limit=3`,
      fallback: `${fallbackUrl}?vendorId=1&limit=3`
    },
    {
      name: '🔄 Rafraîchir Cache',
      url: `${baseUrl}/refresh-cache`,
      fallback: null
    }
  ];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log(`📡 URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(test.url);
      const duration = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`✅ Succès (${duration}ms)`);
        
        const data = response.data;
        console.log(`📊 Réponse:`, {
          success: data.success,
          hasData: !!data.data,
          dataType: Array.isArray(data.data) ? `Array(${data.data.length})` : typeof data.data,
          hasMeta: !!data.meta,
          executionTime: data.meta?.executionTime || 'N/A',
          dataSource: data.meta?.dataSource || 'N/A',
          cached: data.cacheInfo?.cached || false
        });
        
        // Afficher quelques détails spécifiques
        if (test.name.includes('Principal') && data.data && Array.isArray(data.data) && data.data.length > 0) {
          console.log(`🏆 Premier produit:`, {
            id: data.data[0].id,
            name: data.data[0].name,
            rank: data.data[0].rank,
            sales: data.data[0].totalQuantitySold,
            revenue: data.data[0].totalRevenue
          });
        }
        
        if (test.name.includes('Statistiques') && data.data) {
          console.log(`📈 Aperçu des stats:`, {
            periods: Object.keys(data.data),
            allTimeProducts: data.data.allTime?.totalProducts || 0,
            thisMonthRevenue: data.data.thisMonth?.totalRevenue || 0
          });
        }
        
      } else {
        console.log(`⚠️ Status inattendu: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      
      // Tentative de fallback si disponible
      if (test.fallback) {
        console.log(`🔄 Tentative de fallback vers: ${test.fallback}`);
        
        try {
          const fallbackResponse = await axios.get(test.fallback);
          if (fallbackResponse.status === 200) {
            console.log(`✅ Fallback réussi!`);
            console.log(`📊 Fallback data:`, {
              success: fallbackResponse.data.success,
              hasData: !!fallbackResponse.data.data,
              dataLength: fallbackResponse.data.data?.length || 0
            });
          }
        } catch (fallbackError) {
          console.log(`❌ Fallback échoué: ${fallbackError.message}`);
        }
      }
    }
  }
  
  // Test de performance comparative
  console.log('\n🏁 Test de Performance Comparative');
  
  const performanceTests = [
    { name: 'Optimisé', url: `${baseUrl}?limit=10` },
    { name: 'Normal', url: `${fallbackUrl}?limit=10` }
  ];
  
  for (const perfTest of performanceTests) {
    try {
      const times = [];
      
      // Faire 3 requêtes pour avoir une moyenne
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await axios.get(perfTest.url);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`⚡ ${perfTest.name}: ${avgTime.toFixed(0)}ms (moyenne de 3 requêtes)`);
      
    } catch (error) {
      console.log(`❌ ${perfTest.name}: Erreur - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Résumé du Test');
  console.log('- Le système optimisé devrait être plus rapide');
  console.log('- Les fallbacks garantissent la continuité de service');
  console.log('- Les métadonnées fournissent des informations de debug utiles');
  console.log('\n✨ Test terminé!');
};

testOptimizedAPI().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 