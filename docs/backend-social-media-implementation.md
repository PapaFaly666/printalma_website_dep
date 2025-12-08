# Documentation Backend - Implémentation des Réseaux Sociaux pour Vendeurs

## 📋 Vue d'ensemble

Ce document décrit l'implémentation nécessaire côté backend pour gérer les réseaux sociaux des vendeurs dans la plateforme PrintAlma.

## 🗄️ Structure de la Base de Données

### 1. Table `vendors` (Mise à jour)

Ajouter les colonnes suivantes à la table existante `vendors` :

```sql
ALTER TABLE vendors ADD COLUMN facebook_url VARCHAR(500) NULL;
ALTER TABLE vendors ADD COLUMN instagram_url VARCHAR(500) NULL;
ALTER TABLE vendors ADD COLUMN twitter_url VARCHAR(500) NULL;
ALTER TABLE vendors ADD COLUMN tiktok_url VARCHAR(500) NULL;
ALTER TABLE vendors ADD COLUMN youtube_url VARCHAR(500) NULL;
ALTER TABLE vendors ADD COLUMN linkedin_url VARCHAR(500) NULL;
```

### 2. Migration Laravel (si applicable)

Créer un fichier de migration :

```php
// database/migrations/YYYY_MM_DD_HHMMSS_add_social_media_to_vendors_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSocialMediaToVendorsTable extends Migration
{
    public function up()
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('facebook_url', 500)->nullable()->after('shop_name');
            $table->string('instagram_url', 500)->nullable()->after('facebook_url');
            $table->string('twitter_url', 500)->nullable()->after('instagram_url');
            $table->string('tiktok_url', 500)->nullable()->after('twitter_url');
            $table->string('youtube_url', 500)->nullable()->after('tiktok_url');
            $table->string('linkedin_url', 500)->nullable()->after('youtube_url');
        });
    }

    public function down()
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'facebook_url',
                'instagram_url',
                'twitter_url',
                'tiktok_url',
                'youtube_url',
                'linkedin_url'
            ]);
        });
    }
}
```

### 3. Modèle Vendor (Mise à jour)

```php
// app/Models/Vendor.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    protected $fillable = [
        'user_id',
        'shop_name',
        'phone',
        'country',
        'address',
        'facebook_url',
        'instagram_url',
        'twitter_url',
        'tiktok_url',
        'youtube_url',
        'linkedin_url',
        // ... autres champs
    ];

    protected $casts = [
        'facebook_url' => 'string',
        'instagram_url' => 'string',
        'twitter_url' => 'string',
        'tiktok_url' => 'string',
        'youtube_url' => 'string',
        'linkedin_url' => 'string',
    ];
}
```

## 🔌 API Endpoints

### 1. Mise à jour du Profil Vendeur

**Endpoint existant à modifier :**
```
PUT /api/auth/vendor/profile
```

**Corps de la requête (Request Body) :**
```json
{
  "userId": 123,
  "shop_name": "Ma Boutique",
  "phone": "+221 77 123 45 67",
  "country": "Sénégal",
  "address": "Dakar, Sénégal",
  "facebook_url": "https://facebook.com/maboutique",
  "instagram_url": "https://instagram.com/@maboutique",
  "twitter_url": "https://x.com/maboutique",
  "tiktok_url": "https://tiktok.com/@maboutique",
  "youtube_url": "https://youtube.com/channel/maboutique",
  "linkedin_url": "https://linkedin.com/company/maboutique"
}
```

