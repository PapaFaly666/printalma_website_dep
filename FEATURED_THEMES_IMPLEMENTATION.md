# Système de Configuration des Thèmes Tendances

## Vue d'ensemble

Ce système permet aux administrateurs de configurer dynamiquement les thèmes affichés dans la section "Thèmes tendances" du landing page. L'interface offre un contrôle complet avec drag & drop pour l'ordonnancement.

## Architecture

### 1. Backend API (à implémenter côté serveur)

Deux nouveaux endpoints sont nécessaires :

#### GET `/design-categories/featured`
- **Accès** : Public (pas d'authentification requise)
- **Description** : Récupère les thèmes marqués comme "featured" triés par `featuredOrder`
- **Réponse** : `DesignCategory[]` (maximum 5 thèmes)

```typescript
// Exemple de réponse
[
  {
    id: 1,
    name: "MANGAS ET ANIME",
    coverImageUrl: "https://...",
    isFeatured: true,
    featuredOrder: 1,
    designCount: 45,
    // ... autres champs
  },
  // ... jusqu'à 5 thèmes
]
```

#### PUT `/design-categories/admin/featured`
- **Accès** : Admin uniquement
- **Description** : Met à jour la configuration des thèmes en vedette
- **Body** : `{ categoryIds: number[] }` (ordre important)
- **Traitement** :
  1. Marquer tous les thèmes comme `isFeatured = false`
  2. Pour chaque ID dans le tableau (dans l'ordre) :
     - Marquer `isFeatured = true`
     - Définir `featuredOrder = index + 1`
- **Réponse** : `DesignCategory[]` (thèmes mis à jour)

### 2. Frontend - Service Layer

**Fichier** : `src/services/designCategoryService.ts`

Ajouts :
- Types `isFeatured` et `featuredOrder` dans `DesignCategory`
- Méthode `getFeaturedCategories()` : Récupère les thèmes en vedette
- Méthode `updateFeaturedCategories(categoryIds: number[])` : Met à jour la configuration

### 3. Interface Admin

**Fichier** : `src/pages/admin/FeaturedThemesManager.tsx`
**Route** : `/admin/featured-themes`

#### Fonctionnalités :

1. **Vue d'ensemble**
   - Statistiques : thèmes configurés (X/5), thèmes disponibles, designs totaux
   - Indication visuelle des changements non enregistrés

2. **Liste des thèmes en vedette**
   - Drag & drop pour réorganiser (glisser-déposer)
   - Badge avec numéro d'ordre (#1, #2, etc.)
   - Aperçu de l'image de couverture
   - Nom, description et nombre de designs
   - Bouton de suppression

3. **Dialog d'ajout**
   - Grille des thèmes disponibles (actifs uniquement)
   - Filtre automatique (exclut les thèmes déjà en vedette)
   - Limite de 5 thèmes maximum
   - Sélection par clic

4. **Gestion des changements**
   - Boutons "Annuler" et "Enregistrer" apparaissent automatiquement
   - Indicateur visuel pendant le drag & drop
   - Toasts de confirmation/erreur

### 4. Page Publique

**Fichier** : `src/pages/ThemesTendances.tsx`

#### Comportement :

1. **Chargement**
   - Appel API automatique au montage du composant
   - Affichage d'un loader pendant le chargement
   - Gestion d'erreur avec message approprié

2. **Affichage**
   - Si aucun thème : la section n'est pas affichée
   - Layout responsive préservé (mobile-first)
   - 5 positions fixes dans le layout :
     - Position 1 : Grande carte principale (col-span-1)
     - Position 2 : Carte haute à droite (row-span-2)
     - Position 3 : Carte petite en haut
     - Position 4 : Carte haute (cachée sur mobile)
     - Position 5 : Carte petite en bas

3. **Images**
   - Utilise `coverImageUrl` de chaque thème
   - Placeholder si pas d'image
   - Nom du thème en majuscules

## Structure de la Base de Données (à ajouter)

Modifier la table `design_categories` :

```sql
ALTER TABLE design_categories
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_order INTEGER DEFAULT NULL;

-- Index pour optimiser les requêtes
CREATE INDEX idx_design_categories_featured
ON design_categories(is_featured, featured_order)
WHERE is_featured = TRUE;
```

## Flux d'utilisation

### Côté Admin

1. **Accéder à la page** : `/admin/featured-themes`
2. **Ajouter un thème** :
   - Cliquer sur "Ajouter un thème"
   - Sélectionner dans le dialog (max 5)
3. **Réorganiser** :
   - Glisser-déposer les cartes dans l'ordre souhaité
4. **Supprimer** :
   - Cliquer sur le bouton X d'un thème
5. **Sauvegarder** :
   - Cliquer sur "Enregistrer" pour appliquer les changements

### Côté Utilisateur

1. Visite du landing page `/`
2. Scroll jusqu'à la section "Thèmes tendances"
3. Visualisation des 5 thèmes configurés par l'admin
4. Layout responsive adapté au device

## Exemple de Configuration Backend (Node.js/Express)

```javascript
// GET /design-categories/featured
router.get('/featured', async (req, res) => {
  try {
    const featuredCategories = await db.designCategories.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { featuredOrder: 'asc' },
      take: 5,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(featuredCategories);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /design-categories/admin/featured
router.put('/admin/featured', adminAuth, async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length > 5) {
      return res.status(400).json({
        message: 'Maximum 5 thèmes autorisés'
      });
    }

    // Réinitialiser tous les thèmes
    await db.designCategories.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false, featuredOrder: null }
    });

    // Marquer les nouveaux thèmes en vedette
    for (let i = 0; i < categoryIds.length; i++) {
      await db.designCategories.update({
        where: { id: categoryIds[i] },
        data: {
          isFeatured: true,
          featuredOrder: i + 1
        }
      });
    }

    // Récupérer et retourner les thèmes mis à jour
    const updatedCategories = await db.designCategories.findMany({
      where: { isFeatured: true },
      orderBy: { featuredOrder: 'asc' },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(updatedCategories);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
```

## Points d'attention

### Sécurité
- Endpoint PUT protégé par authentification admin
- Validation de la limite de 5 thèmes côté backend
- Vérification de l'existence des IDs de catégories

### Performance
- Cache potentiel sur l'endpoint public (GET /featured)
- Index sur `is_featured` et `featured_order`
- Limitation à 5 résultats maximum

### UX/UI
- Feedback immédiat lors du drag & drop
- Indication claire des changements non sauvegardés
- Messages de confirmation/erreur explicites
- Aperçu visuel des images de couverture

### Responsive
- Layout adaptatif préservé
- Thème 4 repositionné sur mobile
- Tailles d'images optimisées

## Testing

### Tests à effectuer :

1. **Admin**
   - [ ] Ajout de thèmes (jusqu'à 5)
   - [ ] Réorganisation par drag & drop
   - [ ] Suppression de thèmes
   - [ ] Sauvegarde et rechargement
   - [ ] Validation de la limite de 5
   - [ ] Annulation de changements

2. **Landing Page**
   - [ ] Affichage correct des 5 thèmes
   - [ ] Images de couverture chargées
   - [ ] Layout responsive (mobile/tablet/desktop)
   - [ ] Gestion d'erreur API
   - [ ] Loader pendant le chargement

3. **Backend**
   - [ ] Validation des permissions admin
   - [ ] Limite de 5 thèmes appliquée
   - [ ] Ordre correct après sauvegarde
   - [ ] Gestion des IDs invalides

## Maintenance Future

### Extensions possibles :
- Statistiques de clics par thème
- A/B testing de différentes configurations
- Planification temporelle (thèmes saisonniers)
- Limite configurable (au lieu de 5 en dur)
- Preview avant publication
- Historique des configurations

### Optimisations :
- Lazy loading des images
- CDN pour les images de couverture
- Cache Redis pour l'endpoint public
- WebSocket pour mise à jour en temps réel
