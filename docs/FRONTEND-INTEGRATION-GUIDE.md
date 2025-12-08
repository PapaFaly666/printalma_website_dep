# Guide d'Intégration Frontend - Système de Galerie Vendeur

Ce guide fournit toutes les informations nécessaires pour intégrer le système de galerie vendeur dans votre application frontend.

---

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Authentification](#authentification)
3. [Endpoints API](#endpoints-api)
4. [Types TypeScript](#types-typescript)
5. [Services/API Client](#servicesapi-client)
6. [Composants React exemples](#composants-react-exemples)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Bonnes pratiques](#bonnes-pratiques)

---

## Configuration initiale

### Variables d'environnement

```env
# Dans votre fichier .env
VITE_API_URL=http://localhost:3004
```

### Configuration API

Le projet utilise déjà `src/config/api.ts` :

```typescript
// src/config/api.ts (déjà existant)
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3004',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};
```

---

## Authentification

Tous les endpoints vendeur nécessitent l'authentification. Le projet utilise déjà le contexte `AuthContext`.

```typescript
// Utilisation dans les composants
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isVendeur } = useAuth();

  // Vérifier si l'utilisateur est un vendeur
  if (!isVendeur()) {
    return <Navigate to="/login" />;
  }

  // Utiliser les services (le token est géré automatiquement via cookies)
}
```

**Note importante** : Les cookies httpOnly sont gérés automatiquement par le backend. Pas besoin de gérer manuellement le token JWT côté frontend.

---

## Endpoints API

### Base URL

```
http://localhost:3004/api
```

### 📌 Endpoints Vendeur (Protégés - Authentification requise)

| Méthode | Endpoint | Description | Body/Params |
|---------|----------|-------------|-------------|
| POST | `/vendor/galleries` | Créer une galerie | FormData (images + data) |
| GET | `/vendor/galleries` | Lister ses galeries | ?page=1&limit=10&status=DRAFT |
| GET | `/vendor/galleries/:id` | Voir une galerie | - |
| PUT | `/vendor/galleries/:id` | Modifier une galerie | JSON (title, description, status) |
| DELETE | `/vendor/galleries/:id` | Supprimer (soft delete) | - |
| PATCH | `/vendor/galleries/:id/publish` | Publier/Dépublier | { is_published: boolean } |

### 🌍 Endpoints Publics (Sans authentification)

| Méthode | Endpoint | Description | Params |
|---------|----------|-------------|--------|
| GET | `/public/galleries` | Galeries publiées | ?page=1&limit=12&vendorId=123 |
| GET | `/public/galleries/:id` | Voir une galerie publiée | - |

---

## Types TypeScript

Le fichier `src/types/gallery.ts` contient déjà les types de base. Voici les types additionnels pour l'intégration backend :

```typescript
// src/types/gallery.ts (compléter avec ces types)

// Type pour les informations vendeur (endpoints publics)
export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  shop_name?: string;
  profile_photo_url?: string;
}

// Galerie avec info vendeur (pour endpoints publics)
export interface PublicGallery extends Gallery {
  vendor: VendorInfo;
}

// Réponse API avec pagination
export interface GalleryListResponse {
  success: boolean;
  data: {
    galleries: Gallery[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Réponse API simple
export interface GalleryResponse {
  success: boolean;
  message?: string;
  data?: Gallery;
}

// DTO pour création (déjà partiellement existant)
export interface CreateGalleryRequest {
  title: string;
  description?: string;
  images: File[]; // Exactement 5 fichiers
  captions?: Array<{ caption?: string }>;
}

// DTO pour mise à jour (déjà partiellement existant)
export interface UpdateGalleryRequest {
  id: number;
  title?: string;
  description?: string;
  status?: GalleryStatus;
  isPublished?: boolean;
}

// DTO pour publication
export interface TogglePublishRequest {
  is_published: boolean;
}
```

---

## Services/API Client

### Mise à jour du service existant

Le fichier `src/services/gallery.service.ts` existe déjà. Voici les modifications à apporter pour l'intégration complète :

```typescript
// src/services/gallery.service.ts (version complète)

import axios from 'axios';
import {
  Gallery,
  GalleryListResponse,
  GalleryResponse,
  CreateGalleryRequest,
  UpdateGalleryRequest,
  GalleryStatus,
  PublicGallery
} from '../types/gallery';
import { API_CONFIG } from '../config/api';

const GALLERY_API_URL = `${API_CONFIG.BASE_URL}/api/vendor/galleries`;
const PUBLIC_GALLERY_API_URL = `${API_CONFIG.BASE_URL}/api/public/galleries`;

class GalleryService {

  // ========== ENDPOINTS VENDEUR (Protégés) ==========

  /**
   * Créer une nouvelle galerie
   */
  async createGallery(data: {
    title: string;
    description?: string;
    images: File[];
    captions?: string[];
  }): Promise<Gallery> {
    try {
      // Validation côté client
      if (data.images.length !== 5) {
        throw new Error('Une galerie doit contenir exactement 5 images');
      }

      const formData = new FormData();
      formData.append('title', data.title);

      if (data.description) {
        formData.append('description', data.description);
      }

      // Ajouter les images
      data.images.forEach((image) => {
        formData.append('images', image);
      });

      // Ajouter les légendes si présentes
      if (data.captions && data.captions.length > 0) {
        const captionsArray = data.captions.map(caption => ({ caption }));
        formData.append('captions', JSON.stringify(captionsArray));
      }

      const response = await axios.post(GALLERY_API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true // Important pour les cookies httpOnly
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la création de la galerie');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur createGallery:', error);

      if (error.response?.data?.errors) {
        // Erreurs de validation express-validator
        const errorMessages = error.response.data.errors
          .map((err: any) => err.msg)
          .join(', ');
        throw new Error(errorMessages);
      }

      throw new Error(
        error.response?.data?.message || error.message || 'Erreur lors de la création de la galerie'
      );
    }
  }

  /**
   * Récupérer toutes les galeries du vendeur connecté
   */
  async getVendorGalleries(
    page: number = 1,
    limit: number = 10,
    status?: GalleryStatus
  ): Promise<GalleryListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) {
        params.append('status', status);
      }

      const response = await axios.get(`${GALLERY_API_URL}?${params.toString()}`, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération des galeries');
      }

      return response.data;
    } catch (error: any) {
      console.error('Erreur getVendorGalleries:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération des galeries'
      );
    }
  }

  /**
   * Récupérer une galerie par ID
   */
  async getGalleryById(galleryId: number): Promise<Gallery> {
    try {
      const response = await axios.get(`${GALLERY_API_URL}/${galleryId}`, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération de la galerie');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur getGalleryById:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération de la galerie'
      );
    }
  }

  /**
   * Mettre à jour une galerie existante
   */
  async updateGallery(galleryId: number, data: {
    title?: string;
    description?: string;
    status?: GalleryStatus;
    isPublished?: boolean;
  }): Promise<Gallery> {
    try {
      const response = await axios.put(`${GALLERY_API_URL}/${galleryId}`, data, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour de la galerie');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur updateGallery:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la mise à jour de la galerie'
      );
    }
  }

  /**
   * Supprimer une galerie (soft delete)
   */
  async deleteGallery(galleryId: number): Promise<void> {
    try {
      const response = await axios.delete(`${GALLERY_API_URL}/${galleryId}`, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la suppression de la galerie');
      }
    } catch (error: any) {
      console.error('Erreur deleteGallery:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la suppression de la galerie'
      );
    }
  }

  /**
   * Publier ou dépublier une galerie
   */
  async togglePublishGallery(galleryId: number, isPublished: boolean): Promise<void> {
    try {
      const response = await axios.patch(
        `${GALLERY_API_URL}/${galleryId}/publish`,
        { is_published: isPublished },
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la publication de la galerie');
      }
    } catch (error: any) {
      console.error('Erreur togglePublishGallery:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la publication de la galerie'
      );
    }
  }

  // ========== ENDPOINTS PUBLICS (Sans authentification) ==========

  /**
   * Récupérer toutes les galeries publiées (endpoint public)
   */
  async getPublicGalleries(
    page: number = 1,
    limit: number = 12,
    vendorId?: number
  ): Promise<{ galleries: PublicGallery[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (vendorId) {
        params.append('vendorId', vendorId.toString());
      }

      const response = await axios.get(`${PUBLIC_GALLERY_API_URL}?${params.toString()}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération des galeries publiques');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur getPublicGalleries:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération des galeries publiques'
      );
    }
  }

  /**
   * Récupérer une galerie publiée spécifique (endpoint public)
   */
  async getPublicGalleryById(galleryId: number): Promise<PublicGallery> {
    try {
      const response = await axios.get(`${PUBLIC_GALLERY_API_URL}/${galleryId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération de la galerie');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur getPublicGalleryById:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération de la galerie'
      );
    }
  }

  // ========== UTILITAIRES ==========

  /**
   * Valider les fichiers avant upload
   */
  validateImages(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const GALLERY_CONSTRAINTS = {
      IMAGES_COUNT: 5,
      MAX_IMAGE_SIZE: 5 * 1024 * 1024,
      ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    };

    if (files.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      errors.push(`Vous devez sélectionner exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`);
    }

    files.forEach((file, index) => {
      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.type)) {
        errors.push(`Image ${index + 1}: Format non supporté (${file.type})`);
      }

      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`Image ${index + 1}: Taille trop grande (${sizeMB}MB, max 5MB)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const galleryService = new GalleryService();
export default galleryService;
```

---

## Composants React exemples

### 1. Hook personnalisé pour charger les galeries

```typescript
// src/hooks/useVendorGalleries.ts
import { useState, useEffect } from 'react';
import { galleryService } from '../services/gallery.service';
import type { Gallery, GalleryStatus } from '../types/gallery';

export function useVendorGalleries(
  page: number = 1,
  limit: number = 10,
  status?: GalleryStatus
) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await galleryService.getVendorGalleries(page, limit, status);
      setGalleries(response.data.galleries);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des galeries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [page, limit, status]);

  return { galleries, pagination, loading, error, refetch };
}
```

### 2. Composant de liste avec actions

```tsx
// src/components/vendor/GalleryListWithActions.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useVendorGalleries } from '../../hooks/useVendorGalleries';
import { galleryService } from '../../services/gallery.service';
import { GalleryStatus } from '../../types/gallery';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { MoreVertical, Trash2, Eye, Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function GalleryListWithActions() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<GalleryStatus | undefined>();
  const { galleries, pagination, loading, error, refetch } = useVendorGalleries(
    page,
    10,
    statusFilter
  );

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Supprimer la galerie "${title}" ?`)) {
      return;
    }

    try {
      await galleryService.deleteGallery(id);
      toast.success('Galerie supprimée avec succès');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await galleryService.togglePublishGallery(id, !currentStatus);
      toast.success(currentStatus ? 'Galerie dépubliée' : 'Galerie publiée');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres de statut */}
      <div className="flex gap-2">
        <Button
          variant={!statusFilter ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          Toutes
        </Button>
        <Button
          variant={statusFilter === GalleryStatus.PUBLISHED ? 'default' : 'outline'}
          onClick={() => setStatusFilter(GalleryStatus.PUBLISHED)}
        >
          Publiées
        </Button>
        <Button
          variant={statusFilter === GalleryStatus.DRAFT ? 'default' : 'outline'}
          onClick={() => setStatusFilter(GalleryStatus.DRAFT)}
        >
          Brouillons
        </Button>
        <Button
          variant={statusFilter === GalleryStatus.ARCHIVED ? 'default' : 'outline'}
          onClick={() => setStatusFilter(GalleryStatus.ARCHIVED)}
        >
          Archivées
        </Button>
      </div>

      {/* Grille de galeries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleries.map((gallery) => (
          <Card key={gallery.id} className="overflow-hidden">
            <div className="aspect-square relative">
              {gallery.images[0] && (
                <img
                  src={gallery.images[0].imageUrl}
                  alt={gallery.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{gallery.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {/* Navigation vers détail */}}>
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* Navigation vers édition */}}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(gallery.id!, gallery.title)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {gallery.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {gallery.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Badge variant={gallery.isPublished ? 'default' : 'secondary'}>
                  {gallery.isPublished ? 'Publiée' : 'Brouillon'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {gallery.images.length} images
                </span>
              </div>

              <Button
                className="w-full mt-3"
                variant={gallery.isPublished ? 'outline' : 'default'}
                onClick={() => handleTogglePublish(gallery.id!, gallery.isPublished)}
              >
                {gallery.isPublished ? 'Dépublier' : 'Publier'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm">
            Page {page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 3. Intégration dans VendorGalleryPage existante

Pour connecter l'API au composant `VendorGalleryPage` existant, modifiez la fonction `loadGalleries` :

```typescript
// src/pages/vendor/VendorGalleryPage.tsx

// ❌ SUPPRIMER ce code (mock data)
const loadGalleries = async () => {
  setIsLoading(true);
  try {
    const mockGalleries: Gallery[] = [
      // ... mock data
    ];
    setGalleries(mockGalleries);
  } catch (error) {
    toast.error('Erreur lors du chargement des galeries');
  } finally {
    setIsLoading(false);
  }
};

// ✅ REMPLACER par ce code (API réelle)
const loadGalleries = async () => {
  setIsLoading(true);
  try {
    const response = await galleryService.getVendorGalleries(1, 100); // Charger toutes
    setGalleries(response.data.galleries);
  } catch (error: any) {
    toast.error(error.message || 'Erreur lors du chargement des galeries');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

Et modifier `handleCreateGallery` :

```typescript
// Dans handleCreateGallery, remplacer le code TODO par :

const handleCreateGallery = async () => {
  if (!validateForm()) {
    toast.error('Veuillez corriger les erreurs du formulaire');
    return;
  }

  setIsLoading(true);
  try {
    await galleryService.createGallery({
      title: formData.title,
      description: formData.description,
      images: formData.images.map(img => img.file!),
      captions: formData.captions.filter(c => c.trim() !== '')
    });

    toast.success('Galerie créée avec succès');
    setIsCreateDialogOpen(false);
    resetForm();
    loadGalleries(); // Recharger la liste
  } catch (error: any) {
    toast.error(error.message || 'Erreur lors de la création de la galerie');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Gestion des erreurs

### Intercepteur Axios global (optionnel)

```typescript
// src/utils/axiosInterceptor.ts
import axios from 'axios';
import { toast } from 'sonner';

// Intercepteur de réponse pour gérer les erreurs globalement
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          toast.error('Session expirée. Veuillez vous reconnecter.');
          // Rediriger vers login si nécessaire
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Accès refusé');
          break;
        case 404:
          toast.error('Ressource non trouvée');
          break;
        case 413:
          toast.error('Fichier trop volumineux (max 5MB par image)');
          break;
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
        default:
          toast.error(data.message || 'Une erreur est survenue');
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur');
    } else {
      toast.error(error.message || 'Une erreur est survenue');
    }

    return Promise.reject(error);
  }
);
```

---

## Bonnes pratiques

### ✅ À faire

1. **Validation côté client avant l'upload**
   ```typescript
   const validation = galleryService.validateImages(files);
   if (!validation.valid) {
     validation.errors.forEach(error => toast.error(error));
     return;
   }
   ```

2. **Feedback utilisateur avec Sonner (déjà installé)**
   ```typescript
   toast.success('Galerie créée avec succès!');
   toast.error('Erreur lors de la création');
   toast.loading('Création en cours...');
   ```

3. **Gestion du loading state**
   ```typescript
   setIsLoading(true);
   try {
     await galleryService.createGallery(data);
   } finally {
     setIsLoading(false);
   }
   ```

4. **Prévisualisation des images**
   ```typescript
   const preview = URL.createObjectURL(file);
   // Utiliser preview
   // Ne pas oublier de nettoyer
   useEffect(() => {
     return () => URL.revokeObjectURL(preview);
   }, [preview]);
   ```

5. **Utiliser withCredentials pour les cookies**
   ```typescript
   axios.get(url, { withCredentials: true });
   ```

### ❌ À éviter

1. **Ne pas uploader sans validation**
2. **Ne pas ignorer les erreurs**
3. **Ne pas stocker le token en localStorage** (géré par cookies httpOnly)
4. **Ne pas oublier de libérer les Object URLs**
5. **Ne pas hardcoder l'URL de l'API**

---

## Checklist d'intégration

### Backend
- [ ] Backend déployé sur `http://localhost:3004`
- [ ] Tables créées (vendor_galleries, gallery_images)
- [ ] Cloudinary configuré (ou stockage local)
- [ ] Endpoints testés avec Postman/Thunder Client
- [ ] CORS configuré pour autoriser `http://localhost:5174`

### Frontend
- [x] Types TypeScript mis à jour (`src/types/gallery.ts`)
- [x] Service API créé (`src/services/gallery.service.ts`)
- [ ] Mock data remplacé par vrais appels API dans `VendorGalleryPage`
- [ ] Tests de création de galerie
- [ ] Tests de modification de galerie
- [ ] Tests de suppression de galerie
- [ ] Tests de publication/dépublication
- [ ] Gestion des erreurs testée
- [ ] Loading states vérifiés

---

## Exemples de requêtes cURL

### Créer une galerie

```bash
curl -X POST http://localhost:3004/api/vendor/galleries \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -F "title=Ma Galerie Test" \
  -F "description=Description de test" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "images=@/path/to/image4.jpg" \
  -F "images=@/path/to/image5.jpg" \
  -F 'captions=[{"caption":"Image 1"},{"caption":"Image 2"}]'
```

### Lister les galeries

```bash
curl -X GET "http://localhost:3004/api/vendor/galleries?page=1&limit=10" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Publier une galerie

```bash
curl -X PATCH http://localhost:3004/api/vendor/galleries/1/publish \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_published": true}'
```

---

## Support et Documentation

- **Backend Guide**: `docs/BACKEND-GALLERY-GUIDE.md`
- **Code Examples**: `docs/GALLERY-CODE-EXAMPLES.md`
- **UI Demo**: `docs/GALLERY-UI-DEMO.md`
- **README**: `docs/README-Gallery-System.md`

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024-12-07
**Version**: 1.0.0
