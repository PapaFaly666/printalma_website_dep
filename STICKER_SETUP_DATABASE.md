# Configuration de la Base de Données pour les Stickers

**Date:** 11 janvier 2026
**Problème:** Erreur "Aucune taille de sticker disponible"
**Cause:** Les tables `StickerSize` et `StickerFinish` sont vides dans la base de données

---

## 🔍 Diagnostic

L'erreur se produit car le frontend appelle `/public/stickers/configurations` qui retourne des tableaux vides :

```json
{
  "success": true,
  "data": {
    "sizes": [],      // ❌ Vide
    "finishes": []    // ❌ Vide
  }
}
```

---

## ✅ Solution 1: Exécuter le Script SQL de Seed (Recommandé)

Le backend contient déjà un script SQL prêt à l'emploi : `prisma/seed-sticker-data.sql`

### Étapes:

1. **Se connecter à la base de données PostgreSQL:**

```bash
# Depuis le répertoire backend
cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep

# Se connecter via psql (remplacer DATABASE_URL par votre URL)
psql $DATABASE_URL
```

2. **Exécuter le script de seed:**

```bash
# Option 1: Via psql
\i prisma/seed-sticker-data.sql

# Option 2: Via commande directe
psql $DATABASE_URL -f prisma/seed-sticker-data.sql
```

3. **Vérifier que les données sont insérées:**

```sql
-- Vérifier les tailles
SELECT id, name, width_cm, height_cm, base_price FROM sticker_sizes;

-- Vérifier les finitions
SELECT id, name, price_multiplier FROM sticker_finishes;
```

**Résultat attendu:**

```
Tailles:
id     | name        | width_cm | height_cm | base_price
-------|-------------|----------|-----------|------------
small  | Petit       | 5.00     | 5.00      | 500
medium | Moyen       | 10.00    | 10.00     | 1000
large  | Grand       | 15.00    | 15.00     | 1500
xlarge | Très Grand  | 20.00    | 20.00     | 2500

Finitions:
id           | name          | price_multiplier
-------------|---------------|------------------
matte        | Mat           | 1.00
glossy       | Brillant      | 1.10
transparent  | Transparent   | 1.30
holographic  | Holographique | 1.50
metallic     | Métallique    | 1.40
```

---

## ✅ Solution 2: Script Prisma (Alternative)

Si vous préférez utiliser Prisma directement:

### 1. Créer le fichier de seed

