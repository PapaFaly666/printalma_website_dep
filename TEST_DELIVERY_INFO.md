# 🧪 Guide de Test - Affichage Informations de Livraison

## 🎯 Objectif
Vérifier que les informations de livraison s'affichent correctement dans la page de détails de commande.

## 📋 Prérequis
- Serveur backend démarré sur `http://localhost:3004`
- Serveur frontend démarré avec `npm run dev`
- Accès admin au système
- Commande #347 disponible (ou toute commande avec deliveryInfo)

## 🔍 Test 1 : Navigation depuis la Liste des Commandes

### Étapes :
1. Ouvrir la console du navigateur (F12)
2. Se connecter en tant qu'admin
3. Aller sur `/admin/orders` (liste des commandes)
4. Cliquer sur la commande #347

### Résultat Attendu :
```
Console :
🔄 [OrderDetailPage] Mapping deliveryInfo -> delivery_info

Interface :
┌─────────────────────────────────────────────┐
│ 🚚 Informations de Livraison               │
├─────────────────────────────────────────────┤
│ Type de livraison                           │
│ ✈️ Livraison internationale                 │
│                                             │
│ Localisation                                │
│ Pays: France                                │
├─────────────────────────────────────────────┤
│ Transporteur                                │
│ [LOGO DHL]  DHL                            │
│             Délai: 1-3 jours               │
├─────────────────────────────────────────────┤
│ Tarification                                │
│ Frais de livraison:                         │
│ 12 000 XOF                                  │
│                                             │
│ Délai estimé:                               │
│ 1-3 jours                                   │
├─────────────────────────────────────────────┤
│ Détails supplémentaires                     │
│                                             │
│ Sélectionné le:                             │
│ 28 novembre 2025, 13:09                     │
│                                             │
│ Calculé le:                                 │
│ 28 novembre 2025, 13:09                     │
│                                             │
│ Transporteurs disponibles au moment...      │
│ ┌──────────────────────────────────────┐   │
│ │ DHL        1-3 jours    12 000 XOF  │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### ❌ Si Échec :
Vérifier dans la console :
- Présence du log `🔄 [OrderDetailPage] Mapping deliveryInfo -> delivery_info`
- Valeur de `order.delivery_info` (doit être défini)

## 🔍 Test 2 : Navigation Directe via URL

### Étapes :
1. Ouvrir la console du navigateur (F12)
2. Se connecter en tant qu'admin
3. Aller directement sur `/admin/orders/347` (URL)

### Résultat Attendu :
```
Console :
✅ [NewOrderService] Commande chargée via /orders/admin/:id
OU
⚠️ [NewOrderService] Endpoint /orders/admin/:id non disponible, fallback sur /orders/:id
ET
🔄 [NewOrderService] Mapping deliveryInfo -> delivery_info pour commande #ORD-1764335380032

Interface :
Identique au Test 1
```

### ❌ Si Échec :
Vérifier :
- L'endpoint utilisé dans la console
- Les erreurs réseau dans l'onglet Network (F12)
- La structure de la réponse API

## 🔍 Test 3 : Commande Sans Informations de Livraison

### Étapes :
1. Trouver une commande ancienne sans `deliveryInfo`
2. Aller sur `/admin/orders/{id}`

### Résultat Attendu :
```
Interface :
La section "Informations de Livraison" NE doit PAS apparaître

À la place, vous devriez voir :
┌─────────────────────────────────────────────┐
│ Livraison                                   │
│ Non définie                                 │
└─────────────────────────────────────────────┘
```

## 🔍 Test 4 : Livraison Locale (Sénégal)

Si vous avez une commande avec livraison locale :

### Résultat Attendu :
```
┌─────────────────────────────────────────────┐
│ 🚚 Informations de Livraison               │
├─────────────────────────────────────────────┤
│ Type de livraison                           │
│ 🏙️ Livraison en ville                       │
│                                             │
│ Localisation                                │
│ Ville: Dakar                                │
│ Région: Dakar                               │
│ Pays: Sénégal                               │
├─────────────────────────────────────────────┤
│ Transporteur                                │
│ [LOGO] DHL Express                          │
│        Délai: 24h                           │
├─────────────────────────────────────────────┤
│ Tarification                                │
│ Frais de livraison:                         │
│ 2 000 XOF                                   │
└─────────────────────────────────────────────┘
```

## 🔍 Test 5 : Livraison Gratuite

Si vous avez une commande avec frais = 0 :

### Résultat Attendu :
```
Tarification
Frais de livraison:
Gratuit 🎉
```

## 🐛 Débogage

### Vérifier les Données Brutes

Ouvrir la console et exécuter :
```javascript
// Après navigation vers /admin/orders/347
console.log('Order:', order);
console.log('Delivery Info:', order?.delivery_info);
```

### Structure Attendue :
```javascript
{
  delivery_info: {
    deliveryType: "international",
    location: { countryName: "France", ... },
    transporteur: { name: "DHL", logo: "...", ... },
    tarif: { amount: 12000, deliveryTime: "1-3 jours" },
    metadata: { ... }
  }
}
```

### Vérifier la Requête API

1. Ouvrir DevTools (F12)
2. Onglet "Network"
3. Filtrer par "347"
4. Cliquer sur la requête GET
5. Vérifier l'onglet "Response"

La réponse devrait contenir `deliveryInfo` qui sera automatiquement mappé vers `delivery_info`.

## ✅ Checklist de Validation

- [ ] Section "Informations de Livraison" visible
- [ ] Type de livraison affiché avec emoji
- [ ] Localisation affichée (ville/région/zone/pays)
- [ ] Logo du transporteur chargé
- [ ] Nom du transporteur affiché
- [ ] Frais de livraison affichés correctement
- [ ] Délai de livraison affiché
- [ ] Dates de sélection/calcul affichées
- [ ] Liste des transporteurs disponibles affichée
- [ ] Design responsive (tester sur mobile)
- [ ] Pas d'erreurs dans la console

## 🚀 Si Tout Fonctionne

Vous devriez voir :
- ✅ Les logs de mapping dans la console
- ✅ La section complète affichée avec toutes les données
- ✅ Le design responsive qui s'adapte à la taille d'écran
- ✅ Les emojis et icônes correctement affichés

## 📞 Support

Si un test échoue, vérifier :
1. Les logs de la console (mapping, erreurs)
2. La réponse de l'API dans Network
3. La structure de `order.delivery_info` dans la console
4. Les erreurs TypeScript dans le terminal

L'implémentation supporte :
- ✅ Structure moderne (imbriquée)
- ✅ Structure plate (ancienne)
- ✅ Navigation depuis liste
- ✅ Navigation directe URL
- ✅ Livraison locale, régionale, internationale
- ✅ Avec ou sans transporteur
