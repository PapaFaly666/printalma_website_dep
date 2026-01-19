# Implémentation Frontend - Système de Tableaux/Posters

## ✅ Fichiers créés

### 1. Page principale
**Fichier**: `src/pages/VendorPostersPage.tsx`
- Page complète de gestion des posters pour les vendeurs
- Affichage des statistiques (total, en attente, validés, rejetés)
- Filtres par statut et format
- Liste des posters avec cartes interactives
- Dialog de création/édition

### 2. Formulaire de création
**Fichier**: `src/components/poster/PosterCreationForm.tsx`
- Formulaire en 5 étapes avec navigation
- Étape 1 : Sélection du design
- Étape 2 : Choix du format (9 formats disponibles)
- Étape 3 : Choix de la finition (Mat, Brillant, Canvas, Fine Art)
- Étape 4 : Choix du cadre (5 options)
- Étape 5 : Détails et prix
- Calcul automatique du prix suggéré
- Génération automatique du nom

### 3. Carte d'affichage
**Fichier**: `src/components/poster/PosterCard.tsx`
- Carte moderne avec image du poster
- Affichage des détails (format, finition, cadre)
- Badge de statut (validé, en attente, rejeté, archivé)
- Prix et stock
- Boutons d'action (modifier, supprimer)
- Animation au survol

### 4. Service API
**Fichier**: `src/services/posterService.ts`
- CRUD complet pour les posters
- Endpoints vendeur et public
- Gestion de l'authentification
- Gestion des erreurs

---

## 🔧 Intégration au menu vendeur

### Option 1 : Ajouter dans le fichier de navigation existant

Cherchez le fichier de navigation vendeur (probablement `VendorLayout.tsx`, `VendorDashboard.tsx` ou similaire) et ajoutez :

```tsx
import { Frame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dans le menu
<button
  onClick={() => navigate('/vendeur/posters')}
  className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full text-gray-700 hover:bg-gray-100 hover:text-black justify-start"
>
  <span className="flex-shrink-0 text-gray-700">
    <Frame className="h-5 w-5" />
  </span>
  <span className="ml-4 truncate text-gray-700">
    Tableaux/Posters
  </span>
</button>
```

### Option 2 : Exemple complet de menu vendeur

```tsx
// VendorLayout.tsx ou VendorSidebar.tsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChartColumn,
  Package,
  Image,
  Layers,
  TrendingUp,
  Palette,
  Sticker,
  Frame,  // 🆕 Nouveau
  Banknote,
  Sparkles
} from 'lucide-react';

const menuItems = [
  // Section Produits
  {
    section: 'Produits',
    items: [
      { path: '/vendeur/dashboard', icon: ChartColumn, label: 'Tableau de bord' },
      { path: '/vendeur/products', icon: Package, label: 'Mes Produits' },
      { path: '/vendeur/designs', icon: Image, label: 'Mes Designs' },
      { path: '/vendeur/galleries', icon: Layers, label: 'Mes Galeries' },
    ]
  },
  // Section Vente
  {
    section: 'Vente',
    items: [
      { path: '/vendeur/orders', icon: TrendingUp, label: 'Mes Commandes' },
      { path: '/vendeur/sell', icon: Palette, label: 'Vendre' },
      { path: '/vendeur/stickers', icon: Sticker, label: 'Stickers' },
      { path: '/vendeur/posters', icon: Frame, label: 'Tableaux/Posters' }, // 🆕 Nouveau
    ]
  },
  // Section Finances
  {
    section: 'Finances',
    items: [
      { path: '/vendeur/funds', icon: Banknote, label: 'Appel de Fonds' },
      { path: '/vendeur/revenue', icon: Sparkles, label: 'Revenus des Designs' },
    ]
  }
];

export default function VendorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
      {menuItems.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-1 mb-4">
          {section.section && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.section}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full justify-start ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`ml-4 truncate ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
```

---

## 🛣️ Configuration des routes

### Ajouter la route dans votre fichier de routes

**Fichier**: `src/App.tsx` ou `src/routes.tsx`

```tsx
import VendorPostersPage from './pages/VendorPostersPage';

