# UI/UX - Page Détail Commande Admin

## Vue d'ensemble

Page de détail d'une commande accessible via `/admin/orders/:id`.

**Style : Playful Minimalism** - Fun, moderne, dynamique tout en restant monochrome (noir, blanc, gris). Inspiré de Linear + Notion + Shopify avec des formes arrondies "bubbly" et des micro-animations.

---

## Design System

### Palette monochrome

| Usage | Couleur | Classe Tailwind |
|-------|---------|-----------------|
| Texte principal | Noir pur | `text-black` |
| Texte secondaire | Gris 400-500 | `text-gray-400` |
| Bordures | Gris 200 | `border-gray-200` |
| Fond sections | Gris 50 | `bg-gray-50` |
| Accent principal | Noir | `bg-black` |
| Hover surfaces | Gris 100-200 | `hover:bg-gray-100` |
| Ombres | Noir 5-20% | `shadow-black/20` |

### Typographie

| Élément | Taille | Poids | Style |
|---------|--------|-------|-------|
| Titre commande | xl | Bold | Dans pill gris |
| Montants totaux | 3xl | Black (`font-black`) | Expressif |
| Nom produit | lg | Bold | Hover effet |
| Labels | xs | Bold | `uppercase tracking-wider` |
| Tags/Pills | xs | Bold | `rounded-full` |

### Formes & Arrondis

- Containers principaux : `rounded-2xl` ou `rounded-3xl`
- Boutons : `rounded-full` (pills)
- Pills/badges : `rounded-full`
- Éléments interactifs : `rounded-xl`

### Espacement (Aéré)

- Padding horizontal : `px-6 lg:px-8`
- Padding vertical sections : `py-6` à `py-8`
- Gap entre cartes : `gap-6`
- Padding cartes : `p-6 lg:p-7`

---

## Structure de la page

### 1. Header (Sticky, Fun & Clean)

**Container :**
- `bg-white/95 backdrop-blur-sm`
- `shadow-lg shadow-black/5`

**Gauche :**
- Bouton retour : carré arrondi 2xl avec bordure (`w-12 h-12`)
- `hover:border-black hover:scale-105`
- Order ID dans une pill gris-100 avec bouton copier
- Copier : `hover:rotate-12` (effet playful)

**Droite :**
- Badge statut : `rounded-full bg-black text-white shadow-lg`
- Bouton imprimer : `rounded-full bg-black hover:scale-105 shadow-xl`

---

### 2. Summary Bar (Fun Card-like)

**Container unique :**
- `bg-gray-50 rounded-3xl p-6 lg:p-8 shadow-sm`

**4 blocs d'info :**
- Total : `text-3xl font-black`
- Client : `text-base font-bold`
- Livraison : `text-base font-bold`
- Articles : `text-3xl font-black`

**Séparateurs :** `w-px h-16 bg-gray-200 mx-6`

---

### 3. Main Content

**Grid :** 3 colonnes (`lg:grid-cols-3 gap-8`)

#### 3.1 Cartes Produits (Bubbly & Interactive)

**Container :**
- `rounded-2xl p-6 lg:p-7 shadow-sm`
- `hover:shadow-lg hover:scale-[1.01]`
- `transition-all duration-300`

**Header carte :**
- Nom : `text-lg font-bold group-hover:text-gray-700`
- Tags variantes : pills `rounded-full bg-gray-100`
- Quantité : pill `bg-black text-white rounded-full`
- Prix : `text-2xl font-black`

**Preview images :**
- Container `bg-gray-50 rounded-xl`
- Labels vues : `bg-black/70 rounded`

**Boutons export :**
- PNG : `rounded-full bg-black shadow-md hover:scale-105`
- PDF : `rounded-full border-2 hover:border-black hover:scale-105`

**Info design :**
- Container `bg-gray-50 rounded-2xl p-4`
- Thumbnail `rounded-xl border-2`
- Icônes : `hover:scale-110 hover:rotate-3` ou `hover:-rotate-3`

#### 3.2 Sidebar (Floating Fun Cards)

**Espacement :** `space-y-6`

**Bloc Client :**
- `rounded-2xl p-6 shadow-sm hover:shadow-md`
- Avatar : `h-14 w-14 ring-4 ring-gray-100`
- Téléphone : icône dans pill `bg-gray-100 rounded-xl`

**Bloc Adresse :**
- Même style bubbly
- Pays en `font-bold`

**Bloc Total :**
- `bg-black rounded-2xl p-6 shadow-xl shadow-black/20`
- `hover:scale-[1.02]` (animation fun)
- Total : `text-3xl font-black`

**Bloc Notes :**
- `bg-gray-50 rounded-2xl p-6`
- Texte avec `leading-relaxed`

---

### 4. Modal (Playful Overlay)

**Overlay :**
- `bg-black/85 backdrop-blur-sm`
- `animate-in fade-in duration-200`

**Container :**
- `rounded-3xl shadow-2xl`
- `animate-in zoom-in-95 duration-300`

**Header :**
- Titre `font-bold text-lg`
- Télécharger : `rounded-full hover:scale-105`
- Fermer : `rounded-xl hover:rotate-90`

**Corps :**
- `p-8 bg-gray-50`
- Image dans `bg-white rounded-2xl shadow-inner`

---

## Micro-animations & Interactions

### Hover states

| Élément | Animation |
|---------|-----------|
| Cartes | `hover:scale-[1.01]` ou `hover:scale-[1.02]` |
| Boutons | `hover:scale-105` |
| Icônes | `hover:rotate-3` / `hover:-rotate-3` / `hover:rotate-12` / `hover:rotate-90` |
| Ombres | `hover:shadow-lg` / `hover:shadow-xl` |

### Transitions

- Toutes : `transition-all duration-200` ou `duration-300`
- Smooth easing par défaut

### Animations d'entrée

- Modal overlay : `animate-in fade-in duration-200`
- Modal container : `animate-in zoom-in-95 duration-300`

---

## Responsive

### Mobile (< 1024px)
- Grid 1 colonne
- Summary bar : flex-wrap
- Previews : pleine largeur
- Cartes empilées

### Desktop (≥ 1024px)
- Grid 3 colonnes (2 + 1)
- Padding augmenté : `lg:px-8`
- Cartes : `lg:p-7`

---

## États spéciaux

### Chargement
- Spinner avec `border-t-black animate-spin`
- Centré avec texte

### Erreur / Non trouvé
- Icône Package dans cercle noir/gris
- Bouton retour `rounded-full bg-black`

---

## Composants

- `Avatar` avec `ring-4` pour effet bubbly
- `CustomizationPreview`
- `EnrichedOrderProductPreview`

## Icônes (Lucide)

- `ArrowLeft`, `Package`, `Phone`, `Copy`, `Printer`, `Download`, `X`, `Eye`

---

## Moodboard Keywords

- **Playful minimalism**
- **Fun monochrome UI**
- **Soft rounded admin dashboard**
- **Airy layout**
- **Modern stripe-style black & white**
- **Friendly yet professional**
- **Bubbly shapes**
- **Micro-interactions**

---

## Visual Mood

Le design combine :
- **L'efficacité de Linear** (clean, functional)
- **La simplicité de Notion** (aéré, lisible)
- **La convivialité de Shopify** (friendly, accessible)

Tout en restant strictement monochrome avec des accents ludiques via les animations et formes arrondies.
