# 🔧 Guide de résolution - Erreurs CORS et API

Ce guide résout les erreurs rencontrées dans `res.md` :
- ❌ Erreur CORS : `x-user-id` header bloqué
- ❌ Erreur 500 sur `/categories`

---

## 🚨 Problème 1 : Erreur CORS

### Erreur affichée

```
Access to fetch at 'https://printalma-back-dep.onrender.com/products'
from origin 'http://localhost:5174' has been blocked by CORS policy:
Request header field x-user-id is not allowed by
Access-Control-Allow-Headers in preflight response.
```

### Cause

Le backend ne permet pas le header personnalisé `x-user-id` dans les requêtes CORS.

### Solution Backend (NestJS)

#### Option 1 : Configuration CORS dans `main.ts`

```typescript
// backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS complète
  app.enableCors({
    origin: [
      'http://localhost:5174',           // Dev local
      'http://localhost:3000',           // Dev local alternatif
      'https://printalma.com',           // Production
      'https://www.printalma.com',       // Production www
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'x-user-id',                        // ✅ Ajouter ce header
      'x-vendor-id',                      // Si vous l'utilisez
    ],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'X-Total-Count',
    ],
    maxAge: 3600, // Cache preflight pendant 1h
  });

  await app.listen(3004);
  console.log('🚀 Backend démarré sur http://localhost:3004');
}
bootstrap();
```

#### Option 2 : Middleware CORS personnalisé

```typescript
// backend/src/middleware/cors.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    const allowedOrigins = [
      'http://localhost:5174',
      'http://localhost:3000',
      'https://printalma.com',
      'https://www.printalma.com',
    ];

    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id,x-vendor-id');
    res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Type,X-Total-Count');

    // Répondre aux requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}

// Appliquer dans app.module.ts
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { CorsMiddleware } from './middleware/cors.middleware';

@Module({
  // ...
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
```

---

## 🚨 Problème 2 : Erreur 500 sur `/categories`

### Erreur affichée

```
printalma-back-dep.onrender.com/categories:1
Failed to load resource: the server responded with a status of 500 ()
```

### Causes possibles

1. **Table `categories` n'existe pas** dans la base de données
2. **Erreur de schéma Prisma** non synchronisé
3. **Erreur dans le service** categories

### Solution 1 : Vérifier la table existe

```bash
# Se connecter à la base de données
psql postgresql://user:password@host:5432/printalma

# Vérifier la table
\dt categories

# Si elle n'existe pas, créer la table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "parentId" INTEGER,
  level INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY ("parentId") REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE (name, "parentId")
);

CREATE INDEX idx_categories_parent ON categories("parentId");
CREATE INDEX idx_categories_level ON categories(level);
```

### Solution 2 : Migration Prisma

#### 1. Vérifier le schéma Prisma

```prisma
// backend/prisma/schema.prisma

model Category {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  parentId    Int?       @map("parentId")
  level       Int        @default(0)
  order       Int        @default(0)
  createdAt   DateTime   @default(now()) @map("createdAt")
  updatedAt   DateTime   @updatedAt @map("updatedAt")

  // Relations
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("CategoryProducts")

  @@unique([name, parentId], name: "unique_category_per_parent")
  @@index([parentId], name: "idx_categories_parent")
  @@index([level], name: "idx_categories_level")
  @@map("categories")
}
```

#### 2. Générer et appliquer la migration

```bash
# Générer la migration
npx prisma migrate dev --name add_categories_table

# Appliquer en production
npx prisma migrate deploy
```

### Solution 3 : Ajouter gestion d'erreur dans le service

```typescript
// backend/src/categories/categories.service.ts

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      this.logger.log('🔍 Récupération de toutes les catégories');

      const categories = await this.prisma.category.findMany({
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: [
          { level: 'asc' },
          { order: 'asc' },
          { name: 'asc' }
        ]
      });

      this.logger.log(`✅ ${categories.length} catégories récupérées`);
      return categories;

    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des catégories:', error);

      // Log détaillé de l'erreur
      if (error.code === 'P2021') {
        throw new InternalServerErrorException('La table categories n\'existe pas');
      }

      throw new InternalServerErrorException({
        message: 'Erreur lors de la récupération des catégories',
        error: error.message,
        code: error.code
      });
    }
  }
}
```

### Solution 4 : Ajouter des seeds de test