Créez le fichier `prisma/seed-stickers.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed: Création des configurations de stickers...');

  // Créer les tailles
  await prisma.stickerSize.createMany({
    data: [
      {
        id: 'small',
        name: 'Petit',
        description: '5cm x 5cm - Parfait pour ordinateur portable',
        widthCm: 5.0,
        heightCm: 5.0,
        basePrice: 500,
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'medium',
        name: 'Moyen',
        description: '10cm x 10cm - Taille standard polyvalente',
        widthCm: 10.0,
        heightCm: 10.0,
        basePrice: 1000,
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'large',
        name: 'Grand',
        description: '15cm x 15cm - Grand format pour décoration',
        widthCm: 15.0,
        heightCm: 15.0,
        basePrice: 1500,
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'xlarge',
        name: 'Très Grand',
        description: '20cm x 20cm - Format XXL',
        widthCm: 20.0,
        heightCm: 20.0,
        basePrice: 2500,
        displayOrder: 4,
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Tailles de stickers créées');

  // Créer les finitions
  await prisma.stickerFinish.createMany({
    data: [
      {
        id: 'matte',
        name: 'Mat',
        description: 'Finition mate élégante, anti-reflet',
        priceMultiplier: 1.0,
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'glossy',
        name: 'Brillant',
        description: 'Finition brillante éclatante',
        priceMultiplier: 1.1,
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'transparent',
        name: 'Transparent',
        description: 'Fond transparent, design visible',
        priceMultiplier: 1.3,
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'holographic',
        name: 'Holographique',
        description: 'Effet arc-en-ciel premium',
        priceMultiplier: 1.5,
        displayOrder: 4,
        isActive: true
      },
      {
        id: 'metallic',
        name: 'Métallique',
        description: 'Effet métallisé brillant',
        priceMultiplier: 1.4,
        displayOrder: 5,
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Finitions de stickers créées');

  // Vérification
  const sizesCount = await prisma.stickerSize.count();
  const finishesCount = await prisma.stickerFinish.count();

  console.log(`\n📊 Résumé:`);
  console.log(`   Tailles: ${sizesCount}`);
  console.log(`   Finitions: ${finishesCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Exécuter le script

```bash
cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep

# Exécuter le seed
npx ts-node prisma/seed-stickers.ts
```

---

## ✅ Solution 3: Ajouter au package.json (Pour automatisation)

Modifiez `package.json` pour ajouter un script de seed :

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed-stickers.ts"
  },
  "scripts": {
    "seed:stickers": "ts-node prisma/seed-stickers.ts"
  }
}
```

Puis exécutez:

```bash
npm run seed:stickers
```

---

## 🧪 Vérification Post-Installation

### 1. Vérifier via l'API

```bash
# Tester l'endpoint de configurations
curl http://localhost:3004/public/stickers/configurations
```

**Résultat attendu:**

```json
{
  "success": true,
  "data": {
    "sizes": [
      {
        "id": "small",
        "name": "Petit",
        "description": "5cm x 5cm - Parfait pour ordinateur portable",
        "width": 5,
        "height": 5,
        "basePrice": 500
      },
      {
        "id": "medium",
        "name": "Moyen",
        "description": "10cm x 10cm - Taille standard polyvalente",
        "width": 10,
        "height": 10,
        "basePrice": 1000
      }
      // ... autres tailles
    ],
    "finishes": [
      {
        "id": "matte",
        "name": "Mat",
        "description": "Finition mate élégante, anti-reflet",
        "priceMultiplier": 1
      },
      {
        "id": "glossy",
        "name": "Brillant",
        "description": "Finition brillante éclatante",
        "priceMultiplier": 1.1
      }
      // ... autres finitions
    ],
    "shapes": [
      { "id": "SQUARE", "name": "Carré", "description": "Forme carrée classique" },
      { "id": "CIRCLE", "name": "Cercle", "description": "Forme circulaire" },
      { "id": "RECTANGLE", "name": "Rectangle", "description": "Forme rectangulaire" },
      { "id": "DIE_CUT", "name": "Découpe personnalisée", "description": "Suit le contour du design" }
    ]
  }
}
```

### 2. Vérifier dans le Frontend

1. Ouvrez la console du navigateur (F12)
2. Rechargez `/vendeur/stickers`
3. Vérifiez les logs :

```
📋 Réponse API complète: {...}
📋 Configurations stickers disponibles: {...}
📐 Tailles disponibles: [{id: "small", ...}, {id: "medium", ...}, ...]
✨ Finitions disponibles: [{id: "matte", ...}, {id: "glossy", ...}, ...]
```

### 3. Tester la Création d'un Sticker

1. Cliquez sur "Créer autocollant" sur un design
2. Vérifiez les logs :

```
🔍 Vérification configurations: {hasConfigs: true, hasSizes: true, sizesLength: 4, ...}
📐 Taille sélectionnée: {id: "medium", name: "Moyen", width: 10, height: 10, basePrice: 1000}
✨ Finition sélectionnée: {id: "glossy", name: "Brillant", priceMultiplier: 1.1}
💰 Calcul prix: {basePrice: 1000, finishMultiplier: 1.1, designPrice: 0, total: 1100}
📦 Création sticker (le backend génère l'image avec bordures): {...}
```

---

## 🚨 Fallback Frontend

Le frontend utilise maintenant des configurations par défaut si la BDD est vide:

```typescript
// Configurations par défaut (si BDD vide)
const defaultConfigs = {
  sizes: [
    {
      id: 'medium',
      name: 'Moyen',
      description: '10cm x 10cm - Taille standard',
      width: 10,
      height: 10,
      basePrice: 1000
    }
  ],
  finishes: [
    {
      id: 'glossy',
      name: 'Brillant (Glossy)',
      description: 'Finition brillante',
      priceMultiplier: 1.1
    }
  ]
};
```

**Cependant, il est FORTEMENT RECOMMANDÉ d'initialiser la base de données correctement pour avoir toutes les options disponibles.**

---

## 📊 Structure des Tables

### Table: `sticker_sizes`

| Colonne       | Type    | Description                |
|---------------|---------|----------------------------|
| id            | VARCHAR | Identifiant unique (PK)    |
| name          | VARCHAR | Nom affiché                |
| description   | TEXT    | Description détaillée      |
| width_cm      | DECIMAL | Largeur en centimètres     |
| height_cm     | DECIMAL | Hauteur en centimètres     |
| base_price    | INTEGER | Prix de base en FCFA       |
| display_order | INTEGER | Ordre d'affichage          |
| is_active     | BOOLEAN | Actif ou non               |
| created_at    | TIMESTAMP | Date de création         |
| updated_at    | TIMESTAMP | Date de modification     |

### Table: `sticker_finishes`

| Colonne          | Type    | Description                |
|------------------|---------|----------------------------|
| id               | VARCHAR | Identifiant unique (PK)    |
| name             | VARCHAR | Nom affiché                |
| description      | TEXT    | Description détaillée      |
| price_multiplier | DECIMAL | Multiplicateur de prix     |
| display_order    | INTEGER | Ordre d'affichage          |
| is_active        | BOOLEAN | Actif ou non               |
| created_at       | TIMESTAMP | Date de création         |
| updated_at       | TIMESTAMP | Date de modification     |

---

## 🎯 Checklist de Résolution

- [ ] Exécuter le script SQL `prisma/seed-sticker-data.sql`
- [ ] Vérifier que les données sont insérées (requête SELECT)
- [ ] Tester l'endpoint `/public/stickers/configurations`
- [ ] Recharger le frontend et vérifier les logs
- [ ] Tester la création d'un sticker
- [ ] Vérifier que l'image est générée et uploadée sur Cloudinary

---

**Auteur:** Claude Sonnet 4.5
**Date:** 11 janvier 2026
