# 📊 Guide d'affichage des catégories - Basé sur docModifie.md

Ce guide explique comment afficher les catégories hiérarchiques en utilisant l'endpoint `/categories/hierarchy` documenté dans `docModifie.md`.

---

## 🎯 Endpoint utilisé : `/categories/hierarchy`

### Structure de la réponse

Selon `docModifie.md`, l'endpoint `/categories/hierarchy` retourne déjà les catégories organisées hiérarchiquement :

```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "productCount": 5,
    "subcategories": [
      {
        "id": 2,
        "name": "Coque",
        "parentId": 1,
        "level": 1,
        "productCount": 3,
        "subcategories": [
          {
            "id": 3,
            "name": "iPhone 13",
            "parentId": 2,
            "level": 2,
            "productCount": 1,
            "subcategories": []
          },
          {
            "id": 4,
            "name": "iPhone 14",
            "parentId": 2,
            "level": 2,
            "productCount": 2,
            "subcategories": []
          }
        ]
      }
    ]
  }
]
```

---

## 📝 Code d'affichage

### Option 1 : Utiliser `/categories/hierarchy` (Recommandé)

Si le backend supporte `/categories/hierarchy`, utilisez directement cette réponse :

```typescript
// src/pages/CategoryManagement.tsx

import { fetchCategoriesHierarchy } from '../services/api';

const CategoryManagement = () => {
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const data = await fetchCategoriesHierarchy();
      setHierarchicalCategories(data);
    } catch (error) {
      console.error('Erreur chargement hiérarchie:', error);
      // Fallback sur la méthode actuelle
      organizeCategories();
    }
  };

  return (
    <Table>
      <TableBody>
        {hierarchicalCategories.map((parent) => (
          <React.Fragment key={parent.id}>
            {/* Ligne parent */}
            <TableRow>
              <TableCell>{parent.name}</TableCell>
              <TableCell>
                <Badge>Parent - Level {parent.level}</Badge>
              </TableCell>
              <TableCell>
                <Badge>{parent.productCount} produits</Badge>
              </TableCell>
            </TableRow>

            {/* Sous-catégories */}
            {parent.subcategories?.map((child) => (
              <React.Fragment key={child.id}>
                <TableRow className="bg-gray-50">
                  <TableCell className="pl-8">→ {child.name}</TableCell>
                  <TableCell>
                    <Badge>Enfant - Level {child.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{child.productCount} produits</Badge>
                  </TableCell>
                </TableRow>

                {/* Variations */}
                {child.subcategories?.map((variation) => (
                  <TableRow key={variation.id} className="bg-gray-100">
                    <TableCell className="pl-16">↳ {variation.name}</TableCell>
                    <TableCell>
                      <Badge>Variation - Level {variation.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{variation.productCount} produits</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
```

### Option 2 : Fallback avec `/categories` (Actuel)

Si `/categories/hierarchy` n'est pas encore disponible, continuez avec la méthode actuelle :

```typescript
// Organisation manuelle des catégories (code actuel)
const organizeCategories = () => {
  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategories = categories.filter(cat => cat.parentId);

  return parentCategories.map(parent => {
    const subcats = childCategories.filter(child => child.parentId === parent.id);

    return {
      ...parent,
      subcategories: subcats.map(subcat => ({
        ...subcat,
        variations: categories.filter(variation => variation.parentId === subcat.id)
      }))
    };
  });
};
```

---

## 🎨 Affichage visuel hiérarchique

### Style avec indentation

```tsx
<TableRow>
  <TableCell>
    <div className="flex items-center gap-3">
      {/* Indentation visuelle */}
      <div style={{ marginLeft: `${level * 20}px` }}>
        {/* Icône selon le niveau */}
        {level === 0 && <div className="w-2 h-8 bg-blue-500 rounded-full" />}
        {level === 1 && <div className="w-2 h-6 bg-green-400 rounded-full" />}
        {level === 2 && <div className="w-2 h-4 bg-purple-400 rounded-full" />}
      </div>

      <span className="font-semibold">{category.name}</span>

      {/* Badge de comptage */}
      {category.subcategories?.length > 0 && (
        <Badge variant="outline">
          {category.subcategories.length} sous-catégorie(s)
        </Badge>
      )}
    </div>
  </TableCell>
</TableRow>
```

### Couleurs par niveau

```typescript
const getLevelColor = (level: number) => {
  switch (level) {
    case 0:
      return 'bg-blue-100 text-blue-800';
    case 1:
      return 'bg-green-100 text-green-800';
    case 2:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
```

---

## 🔄 Fonction récursive d'affichage

Pour afficher un arbre de profondeur variable :

