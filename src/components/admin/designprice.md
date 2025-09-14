# 🛠️ Fix Frontend - Problème Prix Design à 0

## ❌ Problème Identifié

Le prix des designs est toujours mis à 0 en base de données malgré que le frontend préserve correctement le prix (ex: 121 FCFA).

### Symptômes observés :
```
✅ Design créé via /vendor/designs !
designService.ts:1076 💰 Prix préservé côté frontend: 121
designService.ts:1077 ⚠️ Attention: Le backend peut avoir mis le prix à 0 en base
```

## 🔍 Cause Root

Le backend avait deux méthodes de création de design :
1. **Design principal** (`/designs`) - ✅ Gérait correctement le prix
2. **Vendor publish service** (`/vendor/designs`) - ❌ Prix hardcodé à 0

## ✅ Correction Appliquée Backend

Le backend a été corrigé pour accepter et utiliser le prix dans `vendor-publish.service.ts` :

```typescript
// Avant (❌)
price: 0,

// Après (✅)
price: designData.price || 0,
```

## 🚀 Action Frontend Requise

### 1. Vérifier l'envoi du prix

Assurez-vous que votre requête de création de design inclut bien le prix :

```javascript
// ✅ Exemple correct
const designData = {
  name: 'Mon Design',
  category: 'ILLUSTRATION',
  imageBase64: 'data:image/png;base64,iVBORw...',
  price: 121, // 🎯 IMPORTANT: Prix doit être inclus
  description: 'Description optionnelle',
  tags: ['tag1', 'tag2']
};

// Requête API
const response = await fetch('/api/vendor/designs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(designData)
});
```

### 2. Validation côté frontend

Ajoutez cette validation avant l'envoi :

```javascript
function validateDesignData(designData) {
  const errors = [];

  if (!designData.price || designData.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }

  if (designData.price < 100) {
    errors.push('Prix minimum : 100 FCFA');
  }

  if (designData.price > 1000000) {
    errors.push('Prix maximum : 1,000,000 FCFA');
  }

  return errors;
}

// Utilisation
const errors = validateDesignData(designData);
if (errors.length > 0) {
  console.error('❌ Erreurs validation:', errors);
  return;
}
```

### 3. Debug et logging

Ajoutez ces logs pour tracer le problème :

```javascript
// Avant envoi
console.log('📤 Données envoyées au backend:', {
  name: designData.name,
  price: designData.price,
  category: designData.category
});

// Après réponse
const result = await createDesign(designData);
console.log('📥 Réponse backend:', result);

// Vérification en base (si possible)
if (result.designId) {
  const verification = await fetch(`/api/designs/${result.designId}`);
  const design = await verification.json();
  console.log('🔍 Design en base:', {
    id: design.id,
    price: design.price,
    priceOk: design.price === designData.price
  });
}
```

## 🧪 Test de Validation

Pour tester que le fix fonctionne :

```javascript
async function testDesignPriceFix() {
  const testPrice = 1250; // Prix de test

  const designData = {
    name: `Test Prix ${Date.now()}`,
    category: 'ILLUSTRATION',
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    price: testPrice
  };

  console.log('🧪 Test création design avec prix:', testPrice);

  try {
    const response = await fetch('/api/vendor/designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(designData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Design créé:', result);

      // Vérifier le prix en base
      const checkResponse = await fetch(`/api/designs/${result.designId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const design = await checkResponse.json();

      if (design.price === testPrice) {
        console.log('🎉 SUCCESS: Prix correctement sauvé en base !');
      } else {
        console.error('❌ FAIL: Prix incorrect en base:', {
          envoyé: testPrice,
          sauvé: design.price
        });
      }
    } else {
      console.error('❌ Erreur création:', result);
    }
  } catch (error) {
    console.error('💥 Erreur test:', error);
  }
}

// Lancer le test
testDesignPriceFix();
```

## 🔧 Formats de Prix Supportés

Le backend accepte ces formats :

```javascript
// ✅ Formats valides
price: 121          // Number
price: "121"        // String (sera converti)
price: "121.50"     // Décimal string
price: 121.50       // Décimal number

// ❌ Formats invalides
price: null
price: undefined
price: ""
price: "abc"
price: -50          // Négatif
price: 0            // Zéro
```

## 📋 Checklist Frontend

- [ ] Le prix est bien inclus dans `designData`
- [ ] Le prix est un nombre > 0
- [ ] La validation côté frontend fonctionne
- [ ] Les logs montrent le prix envoyé
- [ ] Le test de validation passe
- [ ] Le prix est bien sauvé en base (≠ 0)

## 🆘 Dépannage

### Prix toujours à 0 ?

1. **Vérifier la requête réseau** (onglet Network)
2. **Vérifier le payload JSON** envoyé
3. **Tester avec le test de validation** ci-dessus
4. **Vérifier les logs backend** pour voir si le prix arrive

### Erreur de validation ?

```
"Le prix minimum est de 100 FCFA"
```
→ Assurez-vous que `price >= 100`

### Token d'authentification ?

```
"Unauthorized"
```
→ Vérifiez que le token Bearer est bien envoyé

---

💡 **Note**: Après cette correction, tous les nouveaux designs créés via `/vendor/designs` préserveront correctement leur prix !