```typescript
// backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des catégories de test
  const telephone = await prisma.category.create({
    data: {
      name: 'Téléphone',
      description: 'Accessoires de téléphone',
      level: 0,
      order: 0
    }
  });

  const coque = await prisma.category.create({
    data: {
      name: 'Coque',
      description: 'Coques de téléphone',
      parentId: telephone.id,
      level: 1,
      order: 0
    }
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'iPhone 13',
        description: 'Coques pour iPhone 13',
        parentId: coque.id,
        level: 2,
        order: 0
      },
      {
        name: 'iPhone 14',
        description: 'Coques pour iPhone 14',
        parentId: coque.id,
        level: 2,
        order: 1
      },
      {
        name: 'iPhone 15',
        description: 'Coques pour iPhone 15',
        parentId: coque.id,
        level: 2,
        order: 2
      }
    ]
  });

  console.log('✅ Seeding terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
# Exécuter le seed
npx prisma db seed
```

---

## 🔍 Debugging : Vérifier les logs backend

### Ajouter des logs détaillés

```typescript
// backend/src/categories/categories.controller.ts

import { Controller, Get, Logger } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    this.logger.log('📥 GET /categories - Requête reçue');

    try {
      const categories = await this.categoriesService.findAll();
      this.logger.log(`✅ ${categories.length} catégories retournées`);
      return categories;

    } catch (error) {
      this.logger.error('❌ Erreur dans GET /categories:', error);
      throw error;
    }
  }
}
```

### Vérifier les logs sur Render

1. Aller sur https://dashboard.render.com
2. Sélectionner le service `printalma-back-dep`
3. Cliquer sur l'onglet "Logs"
4. Chercher les erreurs :
   - Prisma errors
   - Database connection errors
   - 500 errors

---

## 🧪 Tester les corrections

### Test 1 : CORS

```bash
# Tester avec curl
curl -X OPTIONS https://printalma-back-dep.onrender.com/products \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: x-user-id" \
  -v

# Vérifier la réponse contient :
# Access-Control-Allow-Headers: x-user-id
```

### Test 2 : Categories endpoint

```bash
# Tester directement l'endpoint
curl https://printalma-back-dep.onrender.com/categories

# Devrait retourner un JSON, pas une erreur 500
```

### Test 3 : Frontend

```typescript
// Tester depuis la console du navigateur
fetch('https://printalma-back-dep.onrender.com/categories', {
  headers: {
    'x-user-id': '1'
  }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 📋 Checklist de résolution

### Backend (NestJS)

- [ ] CORS configuré dans `main.ts` avec `x-user-id` autorisé
- [ ] Table `categories` existe dans la base de données
- [ ] Schéma Prisma synchronisé avec la base
- [ ] Migrations appliquées (`prisma migrate deploy`)
- [ ] Seeds exécutés pour avoir des données de test
- [ ] Logs détaillés ajoutés dans le service
- [ ] Backend redémarré après modifications

### Base de données

- [ ] Connexion PostgreSQL fonctionne
- [ ] Table `categories` créée avec bonnes colonnes
- [ ] Index créés (`parentId`, `level`)
- [ ] Contrainte unique `(name, parentId)` existe
- [ ] Données de test insérées

### Frontend

- [ ] URL backend correcte dans `.env`
- [ ] Headers envoyés correctement
- [ ] Gestion d'erreur CORS dans les services
- [ ] Console du navigateur ne montre plus d'erreurs CORS

---

## 🚀 Commandes de déploiement

### Déployer sur Render

```bash
# 1. Pousser les modifications
git add .
git commit -m "fix: CORS configuration and categories endpoint"
git push origin main

# 2. Render va automatiquement redéployer

# 3. Appliquer les migrations en production (dans Render Shell)
npx prisma migrate deploy

# 4. Optionnel : Ajouter des seeds
npx prisma db seed
```

### Variables d'environnement Render

Vérifier dans Render Dashboard → Service → Environment :

```env
DATABASE_URL=postgresql://...
PORT=3004
NODE_ENV=production
CORS_ORIGIN=http://localhost:5174,https://printalma.com
```

---

## 🔧 Fix rapide temporaire (Frontend)

En attendant le fix backend, vous pouvez contourner temporairement :

```typescript
// src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// Fonction utilitaire pour les headers
const getHeaders = (includeUserId = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // NE PAS envoyer x-user-id en CORS jusqu'à ce que le backend l'autorise
  if (API_BASE_URL.includes('localhost') && includeUserId) {
    headers['x-user-id'] = '1';
  }

  return headers;
};

// Utiliser dans les appels
export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: getHeaders(false), // Sans x-user-id
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
```

---

## 📞 Support

Si les erreurs persistent :

1. **Vérifier les logs Render** : https://dashboard.render.com
2. **Tester localement** : Cloner le backend et tester en local
3. **Contacter l'équipe backend** : Envoyer les logs d'erreur

---

**✨ Une fois ces corrections appliquées, les erreurs CORS et 500 devraient être résolues !**