```typescript
const renderCategory = (category: any, depth = 0) => {
  const indent = depth * 20; // 20px par niveau

  return (
    <React.Fragment key={category.id}>
      {/* Ligne de la catégorie */}
      <TableRow className={depth > 0 ? 'bg-gray-50' : ''}>
        <TableCell>
          <div style={{ marginLeft: `${indent}px` }} className="flex items-center gap-2">
            {/* Icône selon profondeur */}
            {depth === 0 && '📁'}
            {depth === 1 && '📂'}
            {depth === 2 && '📄'}

            <span>{category.name}</span>

            {/* Nombre de sous-catégories */}
            {category.subcategories?.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {category.subcategories.length}
              </Badge>
            )}
          </div>
        </TableCell>

        <TableCell>
          <Badge className={getLevelColor(category.level)}>
            Level {category.level}
          </Badge>
        </TableCell>

        <TableCell>
          <Badge>{category.productCount || 0} produits</Badge>
        </TableCell>

        <TableCell>
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openEditModal(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteModal(category)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Sous-catégories (récursif) */}
      {category.subcategories?.map((sub: any) =>
        renderCategory(sub, depth + 1)
      )}
    </React.Fragment>
  );
};

// Utilisation
return (
  <Table>
    <TableBody>
      {hierarchicalCategories.map((cat) => renderCategory(cat, 0))}
    </TableBody>
  </Table>
);
```

---

## 📊 Affichage avec statistiques

Selon `docModifie.md`, chaque catégorie inclut `productCount` :

```tsx
<TableRow>
  <TableCell>
    <div className="flex items-center justify-between">
      <span>{category.name}</span>

      {/* Statistiques */}
      <div className="flex gap-2">
        {/* Nombre de produits */}
        <Badge
          variant={category.productCount > 0 ? 'default' : 'secondary'}
          className={category.productCount > 0 ? 'cursor-pointer hover:bg-gray-300' : ''}
          onClick={() => category.productCount > 0 && navigate(`/products?category=${category.id}`)}
        >
          {category.productCount} produits
        </Badge>

        {/* Nombre de sous-catégories */}
        {category.subcategories?.length > 0 && (
          <Badge variant="outline">
            {category.subcategories.length} sous-cat.
          </Badge>
        )}
      </div>
    </div>
  </TableCell>
</TableRow>
```

---

## 🔍 Filtrage sur la hiérarchie

Filtrer en cherchant à tous les niveaux :

```typescript
const filterHierarchy = (categories: any[], searchTerm: string) => {
  if (!searchTerm) return categories;

  const search = searchTerm.toLowerCase();

  return categories
    .map((category) => {
      // Filtrer les sous-catégories récursivement
      const filteredSubcategories = filterHierarchy(
        category.subcategories || [],
        searchTerm
      );

      // Garder la catégorie si :
      // - Son nom correspond
      // - Sa description correspond
      // - Elle a des sous-catégories filtrées
      const matches =
        category.name.toLowerCase().includes(search) ||
        category.description?.toLowerCase().includes(search) ||
        filteredSubcategories.length > 0;

      if (matches) {
        return {
          ...category,
          subcategories: filteredSubcategories,
        };
      }

      return null;
    })
    .filter(Boolean);
};

// Utilisation
const filteredCategories = filterHierarchy(hierarchicalCategories, searchTerm);
```

---

## 🚀 Migration progressive

### Étape 1 : Ajouter le support de `/categories/hierarchy`

```typescript
// src/contexts/CategoryContext.tsx

const refreshCategories = async () => {
  setLoading(true);
  setError(null);

  try {
    // Essayer d'abord /hierarchy
    try {
      const hierarchyData = await fetchCategoriesHierarchy();
      if (hierarchyData.length > 0) {
        // Aplatir la hiérarchie pour compatibilité
        const flatCategories = flattenHierarchy(hierarchyData);
        setCategories(flatCategories);
        return flatCategories;
      }
    } catch (error) {
      console.warn('Endpoint /hierarchy non disponible, fallback sur /categories');
    }

    // Fallback sur /categories
    const data = await fetchCategories();
    setCategories(data);
    return data;
  } catch (err) {
    console.error('Error loading categories:', err);
    setError('Impossible de charger les catégories.');
    return [];
  } finally {
    setLoading(false);
  }
};

// Fonction utilitaire pour aplatir
const flattenHierarchy = (hierarchy: any[]): Category[] => {
  const flat: Category[] = [];

  const flatten = (items: any[]) => {
    items.forEach((item) => {
      flat.push({
        id: item.id,
        name: item.name,
        description: item.description,
        parentId: item.parentId,
        level: item.level,
        order: item.order,
      });

      if (item.subcategories?.length > 0) {
        flatten(item.subcategories);
      }
    });
  };

  flatten(hierarchy);
  return flat;
};
```

### Étape 2 : Tester les deux modes

```typescript
// Dans CategoryManagement.tsx, ajouter un switch
const [useHierarchy, setUseHierarchy] = useState(true);

useEffect(() => {
  if (useHierarchy) {
    loadHierarchyMode();
  } else {
    loadFlatMode();
  }
}, [useHierarchy]);

// Toggle pour tester
<Button onClick={() => setUseHierarchy(!useHierarchy)}>
  Mode: {useHierarchy ? 'Hiérarchie' : 'Plat'}
</Button>
```

---

## 📞 Support

Pour questions sur l'affichage :
- **Documentation API** : `src/components/product-form/docModifie.md`
- **Intégration backend** : `CATEGORY_FRONTEND_BACKEND_INTEGRATION.md`
- **Code actuel** : `src/pages/CategoryManagement.tsx`

---

**✨ L'affichage est maintenant optimisé pour utiliser directement la hiérarchie du backend !**

Avantages :
- ✅ Moins de calculs côté frontend
- ✅ `productCount` déjà calculé par le backend
- ✅ Structure déjà organisée
- ✅ Compatible avec l'organisation actuelle (fallback)
