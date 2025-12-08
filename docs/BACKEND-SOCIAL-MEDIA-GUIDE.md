# Documentation Backend - Gestion des Réseaux Sociaux Vendeurs

## 📋 Vue d'ensemble

Ce document décrit l'implémentation backend pour la gestion des réseaux sociaux des vendeurs sur la plateforme PrintAlma. Les vendeurs peuvent ajouter, modifier et supprimer leurs liens de réseaux sociaux qui seront affichés sur leur profil public.

## 🏗️ Architecture

### Structure des fichiers

```
backend/src/vendor/
├── dto/
│   └── vendor-social-media.dto.ts    # DTOs pour la validation
├── entities/
│   └── vendor.entity.ts              # Entité Vendeur mise à jour
├── services/
│   └── vendor-social-media.service.ts # Service métier
└── controllers/
    └── vendor-social-media.controller.ts # Contrôleur API
```

## 📊 Schéma de base de données

### Table `vendors`

La table `vendors` doit contenir les colonnes suivantes pour les réseaux sociaux :

```sql
ALTER TABLE vendors ADD COLUMN facebook_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN instagram_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN twitter_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN tiktok_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN youtube_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN linkedin_url VARCHAR(500);
```

**Contraintes :**
- Tous les champs sont `NULLABLE` (optionnels)
- Longueur maximale de 500 caractères
- Index pour optimiser les recherches

### Migration TypeORM

```typescript
// migration-file.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialMediaToVendors1234567890 implements MigrationInterface {
  name = 'AddSocialMediaToVendors1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vendors ADD COLUMN facebook_url VARCHAR(500) NULL;
      ALTER TABLE vendors ADD COLUMN instagram_url VARCHAR(500) NULL;
      ALTER TABLE vendors ADD COLUMN twitter_url VARCHAR(500) NULL;
      ALTER TABLE vendors ADD COLUMN tiktok_url VARCHAR(500) NULL;
      ALTER TABLE vendors ADD COLUMN youtube_url VARCHAR(500) NULL;
      ALTER TABLE vendors ADD COLUMN linkedin_url VARCHAR(500) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vendors DROP COLUMN facebook_url;
      ALTER TABLE vendors DROP COLUMN instagram_url;
      ALTER TABLE vendors DROP COLUMN twitter_url;
      ALTER TABLE vendors DROP COLUMN tiktok_url;
      ALTER TABLE vendors DROP COLUMN youtube_url;
      ALTER TABLE vendors DROP COLUMN linkedin_url;
    `);
  }
}
```

## 🎯 DTOs de Validation

### SocialMediaDto

Utilisé pour la création et la validation des réseaux sociaux :

```typescript
export class SocialMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/)
  facebook_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+$/)
  instagram_url?: string;

  // ... autres champs avec validation regex spécifique
}
```

### UpdateSocialMediaDto

Utilisé pour les mises à jour partielles :

```typescript
export class UpdateSocialMediaDto {
  @IsOptional()
  @IsString()
  facebook_url?: string;

  // ... autres champs sans validation stricte pour permettre les mises à jour partielles
}
```

## 🔌 Endpoints API

### 1. Récupérer les réseaux sociaux du vendeur

**GET** `/api/vendor/social-media`

**Description:** Récupère tous les liens de réseaux sociaux du vendeur connecté.

**Headers:**
```
Authorization: Bearer <token>
Cookie: <session_cookie>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "facebook_url": "https://facebook.com/monboutique",
    "instagram_url": "https://instagram.com/@monboutique",
    "twitter_url": null,
    "tiktok_url": "https://tiktok.com/@monboutique",
    "youtube_url": null,
    "linkedin_url": "https://linkedin.com/in/monboutique"
  },
  "message": "Réseaux sociaux récupérés avec succès"
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Non autorisé",
  "error": "Unauthorized"
}
```

### 2. Mettre à jour les réseaux sociaux

**PUT** `/api/vendor/social-media`

**Description:** Met à jour les réseaux sociaux du vendeur connecté.

**Headers:**
```
Authorization: Bearer <token>
Cookie: <session_cookie>
Content-Type: application/json
```

**Body:**
```json
{
  "facebook_url": "https://facebook.com/nouvelle-boutique",
  "instagram_url": "https://instagram.com/@nouvelle-boutique",
  "twitter_url": null,
  "tiktok_url": "https://tiktok.com/@nouvelle-boutique",
  "youtube_url": "https://youtube.com/channel/ma-chaine",
  "linkedin_url": "https://linkedin.com/in/mon-profile"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "facebook_url": "https://facebook.com/nouvelle-boutique",
    "instagram_url": "https://instagram.com/@nouvelle-boutique",
    "twitter_url": null,
    "tiktok_url": "https://tiktok.com/@nouvelle-boutique",
    "youtube_url": "https://youtube.com/channel/ma-chaine",
    "linkedin_url": "https://linkedin.com/in/mon-profile"
  },
  "message": "Réseaux sociaux mis à jour avec succès"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "facebook_url",
      "message": "L'URL Facebook n'est pas valide. Format attendu: https://facebook.com/votrepage"
    }
  ]
}
```

### 3. Supprimer un réseau social spécifique

**DELETE** `/api/vendor/social-media/{platform}`

**Description:** Supprime le lien d'un réseau social spécifique.

**Paramètres:**
- `platform`: `facebook` | `instagram` | `twitter` | `tiktok` | `youtube` | `linkedin`

**Headers:**
```
Authorization: Bearer <token>
Cookie: <session_cookie>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Réseau social Facebook supprimé avec succès"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Réseau social non trouvé"
}
```

## 🔧 Service Métier

### VendorSocialMediaService

```typescript
@Injectable()
export class VendorSocialMediaService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {}

  async getVendorSocialMedia(vendorId: number): Promise<SocialMediaResponseDto> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: vendorId },
      select: [
        'facebook_url', 'instagram_url', 'twitter_url',
        'tiktok_url', 'youtube_url', 'linkedin_url'
      ]
    });

    if (!vendor) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    return {
      facebook_url: vendor.facebook_url,
      instagram_url: vendor.instagram_url,
      twitter_url: vendor.twitter_url,
      tiktok_url: vendor.tiktok_url,
      youtube_url: vendor.youtube_url,
      linkedin_url: vendor.linkedin_url
    };
  }

  async updateVendorSocialMedia(
    vendorId: number,
    updateDto: UpdateSocialMediaDto
  ): Promise<SocialMediaResponseDto> {
    await this.vendorRepository.update(vendorId, updateDto);
    return this.getVendorSocialMedia(vendorId);
  }

  async deleteSocialMediaPlatform(
    vendorId: number,
    platform: string
  ): Promise<void> {
    const updateField = {};
    updateField[`${platform}_url`] = null;

    await this.vendorRepository.update(vendorId, updateField);
  }
}
```

## 🛡️ Sécurité

### Validation d'accès
- Seuls les vendeurs authentifiés peuvent accéder à leurs propres réseaux sociaux
- Validation du token JWT ou cookie de session
- Vérification que l'utilisateur connecté correspond bien au vendeur

### Validation des entrées
- Regex spécifique pour chaque plateforme
- Longueur maximale des URLs (500 caractères)
- Échappement des caractères spéciaux
- Prévention des attaques XSS

### Rate Limiting
- Limite de 10 requêtes par minute par vendeur pour les mises à jour
- Limite de 100 requêtes par minute pour la lecture

## 📝 Logs et Monitoring

### Niveaux de logs
```typescript
// Succès
logger.log(`Réseaux sociaux mis à jour pour vendeur ${vendorId}`);

