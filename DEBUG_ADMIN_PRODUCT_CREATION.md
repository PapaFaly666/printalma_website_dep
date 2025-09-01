# 🔍 Debug - Création Produit Admin

## 🚨 Problème identifié

Erreur 400 : **"At least one image file is required."**

## ✅ Étapes de diagnostic

### 1. Vérifier le token d'authentification

```javascript
// Dans la console du navigateur
const token = localStorage.getItem('access_token') || 
             sessionStorage.getItem('access_token') || 
             (window as any).adminToken || '';

console.log('Token:', token ? 'Présent' : 'Manquant');
console.log('Token (début):', token.substring(0, 20) + '...');
```

### 2. Vérifier les fichiers d'images

```javascript
// Dans la console du navigateur
const images = document.querySelectorAll('input[type="file"]');
console.log('Inputs fichiers:', images.length);

// Vérifier les images dans le state
const colorVariations = formData.colorVariations;
const files = colorVariations.flatMap(cv => cv.images).filter(img => img.file instanceof File);
console.log('Fichiers réels:', files.length);
console.log('Fichiers:', files.map(f => ({ name: f.file.name, size: f.file.size })));
```

### 3. Test manuel de l'API

```javascript
// Test manuel dans la console
const testFormData = new FormData();
const testProductData = {
  name: "Test Product",
  description: "Test Description", 
  price: 2500,
  stock: 100,
  status: "DRAFT",
  categories: [1],
  sizes: [1, 2],
  colorVariations: [
    {
      name: "Blanc",
      colorCode: "#FFFFFF",
      images: [
        {
          fileId: "test",
          view: "Front"
        }
      ]
    }
  ]
};

testFormData.append('productData', JSON.stringify(testProductData));

// Créer un fichier de test
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
testFormData.append('file_0', testFile);

// Envoyer la requête
fetch('http://localhost:3004/products/admin', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: testFormData
}).then(r => r.json()).then(console.log).catch(console.error);
```

## 🔧 Solutions possibles

### Solution 1 : Token manquant
```javascript
// Ajouter dans votre code de login
localStorage.setItem('access_token', token);
// ou
sessionStorage.setItem('access_token', token);
```

### Solution 2 : Fichiers non envoyés
```javascript
// Vérifier que les fichiers sont bien des objets File
if (image.file instanceof File) {
  formData.append(`file_${index}`, image.file);
} else {
  console.error('Fichier invalide:', image.file);
}
```

### Solution 3 : Structure FormData incorrecte
```javascript
// Structure correcte
const formData = new FormData();
formData.append('productData', JSON.stringify(productData));

// Ajouter les fichiers avec des noms cohérents
for (let i = 0; i < files.length; i++) {
  formData.append(`file_${i}`, files[i]);
}
```

## 📋 Checklist de vérification

- [ ] Token d'authentification présent
- [ ] Au moins un fichier d'image sélectionné
- [ ] Fichiers sont des objets File valides
- [ ] FormData contient productData et fichiers
- [ ] Headers corrects (sans Content-Type manuel)
- [ ] Backend accessible sur localhost:3004

## 🚨 Erreurs courantes

1. **Token manquant** → Vérifier localStorage/sessionStorage
2. **Fichiers non File** → Vérifier le type des objets
3. **FormData vide** → Vérifier l'ajout des fichiers
4. **Backend inaccessible** → Vérifier le serveur

## 🔍 Debug avancé

```javascript
// Debug complet
console.log('=== DEBUG COMPLET ===');
console.log('1. Token:', token ? 'OK' : 'MANQUANT');
console.log('2. Fichiers:', files.length);
console.log('3. FormData entries:');
for (let [key, value] of formData.entries()) {
  console.log(`   ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
}
console.log('=== FIN DEBUG ===');
```

## ✅ Test rapide

1. Ouvrir la console du navigateur
2. Exécuter le test manuel ci-dessus
3. Vérifier les logs de debug
4. Corriger selon les erreurs trouvées

---

**Note :** Le problème principal semble être que les fichiers d'images ne sont pas correctement stockés ou envoyés au backend. 