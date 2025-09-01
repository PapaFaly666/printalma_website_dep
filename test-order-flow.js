// Script de test pour le flux de commande
// À exécuter dans la console du navigateur sur la page produit

console.log('🧪 Test du flux de commande...');

// Test 1: Ajout au panier
console.log('✅ Test 1: Ajout au panier');
console.log('- Aller sur une page produit');
console.log('- Sélectionner couleur et taille');
console.log('- Cliquer sur "Ajouter au panier"');
console.log('- Vérifier le toast de confirmation');

// Test 2: Achat immédiat
console.log('✅ Test 2: Achat immédiat');
console.log('- Aller sur une page produit');
console.log('- Sélectionner couleur et taille');
console.log('- Cliquer sur "Acheter maintenant"');
console.log('- Vérifier la redirection vers la page de commande');

// Test 3: Processus de commande
console.log('✅ Test 3: Processus de commande');
console.log('- Remplir les informations de livraison');
console.log('- Choisir le mode de paiement');
console.log('- Confirmer la commande');
console.log('- Vérifier la création de commande simulée');

// Test 4: Page Mes Commandes
console.log('✅ Test 4: Page Mes Commandes');
console.log('- Aller sur /my-orders');
console.log('- Vérifier l\'affichage de l\'état vide');

console.log('🎯 Instructions:');
console.log('1. Assurez-vous d\'être connecté');
console.log('2. Testez chaque étape manuellement');
console.log('3. Vérifiez les messages dans la console');
console.log('4. Vérifiez les toasts de notification');

// Fonction utilitaire pour tester l'ajout au panier
window.testAddToCart = function() {
  console.log('🛒 Test d\'ajout au panier...');
  
  // Simuler les données d'un produit
  const mockProduct = {
    id: 1,
    name: 'T-shirt Test',
    price: 15000,
    colors: [{ id: 1, name: 'Rouge', hexCode: '#ff0000' }],
    sizes: [{ id: 1, name: 'M' }],
    stock: 10
  };
  
  const mockCartItem = {
    productId: mockProduct.id,
    productName: mockProduct.name,
    selectedColor: mockProduct.colors[0],
    selectedSize: mockProduct.sizes[0],
    quantity: 1,
    unitPrice: mockProduct.price,
    totalPrice: mockProduct.price,
    productImage: '/test-image.jpg'
  };
  
  // Sauvegarder dans localStorage
  const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
  existingCart.push(mockCartItem);
  localStorage.setItem('cart', JSON.stringify(existingCart));
  
  console.log('✅ Article ajouté au panier test:', mockCartItem);
  console.log('📦 Panier actuel:', existingCart);
};

// Fonction utilitaire pour vider le panier
window.clearTestCart = function() {
  localStorage.removeItem('cart');
  console.log('🗑️ Panier vidé');
};

console.log('🔧 Fonctions disponibles:');
console.log('- testAddToCart() : Ajouter un produit test au panier');
console.log('- clearTestCart() : Vider le panier de test'); 