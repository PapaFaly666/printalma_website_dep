# 🎨 Guide Visuel - Protection des Catégories

> **Visualisation interactive du système de protection**

---

## 📊 Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTÈME DE PROTECTION                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Interface UI   │────▶│  Service Protection │────▶│  Backend API    │
│  (Composant)    │     │  (categoryProtection) │     │  (Endpoints)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
  ┌─────────┐            ┌─────────────┐          ┌─────────────┐
  │ Modal   │            │ Vérification │          │  Base de    │
  │ Dialog  │            │ Logique     │          │  Données    │
  └─────────┘            └─────────────┘          └─────────────┘
```

---

## 🔄 Flux utilisateur

### Scénario 1 : Suppression autorisée ✅

```
  ┌────────┐
  │ DÉBUT  │
  └────┬───┘
       │
       ▼
┌─────────────┐
│ Clic sur    │
│ "Supprimer" │
└─────┬───────┘
       │
       ▼
┌─────────────────┐
│ Modal s'ouvre   │
│ État: Loading   │
│ ⏳ Vérification │
└─────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Backend vérifie          │
│ Produits liés: 0         │
│ Résultat: CAN DELETE ✅  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Modal affiche:           │
│ ✅ Suppression autorisée │
│ [Confirmer] [Annuler]   │
└──────┬───────────────────┘
       │
       ├──────────┬──────────┐
       │          │          │
       ▼          ▼          ▼
   [Annuler]  [Confirmer]  [X]
       │          │          │
       │          ▼          │
       │    ┌─────────┐     │
       │    │ DELETE  │     │
       │    │ API Call│     │
       │    └────┬────┘     │
       │         │          │
       └─────────┴──────────┘
                 │
                 ▼
            ┌────────┐
            │  FIN   │
            └────────┘
```

### Scénario 2 : Suppression bloquée ❌

```
  ┌────────┐
  │ DÉBUT  │
  └────┬───┘
       │
       ▼
┌─────────────┐
│ Clic sur    │
│ "Supprimer" │
└─────┬───────┘
       │
       ▼
┌─────────────────┐
│ Modal s'ouvre   │
│ État: Loading   │
│ ⏳ Vérification │
└─────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Backend vérifie          │
│ Produits liés: 5         │
│ Résultat: CANNOT DELETE❌│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Récupère liste produits  │
│ [Produit 1, 2, 3, 4, 5]  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Modal affiche:               │
│ ❌ Suppression impossible    │
│ 📦 5 produits liés           │
│ 📋 Liste des produits       │
│ 💡 Instructions             │
│ [Impossible] [Annuler]      │
└──────┬───────────────────────┘
       │
       ▼
   [Annuler/X]
       │
       ▼
  ┌────────┐
  │  FIN   │
  └────────┘