// Dans vos routes protégées vendeur
<Route path="/vendeur/posters" element={<VendorPostersPage />} />
```

### Exemple complet avec React Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VendorLayout from './layouts/VendorLayout';
import VendorPostersPage from './pages/VendorPostersPage';
// ... autres imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes vendeur */}
        <Route path="/vendeur" element={<VendorLayout />}>
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="designs" element={<VendorDesigns />} />
          <Route path="stickers" element={<VendorStickers />} />
          <Route path="posters" element={<VendorPostersPage />} /> {/* 🆕 Nouveau */}
          {/* ... autres routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📦 Dépendances nécessaires

Toutes les dépendances sont déjà présentes dans le projet :

- ✅ `react-router-dom` - Navigation
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icônes
- ✅ `axios` - Requêtes API
- ✅ Composants UI custom (Button, Dialog, Input, etc.)

---

## 🎨 Aperçu des fonctionnalités

### Page principale (`/vendeur/posters`)

1. **En-tête**
   - Titre avec icône
   - Bouton "Créer un poster"

2. **Statistiques**
   - Total de posters
   - En attente
   - Validés
   - Rejetés

3. **Filtres**
   - Par statut (Tous, Pending, Validated, Rejected)
   - Par format (Tous, A4, A3, A2, 50×70, 70×100)

4. **Grille de posters**
   - Cartes animées
   - Image du poster
   - Détails (format, finition, cadre)
   - Prix et stock
   - Boutons d'action

5. **Dialog de création**
   - Formulaire en 5 étapes
   - Navigation intuitive
   - Validation en temps réel
   - Calcul automatique du prix

### Formulaire de création (Dialog)

**Étape 1 : Design**
- Grille de designs avec preview
- Sélection unique
- Indicateur visuel

**Étape 2 : Format**
- 9 formats disponibles
- Affichage des dimensions
- Prix de base

**Étape 3 : Finition**
- 4 options (Mat, Brillant, Canvas, Fine Art)
- Description détaillée
- Multiplicateur de prix

**Étape 4 : Cadre**
- 5 options (Sans cadre à Doré)
- Prix additionnel
- Icônes visuelles

**Étape 5 : Détails**
- Nom (auto-généré ou custom)
- Description
- Prix de vente (suggéré calculé automatiquement)
- Stock initial
- Résumé de la configuration

---

## 🔗 Structure des données

### Format de création

```typescript
{
  designId: 123,
  name: "Sunset Paradise - Poster A3",
  description: "Magnifique coucher de soleil...",
  formatId: "A3",
  width: 29.7,
  height: 42.0,
  finish: "GLOSSY",
  frame: "BLACK_FRAME",
  price: 3500,
  stockQuantity: 10
}
```

### Réponse du backend

```typescript
{
  id: 456,
  vendorId: 1,
  designId: 123,
  name: "Sunset Paradise - Poster A3",
  sku: "POST-1-123-1",
  formatId: "A3",
  width: 29.7,
  height: 42.0,
  finish: "GLOSSY",
  frame: "BLACK_FRAME",
  imageUrl: "https://res.cloudinary.com/.../poster_456.png",
  finalPrice: 3500,
  stockQuantity: 10,
  status: "PENDING",
  createdAt: "2026-01-16T...",
  updatedAt: "2026-01-16T...",
  design: { ... },
  vendor: { ... }
}
```

---

## 🚀 Test rapide

### 1. Vérifier l'import

```bash
# Vérifier que les fichiers existent
ls src/pages/VendorPostersPage.tsx
ls src/components/poster/PosterCreationForm.tsx
ls src/components/poster/PosterCard.tsx
ls src/services/posterService.ts
```

### 2. Ajouter la route

Dans `src/App.tsx` :
```tsx
import VendorPostersPage from './pages/VendorPostersPage';

// Ajouter la route
<Route path="/vendeur/posters" element={<VendorPostersPage />} />
```

### 3. Ajouter au menu

Dans votre composant de navigation vendeur, ajouter :
```tsx
import { Frame } from 'lucide-react';

<button onClick={() => navigate('/vendeur/posters')}>
  <Frame className="h-5 w-5" />
  <span>Tableaux/Posters</span>
</button>
```

### 4. Accéder à la page

Naviguer vers : `http://localhost:5174/vendeur/posters`

---

## 📝 Checklist d'intégration

- [x] Créer `src/pages/VendorPostersPage.tsx`
- [x] Créer `src/components/poster/PosterCreationForm.tsx`
- [x] Créer `src/components/poster/PosterCard.tsx`
- [x] Créer `src/services/posterService.ts`
- [ ] Ajouter la route dans `App.tsx` ou `routes.tsx`
- [ ] Ajouter l'entrée au menu vendeur
- [ ] Tester la navigation
- [ ] Connecter au backend (quand prêt)

---

## 🎯 Prochaines étapes

### Frontend restant

1. **Page publique** : `/posters` (marketplace)
2. **Page détails** : `/posters/:id`
3. **Filtres avancés** : Recherche, tri, pagination
4. **Intégration panier** : Ajouter posters au panier

### Backend nécessaire

1. Modèle Prisma `PosterProduct`
2. Service `PosterGeneratorService`
3. Controller `VendorPosterController`
4. Routes API `/vendor/posters` et `/public/posters`

---

## 💡 Conseils

1. **Navigation** : Assurez-vous que la route est protégée (authentification vendeur)
2. **Permissions** : Vérifiez que l'utilisateur a le rôle `VENDEUR`
3. **Images** : Les images seront générées par le backend (placeholder en attendant)
4. **Erreurs** : Les messages d'erreur sont gérés dans le service

---

**Date** : 16 janvier 2026
**Version** : 1.0
**Auteur** : Documentation d'implémentation frontend complète
**Statut** : ✅ Frontend prêt, en attente du backend