// Erreurs
logger.error(`Erreur mise à jour réseaux sociaux: ${error.message}`);

// Avertissements
logger.warn(`Tentative d'accès non autorisée aux réseaux sociaux du vendeur ${vendorId}`);
```

### Métriques à surveiller
- Nombre de mises à jour de réseaux sociaux par jour
- Temps de réponse moyen des endpoints
- Taux d'erreurs par plateforme
- Usage par type de plateforme

## 🧪 Tests

### Tests Unitaires

```typescript
describe('VendorSocialMediaService', () => {
  let service: VendorSocialMediaService;
  let repository: Repository<Vendor>;

  beforeEach(async () => {
    // Setup
  });

  describe('getVendorSocialMedia', () => {
    it('should return social media links for existing vendor', async () => {
      // Test implementation
    });

    it('should throw NotFoundException for non-existing vendor', async () => {
      // Test implementation
    });
  });

  describe('updateVendorSocialMedia', () => {
    it('should update social media links successfully', async () => {
      // Test implementation
    });

    it('should validate URL format for each platform', async () => {
      // Test implementation
    });
  });
});
```

### Tests d'Intégration

```typescript
describe('VendorSocialMediaController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Setup application
  });

  describe('/api/vendor/social-media (GET)', () => {
    it('should return vendor social media', () => {
      // Test implementation
    });

    it('should require authentication', () => {
      // Test implementation
    });
  });

  describe('/api/vendor/social-media (PUT)', () => {
    it('should update social media successfully', () => {
      // Test implementation
    });

    it('should validate request body', () => {
      // Test implementation
    });
  });
});
```

## 🔄 Performance

### Optimisations
- Index sur les colonnes de réseaux sociaux
- Cache Redis pour les réseaux sociaux fréquemment consultés
- Requêtes asynchrones avec pool de connexions

### Cache Strategy
```typescript
// Clé de cache: vendor:social-media:{vendorId}
// TTL: 1 heure

const socialMedia = await this.cacheManager.get(
  `vendor:social-media:${vendorId}`
);

if (!socialMedia) {
  const data = await this.getVendorSocialMedia(vendorId);
  await this.cacheManager.set(
    `vendor:social-media:${vendorId}`,
    data,
    3600000 // 1 heure
  );
}
```

## 🚀 Déploiement

### Variables d'environnement

```env
# Validation URLs
SOCIAL_MEDIA_FACEBOOK_REGEX="^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$"
SOCIAL_MEDIA_INSTAGRAM_REGEX="^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+$"

# Rate Limiting
SOCIAL_MEDIA_RATE_LIMIT_REQUESTS=10
SOCIAL_MEDIA_RATE_LIMIT_WINDOW=60000

# Cache
SOCIAL_MEDIA_CACHE_TTL=3600000
```

### Health Check

```typescript
@Get('health')
async checkHealth(): Promise<{ status: string; timestamp: string }> {
  return {
    status: 'OK',
    timestamp: new Date().toISOString()
  };
}
```

## 🔍 Monitoring et Debug

### Endpoints de debug
- `/api/vendor/social-media/debug` : Affiche les informations de debug (seulement en développement)

### Stats New Relic
```typescript
import * as newrelic from 'newrelic';

// Custom metrics
newrelic.recordMetric('Custom/SocialMedia/Update', 1);
newrelic.recordMetric('Custom/SocialMedia/ResponseTime', responseTime);
```

## 📚 Références

- [Documentation NestJS](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [Swagger Documentation](https://swagger.io/)

---

**Version:** 1.0.0
**Dernière mise à jour:** 08/12/2025
**Auteur:** Équipe PrintAlma Backend