```

---

## 🖼️ Mockups de l'interface

### État 1 : Chargement

```
┌───────────────────────────────────────────┐
│ ⏳ Vérification en cours...               │
├───────────────────────────────────────────┤
│                                           │
│        ⏳  Chargement...                  │
│        Vérification des produits liés... │
│                                           │
│                                           │
└───────────────────────────────────────────┘
```

### État 2 : Autorisation (Aucun produit lié)

```
┌───────────────────────────────────────────┐
│ ✅ Confirmer la suppression               │
│ Catégorie : Mode Femme                    │
├───────────────────────────────────────────┤
│                                           │
│ ┌───────────────────────────────────────┐ │
│ │ ✅ Suppression autorisée              │ │
│ │                                       │ │
│ │ Cette catégorie n'est liée à aucun   │ │
│ │ produit et peut être supprimée en     │ │
│ │ toute sécurité.                       │ │
│ └───────────────────────────────────────┘ │
│                                           │
│                   [ Annuler ]  [ Confirmer la suppression ] │
└───────────────────────────────────────────┘
```

### État 3 : Blocage (Produits liés)

```
┌────────────────────────────────────────────────┐
│ ❌ Suppression impossible                     │
│ Catégorie : Mode Femme                         │
├────────────────────────────────────────────────┤
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ ⚠️  Suppression impossible                 │ │
│ │                                            │ │
│ │ Cette catégorie est liée à 5 produits et  │ │
│ │ ne peut pas être supprimée.                │ │
│ │                                            │ │
│ │ 📦 5 produits liés                         │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Produits liés                              │ │
│ ├────────────────────────────────────────────┤ │
│ │ 📦 Robe Longue Soie                ID: 1   │ │
│ │ 📦 T-Shirt Premium                 ID: 2   │ │
│ │ 📦 Chemise Formelle                ID: 3   │ │
│ │ 📦 Pantalon Chino                  ID: 4   │ │
│ │ 📦 Veste en Jean                   ID: 5   │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ 💡 Comment procéder ?                      │ │
│ │                                            │ │
│ │ 1. Supprimez ou réaffectez les produits   │ │
│ │    liés à une autre catégorie              │ │
│ │ 2. Revenez ensuite supprimer cette         │ │
│ │    catégorie                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│         [ Annuler ]  [ Impossible de supprimer ]│
│                      (bouton désactivé)        │
└────────────────────────────────────────────────┘
```

---

## 🌲 Hiérarchie visuelle

### Structure des catégories

```
📁 Mode Femme (Catégorie - Level 0)
│
├── 📂 Robes (Sous-catégorie - Level 1)
│   │
│   ├── 🎨 Robe Longue (Variation - Level 2)
│   │   │
│   │   └── 📦 Robe Longue Soie Noire (Produit)
│   │   └── 📦 Robe Longue Coton Blanche (Produit)
│   │
│   └── 🎨 Robe Cocktail (Variation - Level 2)
│       │
│       └── 📦 Robe Cocktail Rouge (Produit)
│
└── 📂 Tops (Sous-catégorie - Level 1)
    │
    └── 🎨 T-shirt Manche Longue (Variation - Level 2)
        │
        └── 📦 T-shirt ML Blanc (Produit)
```

### Règles de suppression par niveau

```
┌─────────────────────────────────────────────────┐
│ NIVEAU 0 : Catégorie (Mode Femme)              │
│                                                 │
│ ❌ NE PEUT PAS être supprimée si:              │
│    • Au moins 1 produit est lié                 │
│    • Au moins 1 sous-catégorie existe           │
│                                                 │
│ ✅ PEUT être supprimée si:                     │
│    • Aucun produit lié                          │
│    • Aucune sous-catégorie                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ NIVEAU 1 : Sous-catégorie (Robes)              │
│                                                 │
│ ❌ NE PEUT PAS être supprimée si:              │
│    • Au moins 1 produit est lié                 │
│    • Au moins 1 variation existe                │
│                                                 │
│ ✅ PEUT être supprimée si:                     │
│    • Aucun produit lié                          │
│    • Aucune variation                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ NIVEAU 2 : Variation (Robe Longue)             │
│                                                 │
│ ❌ NE PEUT PAS être supprimée si:              │
│    • Au moins 1 produit est lié                 │
│                                                 │
│ ✅ PEUT être supprimée si:                     │
│    • Aucun produit lié                          │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Matrice de décision

```
┌────────────────┬──────────────────┬──────────────────┬─────────────┐
│ Type           │ Produits liés    │ Enfants          │ Suppression │
├────────────────┼──────────────────┼──────────────────┼─────────────┤
│ Catégorie      │ 0                │ 0                │ ✅ OUI      │
│ Catégorie      │ 0                │ > 0              │ ❌ NON      │
│ Catégorie      │ > 0              │ 0                │ ❌ NON      │
│ Catégorie      │ > 0              │ > 0              │ ❌ NON      │
├────────────────┼──────────────────┼──────────────────┼─────────────┤
│ Sous-catégorie │ 0                │ 0                │ ✅ OUI      │
│ Sous-catégorie │ 0                │ > 0              │ ❌ NON      │
│ Sous-catégorie │ > 0              │ 0                │ ❌ NON      │
│ Sous-catégorie │ > 0              │ > 0              │ ❌ NON      │
├────────────────┼──────────────────┼──────────────────┼─────────────┤
│ Variation      │ 0                │ N/A              │ ✅ OUI      │
│ Variation      │ > 0              │ N/A              │ ❌ NON      │
└────────────────┴──────────────────┴──────────────────┴─────────────┘
```