### 2. Réponse API

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Profil vendeur mis à jour avec succès",
  "vendor": {
    "id": 123,
    "user_id": 456,
    "shop_name": "Ma Boutique",
    "phone": "+221 77 123 45 67",
    "country": "Sénégal",
    "address": "Dakar, Sénégal",
    "facebook_url": "https://facebook.com/maboutique",
    "instagram_url": "https://instagram.com/@maboutique",
    "twitter_url": "https://x.com/maboutique",
    "tiktok_url": "https://tiktok.com/@maboutique",
    "youtube_url": "https://youtube.com/channel/maboutique",
    "linkedin_url": "https://linkedin.com/company/maboutique",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Réponse erreur (400/422) :**
```json
{
  "success": false,
  "message": "Erreur lors de la mise à jour du profil",
  "errors": {
    "facebook_url": ["L'URL Facebook n'est pas valide"],
    "instagram_url": ["L'URL Instagram doit commencer par https://instagram.com"]
  }
}
```

## 💻 Implémentation du Contrôleur

### 1. Validation des Réseaux Sociaux

Créer une classe de validation :

```php
// app/Validators/SocialMediaValidator.php
<?php

namespace App\Validators;

class SocialMediaValidator
{
    public static function validate($platform, $url)
    {
        if (empty($url)) {
            return true; // Les champs sont optionnels
        }

        $patterns = [
            'facebook_url' => '/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i',
            'instagram_url' => '/^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i',
            'twitter_url' => '/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/i',
            'tiktok_url' => '/^(https?:\/\/)?(www\.)?(tiktok\.com)\/@.+/i',
            'youtube_url' => '/^(https?:\/\/)?(www\.)?(youtube\.com\/(channel|c|user)\/.+|youtu\.be\/.+)/i',
            'linkedin_url' => '/^(https?:\/\/)?(www\.)?(linkedin\.com\/(in|company)\/.+)/i'
        ];

        if (!isset($patterns[$platform])) {
            return false;
        }

        return preg_match($patterns[$platform], $url);
    }

    public static function getValidationRules()
    {
        return [
            'facebook_url' => 'nullable|string|max:500|url',
            'instagram_url' => 'nullable|string|max:500|url',
            'twitter_url' => 'nullable|string|max:500|url',
            'tiktok_url' => 'nullable|string|max:500|url',
            'youtube_url' => 'nullable|string|max:500|url',
            'linkedin_url' => 'nullable|string|max:500|url',
        ];
    }
}
```

### 2. Mise à jour du Contrôleur

```php
// app/Http/Controllers/Auth/VendorController.php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Validators\SocialMediaValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendorController extends Controller
{
    public function updateProfile(Request $request)
    {
        try {
            // Validation de base
            $validated = $request->validate([
                'userId' => 'required|exists:users,id',
                'shop_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:100',
                'address' => 'nullable|string|max:500',
                'facebook_url' => 'nullable|string|max:500',
                'instagram_url' => 'nullable|string|max:500',
                'twitter_url' => 'nullable|string|max:500',
                'tiktok_url' => 'nullable|string|max:500',
                'youtube_url' => 'nullable|string|max:500',
                'linkedin_url' => 'nullable|string|max:500',
            ]);

            // Validation personnalisée des réseaux sociaux
            $socialPlatforms = [
                'facebook_url', 'instagram_url', 'twitter_url',
                'tiktok_url', 'youtube_url', 'linkedin_url'
            ];

            foreach ($socialPlatforms as $platform) {
                if (!empty($validated[$platform])) {
                    if (!SocialMediaValidator::validate($platform, $validated[$platform])) {
                        throw ValidationException::withMessages([
                            $platform => "L'URL $platform n'est pas valide"
                        ]);
                    }
                }
            }

            // Mise à jour en base de données
            DB::beginTransaction();

            $vendor = Vendor::where('user_id', $validated['userId'])->first();

            if (!$vendor) {
                // Créer le vendor s'il n'existe pas
                $vendor = Vendor::create([
                    'user_id' => $validated['userId'],
                    'shop_name' => $validated['shop_name'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'country' => $validated['country'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'facebook_url' => $validated['facebook_url'] ?? null,
                    'instagram_url' => $validated['instagram_url'] ?? null,
                    'twitter_url' => $validated['twitter_url'] ?? null,
                    'tiktok_url' => $validated['tiktok_url'] ?? null,
                    'youtube_url' => $validated['youtube_url'] ?? null,
                    'linkedin_url' => $validated['linkedin_url'] ?? null,
                ]);
            } else {
                // Mise à jour du vendor existant
                $vendor->update([
                    'shop_name' => $validated['shop_name'] ?? $vendor->shop_name,
                    'phone' => $validated['phone'] ?? $vendor->phone,
                    'country' => $validated['country'] ?? $vendor->country,
                    'address' => $validated['address'] ?? $vendor->address,
                    'facebook_url' => $validated['facebook_url'] ?? $vendor->facebook_url,
                    'instagram_url' => $validated['instagram_url'] ?? $vendor->instagram_url,
                    'twitter_url' => $validated['twitter_url'] ?? $vendor->twitter_url,
                    'tiktok_url' => $validated['tiktok_url'] ?? $vendor->tiktok_url,
                    'youtube_url' => $validated['youtube_url'] ?? $vendor->youtube_url,
                    'linkedin_url' => $validated['linkedin_url'] ?? $vendor->linkedin_url,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profil vendeur mis à jour avec succès',
                'vendor' => $vendor->fresh()
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil: ' . $e->getMessage()
            ], 500);
        }
    }
}
```

### 3. Routes API

```php
// routes/api.php
<?php

use App\Http\Controllers\Auth\VendorController;

// Profile vendeur
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/vendor/profile', [VendorController::class, 'updateProfile']);
});
```

## 📊 Réponses pour le Frontend

### 1. Format de réponse pour le profil vendeur étendu

Le frontend attend ce format dans la réponse :

```json
{
  "success": true,
  "vendor": {
    "id": 123,
    "firstName": "Aliou",
    "lastName": "Ba",
    "email": "aliou.ba@example.com",
    "vendeur_type": "DESIGNER",
    "phone": "+221 77 123 45 67",
    "country": "Sénégal",
    "address": "Dakar, Sénégal",
    "shop_name": "Créations Aliou",
    "profile_photo_url": "https://example.com/photos/vendor_123.jpg",
    "facebook_url": "https://facebook.com/maboutique",
    "instagram_url": "https://instagram.com/@maboutique",
    "twitter_url": "https://x.com/maboutique",
    "tiktok_url": "https://tiktok.com/@maboutique",
    "youtube_url": "https://youtube.com/channel/maboutique",
    "linkedin_url": "https://linkedin.com/company/maboutique",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-15T09:00:00Z"
  }
}
```

## 🧪 Tests

### 1. Tests Unitaires

```php
// tests/Unit/SocialMediaValidatorTest.php
<?php

namespace Tests\Unit;

use App\Validators\SocialMediaValidator;
use PHPUnit\Framework\TestCase;

class SocialMediaValidatorTest extends TestCase
{
    public function testFacebookUrlValidation()
    {
        $this->assertTrue(SocialMediaValidator::validate('facebook_url', 'https://facebook.com/maboutique'));
        $this->assertTrue(SocialMediaValidator::validate('facebook_url', 'https://www.facebook.com/maboutique'));
        $this->assertFalse(SocialMediaValidator::validate('facebook_url', 'https://google.com'));
        $this->assertTrue(SocialMediaValidator::validate('facebook_url', '')); // Vide = valide
    }

    public function testInstagramUrlValidation()
    {
        $this->assertTrue(SocialMediaValidator::validate('instagram_url', 'https://instagram.com/@maboutique'));
        $this->assertFalse(SocialMediaValidator::validate('instagram_url', 'https://facebook.com'));
    }

    // ... autres tests pour chaque plateforme
}
```

### 2. Tests API

```php
// tests/Feature/VendorProfileTest.php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorProfileTest extends TestCase
{
    use RefreshDatabase;

    public function testUpdateVendorProfileWithSocialMedia()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/auth/vendor/profile', [
            'userId' => $user->id,
            'shop_name' => 'Ma Boutique',
            'facebook_url' => 'https://facebook.com/maboutique',
            'instagram_url' => 'https://instagram.com/@maboutique'
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'vendor' => [
                        'shop_name' => 'Ma Boutique',
                        'facebook_url' => 'https://facebook.com/maboutique',
                        'instagram_url' => 'https://instagram.com/@maboutique'
                    ]
                ]);
    }

    public function testInvalidSocialMediaUrl()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/auth/vendor/profile', [
            'userId' => $user->id,
            'facebook_url' => 'https://google.com' // URL invalide pour Facebook
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'errors' => [
                        'facebook_url' => ['L\'URL facebook_url n\'est pas valide']
                    ]
                ]);
    }
}
```

## 🚀 Déploiement

### 1. Étapes de déploiement

1. **Migration de la base de données :**
   ```bash
   php artisan migrate
   ```

2. **Validation de la migration :**
   ```sql
   DESC vendors;
   -- Vérifier que les colonnes social media sont bien ajoutées
   ```

3. **Test de l'API :**
   ```bash
   # Test avec Postman ou curl
   curl -X PUT "http://localhost:3004/api/auth/vendor/profile" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"userId": 1, "facebook_url": "https://facebook.com/test"}'
   ```

### 2. Monitoring

- Surveiller les logs d'erreurs pour les validations
- Vérifier l'utilisation des nouveaux champs
- Monitorer les performances des requêtes

## 📝 Notes Importantes

1. **Sécurité :** Toujours valider et nettoyer les URLs entrantes
2. **Performance :** Les champs sont optionnels pour ne pas impacter les performances
3. **Backward Compatibility :** L'implémentation est rétrocompatible avec les données existantes
4. **Frontend :** Le frontend gère déjà l'affichage et l'édition de ces champs

## 🔧 Débogage

### Problèmes courants :

1. **Migration échoue :** Vérifier que la table `vendors` existe
2. **URL invalide :** Vérifier les regex dans `SocialMediaValidator`
3. **Permission refusée :** Vérifier que l'utilisateur est authentifié
4. **Vendor non trouvé :** Vérifier la relation `user_id` dans la table `vendors`

### Logs à vérifier :

```bash
# Logs Laravel
tail -f storage/logs/laravel.log

# Logs erreurs Apache/Nginx
tail -f /var/log/apache2/error.log
tail -f /var/log/nginx/error.log
```