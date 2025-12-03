# 📦 Système de Vérification Automatique de Livraison

## Vue d'ensemble

Le système vérifie automatiquement la disponibilité de livraison quand un client sélectionne un pays et une ville dans le formulaire de commande.

## 🔄 Fonctionnement

### 1. Sélection du Pays et de la Ville

Le client :
1. Sélectionne d'abord un **pays** dans la liste déroulante
2. Commence à taper le nom d'une **ville** dans le champ autocomplete
3. L'autocomplete utilise l'API **GeoNames** pour suggérer des villes du pays sélectionné
4. Le client sélectionne une ville dans les suggestions

### 2. Vérification Automatique

**Quand la vérification se déclenche :**
- Après que le client a sélectionné ou tapé au moins 3 caractères
- Avec un délai de 800ms après la dernière frappe (debounce)
- Uniquement si le pays et la ville sont définis

**Ce qui se passe :**

#### Pour le Sénégal (code SN) :

1. **Recherche dans les villes** définies par l'admin
   - Correspondance exacte : "Dakar" = "Dakar" ✅
   - Correspondance partielle : "Daka" matchera "Dakar" ✅
   - Les accents sont ignorés : "Thiès" = "Thies" ✅

2. **Si pas trouvé, recherche dans les régions**
   - Vérifie si la ville est listée dans les "mainCities" d'une région
   - Exemple : "Kaolack" sera trouvé dans la région "Kaolack"

3. **Si pas trouvé : Message d'erreur**
   - "❌ Désolé, la livraison vers [ville] n'est pas encore disponible"

#### Pour les autres pays (International) :

1. **Recherche dans les zones internationales**
   - Vérifie si le pays est dans une zone définie par l'admin
   - Exemple : France → Zone "Europe de l'Ouest"

2. **Si pas trouvé : Message d'erreur**
   - "❌ Désolé, la livraison vers [pays] n'est pas encore disponible"

### 3. Affichage du Résultat

#### ✅ Livraison disponible :

Un encadré **VERT** s'affiche avec :
- Message : "✅ Livraison disponible à [ville]"
- **Frais de livraison** : Montant en XOF (ou "Livraison gratuite")
- **Délai estimé** : Ex: "24-48 heures" ou "2-3 jours"

Le bouton "Continuer" est **ACTIVÉ**

#### ❌ Livraison non disponible :

Un encadré **ROUGE** s'affiche avec :
- Message : "❌ Désolé, la livraison vers [ville] n'est pas encore disponible"
- Suggestion : "Veuillez contacter le service client ou choisir une autre ville"

Le bouton "Continuer" est **DÉSACTIVÉ**

## 🛠️ Configuration Admin

Pour qu'une ville soit reconnue, l'admin doit la configurer dans :

### Dashboard Admin → Livraison

#### 1. Villes (Dakar & Banlieue)
```
Nom : Dakar
Catégorie : Centre
Zone : Dakar-Ville
Prix : 1500 XOF
Délai : 24-48 heures
Statut : Active
```

#### 2. Régions (13 régions du Sénégal)
```
Nom : Thiès
Prix : 3000 XOF
Délai : 2-3 jours
Villes principales : Thiès, Tivaouane, Mbour
Statut : Active
```

#### 3. Zones Internationales
```
Nom : Europe de l'Ouest
Pays : FR, BE, DE, ES, IT, ...
Prix : 25000 XOF
Délai : 7-10 jours
Statut : Active
```

## 🔍 Normalisation des Noms

Le système normalise automatiquement les noms pour améliorer la correspondance :

| Saisie Client | Normalisé | Match Admin | Résultat |
|--------------|-----------|-------------|----------|
| Dakar | dakar | Dakar | ✅ Trouvé |
| DAKAR | dakar | Dakar | ✅ Trouvé |
| Thiès | thies | Thiès | ✅ Trouvé (accents ignorés) |
| Saint-Louis | saint-louis | Saint-Louis | ✅ Trouvé |
| Daka | daka | Dakar | ✅ Trouvé (partiel) |

**Transformations appliquées :**
- Conversion en minuscules
- Suppression des accents (é → e, à → a)
- Suppression des caractères spéciaux
- Conservation des espaces et tirets

## 📊 Sources de Données

### API Backend (chargées au démarrage)

1. **Villes** : `GET /api/delivery/cities`
   - Retourne toutes les villes Dakar & Banlieue
   - Filtrées par `status: 'active'`

2. **Régions** : `GET /api/delivery/regions`
   - Retourne les 13 régions du Sénégal
   - Avec leurs villes principales

3. **Zones Internationales** : `GET /api/delivery/international-zones`
   - Retourne les zones mondiales
   - Avec la liste des pays couverts

### API GeoNames (autocomplete)

- Utilisée uniquement pour suggérer des villes pendant la saisie
- Ne détermine PAS les tarifs
- Les tarifs viennent UNIQUEMENT de la base de données admin

## 🎯 Flux Complet

```
1. Client sélectionne "Sénégal" (SN)
   ↓
2. Client tape "Daka" dans le champ ville
   ↓
3. GeoNames suggère "Dakar", "Dakar-Plateau", etc.
   ↓
4. Client sélectionne "Dakar"
   ↓
5. Système recherche "Dakar" dans les villes admin (SN)
   ↓
6. Trouvé ! Ville "Dakar" - Prix: 1500 XOF - Délai: 24-48h
   ↓
7. Affiche encadré vert avec infos
   ↓
8. Client peut continuer sa commande
```

## ⚠️ Points Importants

1. **Données Admin = Source de Vérité**
   - Seules les villes/régions définies par l'admin sont reconnues
   - GeoNames est juste pour l'autocomplete, pas pour la validation

2. **Normalisation Robuste**
   - Les accents, majuscules et caractères spéciaux sont ignorés
   - Meilleure tolérance aux variations d'orthographe

3. **Message Clair**
   - Le client sait immédiatement si la livraison est possible
   - Indication claire des frais et délais

4. **Validation Bloquante**
   - Impossible de continuer si la livraison n'est pas disponible
   - Force le client à choisir une ville desservie

## 🔧 Maintenance

### Ajouter une Nouvelle Ville

1. Admin → Livraison → Villes
2. Cliquer "Ajouter une ville"
3. Remplir : Nom, Prix, Délai, Zone
4. Statut : Active
5. Sauvegarder

➡️ La ville est immédiatement disponible (pas besoin de redémarrage)

### Désactiver une Ville

1. Admin → Livraison → Villes
2. Trouver la ville
3. Toggle Statut → Inactive

➡️ La ville ne sera plus proposée aux clients

## 📱 Adaptation Mobile

- Textes plus petits sur mobile
- Espacement réduit
- Messages d'erreur condensés
- Boutons optimisés pour le tactile

## 🐛 Dépannage

### Problème : "Zone non desservie" pour une ville qui devrait être disponible

**Solutions :**
1. Vérifier que la ville est bien définie dans l'admin avec `status: 'active'`
2. Vérifier l'orthographe exacte de la ville dans la base
3. Vérifier la console du navigateur pour voir le nom normalisé
4. Si besoin, ajouter la ville aux "mainCities" d'une région

### Problème : La vérification ne se déclenche pas

**Solutions :**
1. Vérifier que le pays est bien sélectionné
2. Taper au moins 3 caractères
3. Attendre 800ms après la dernière frappe
4. Vérifier la console pour les erreurs API

---

**Dernière mise à jour** : 26 novembre 2025