---

## 📈 Schéma de base de données

```sql
┌─────────────────┐
│   Categories    │
│─────────────────│
│ id (PK)         │────┐
│ name            │    │
│ slug            │    │
│ description     │    │
└─────────────────┘    │
                       │ FK: categoryId
                       │
                ┌──────▼────────────┐
                │  SubCategories    │
                │───────────────────│
                │ id (PK)           │────┐
                │ categoryId (FK)   │    │
                │ name              │    │
                │ slug              │    │
                └───────────────────┘    │ FK: subCategoryId
                                         │
                                  ┌──────▼──────────┐
                                  │   Variations    │
                                  │─────────────────│
                                  │ id (PK)         │────┐
                                  │ subCategoryId   │    │
                                  │ name            │    │
                                  └─────────────────┘    │ FK: variationId
                                                         │
                                                  ┌──────▼──────────┐
                                                  │    Products     │
                                                  │─────────────────│
                                                  │ id (PK)         │
                                                  │ categoryId (FK) │
                                                  │ variationId (FK)│
                                                  │ name            │
                                                  │ price           │
                                                  └─────────────────┘

🔒 Contraintes de suppression:
   ON DELETE RESTRICT sur toutes les clés étrangères
```

---

## 🎯 Cas d'usage visuels

### Cas 1 : Suppression simple réussie

```
Avant:
┌─────────────┐
│ Catégorie A │ (0 produits, 0 sous-catégories)
└─────────────┘

Action:
[Supprimer] ──▶ ✅ Vérification OK ──▶ ✅ Suppression

Après:
(Catégorie A supprimée)
```

### Cas 2 : Suppression bloquée (produits liés)

```
Avant:
┌─────────────┐
│ Catégorie B │ ──▶ 📦 Produit 1
└─────────────┘     📦 Produit 2
                    📦 Produit 3

Action:
[Supprimer] ──▶ ❌ Vérification échouée ──▶ ❌ Blocage
                   (3 produits liés)

Message:
⚠️  Impossible de supprimer
    3 produits sont liés à cette catégorie
    [Liste des produits]
```

### Cas 3 : Suppression en cascade (simulation)

```
┌──────────────────────────────────────────┐
│ Catégorie C                              │
│   ├── Sous-catégorie C1                  │
│   │   ├── Variation C1-V1                │
│   │   │   └── Produit 1 ❌              │
│   │   └── Variation C1-V2                │
│   │       └── Produit 2 ❌              │
│   └── Sous-catégorie C2                  │
│       └── Variation C2-V1                │
│           └── Produit 3 ❌              │
└──────────────────────────────────────────┘

Pour supprimer "Catégorie C":

1️⃣ Supprimer d'abord: Produit 1, 2, 3
2️⃣ Puis supprimer: Variation C1-V1, C1-V2, C2-V1
3️⃣ Puis supprimer: Sous-catégorie C1, C2
4️⃣ Enfin supprimer: Catégorie C ✅
```

---

## 🚀 Workflow développeur

```
┌──────────────────────────────────────────────────┐
│ DÉVELOPPEUR                                      │
└──────────────────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ Import du composant           │
    │                               │
    │ import {                      │
    │   CategoryDeleteConfirmation  │
    │ } from './components/admin';  │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ Ajout dans la page            │
    │                               │
    │ <CategoryDeleteConfirmation   │
    │   isOpen={true}               │
    │   onConfirm={handleDelete}    │
    │   categoryId={1}              │
    │   type="category"             │
    │ />                            │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ Gestion de l'état             │
    │                               │
    │ const [open, setOpen] =       │
    │   useState(false);            │
    │                               │
    │ const handleDelete = () => {  │
    │   // Logique suppression      │
    │ };                            │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ ✅ Terminé !                  │
    │                               │
    │ Le composant gère:            │
    │ • Vérification                │
    │ • Affichage                   │
    │ • Messages                    │
    │ • Protection                  │
    └───────────────────────────────┘
```

