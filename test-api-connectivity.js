#!/usr/bin/env node

/**
 * Script pour tester la connectivité API
 * Diagnostique les problèmes de connexion avec le backend
 */

const fetch = require('node-fetch');

console.log('🔍 Test de connectivité API');
console.log('============================');

const API_BASE = 'http://localhost:3004';
const ENDPOINTS = [
  '/themes/4',
  '/products',
  '/products?isReadyProduct=true',
  '/products?status=PUBLISHED'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Test de: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Réponse JSON:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('⚠️ Réponse non-JSON:', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error(`❌ Erreur pour ${endpoint}:`, error.message);
  }
}

async function testAllEndpoints() {
  console.log('🚀 Démarrage des tests...');
  
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n📋 Résumé des tests terminé');
}

// Exécuter les tests
testAllEndpoints().catch(console.error); 

/**
 * Script pour tester la connectivité API
 * Diagnostique les problèmes de connexion avec le backend
 */

const fetch = require('node-fetch');

console.log('🔍 Test de connectivité API');
console.log('============================');

const API_BASE = 'http://localhost:3004';
const ENDPOINTS = [
  '/themes/4',
  '/products',
  '/products?isReadyProduct=true',
  '/products?status=PUBLISHED'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Test de: ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Réponse JSON:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('⚠️ Réponse non-JSON:', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error(`❌ Erreur pour ${endpoint}:`, error.message);
  }
}

async function testAllEndpoints() {
  console.log('🚀 Démarrage des tests...');
  
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n📋 Résumé des tests terminé');
}

// Exécuter les tests
testAllEndpoints().catch(console.error); 
 
 
 
 
 