---

## 📊 Comparaison Avant/Après

### Avant l'implémentation

```
┌──────────────────────────────────┐
│ Utilisateur                      │
└──────┬───────────────────────────┘
       │
       ▼
┌─────────────┐
│ Clic        │
│ "Supprimer" │
└─────┬───────┘
       │
       ▼
┌──────────────┐
│ DELETE API   │
└─────┬────────┘
       │
       ├─────────────────────────┬──────────────────┐
       │                         │                  │
       ▼                         ▼                  ▼
┌───────────┐         ┌──────────────┐   ┌─────────────────┐
│ Succès ✅ │         │ Erreur P2003 │   │ Données perdues │
└───────────┘         │ (Contrainte) │   │ Incohérence BD  │
                      └──────────────┘   └─────────────────┘
                      ❌ Mauvaise UX     ❌ Problème grave
```

### Après l'implémentation

```
┌──────────────────────────────────┐
│ Utilisateur                      │
└──────┬───────────────────────────┘
       │
       ▼
┌─────────────┐
│ Clic        │
│ "Supprimer" │
└─────┬───────┘
       │
       ▼
┌──────────────────┐
│ Modal protection │
│ Vérification     │
└─────┬────────────┘
       │
       ├──────────────────────┬─────────────────────┐
       │                      │                     │
       ▼                      ▼                     ▼
┌────────────┐    ┌──────────────────┐   ┌───────────────┐
│ Autorisée  │    │ Bloquée          │   │ Erreur API    │
│ ✅         │    │ ❌               │   │ ⚠️            │
│            │    │ • Liste produits │   │ Blocage par   │
│ [Confirmer]│    │ • Instructions   │   │ défaut        │
└────┬───────┘    │ [Impossible]     │   └───────────────┘
     │            └──────────────────┘   ✅ Sécurité
     ▼
┌──────────┐
│ DELETE   │
│ API      │
└──────────┘
✅ Bonne UX
```

---

## 🎨 Palette de couleurs utilisée

```
┌────────────────────────────────────────┐
│ ÉTATS DU COMPOSANT                     │
├────────────────────────────────────────┤
│                                        │
│ Chargement:   🔵 Bleu (#3B82F6)       │
│ Autorisé:     🟢 Vert (#22C55E)       │
│ Bloqué:       🔴 Rouge (#EF4444)      │
│ Information:  🟡 Jaune (#F59E0B)      │
│ Neutre:       ⚪ Gris (#6B7280)       │
│                                        │
└────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (> 768px)

```
┌────────────────────────────────────────────────┐
│ ❌ Suppression impossible                     │
│ Catégorie : Mode Femme                         │
├────────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────────────┐│
│  │ Message  │  │ Produits liés               ││
│  │ Erreur   │  │ ┌─────────────────────────┐ ││
│  │          │  │ │ 📦 Produit 1            │ ││
│  │          │  │ │ 📦 Produit 2            │ ││
│  │          │  │ │ 📦 Produit 3            │ ││
│  │          │  │ └─────────────────────────┘ ││
│  └──────────┘  └─────────────────────────────┘│
│                                                │
│           [ Annuler ]  [ Impossible ]          │
└────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ ❌ Suppression       │
│ impossible           │
│ Catégorie :          │
│ Mode Femme           │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Message          │ │
│ │ Erreur           │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ Produits liés    │ │
│ ├──────────────────┤ │
│ │ 📦 Produit 1     │ │
│ │ 📦 Produit 2     │ │
│ │ 📦 Produit 3     │ │
│ └──────────────────┘ │
│                      │
│ [ Annuler ]          │
│ [ Impossible ]       │
└──────────────────────┘
```

---

**Dernière mise à jour :** 2025-10-19
**Version :** 1.0.0
