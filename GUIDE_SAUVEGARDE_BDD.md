# Guide de Sauvegarde des Personnalisations en Base de Données

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture actuelle](#architecture-actuelle)
3. [Implémentation de la sauvegarde en BDD](#implémentation-de-la-sauvegarde-en-bdd)
4. [Stratégie hybride recommandée](#stratégie-hybride-recommandée)
5. [Migration et synchronisation](#migration-et-synchronisation)
6. [Gestion des utilisateurs non connectés](#gestion-des-utilisateurs-non-connectés)
7. [API Backend requise](#api-backend-requise)
8. [Exemple de code](#exemple-de-code)

---

## 📖 Vue d'ensemble

Actuellement, les personnalisations sont sauvegardées **uniquement dans localStorage** pour une persistence rapide côté client. Ce guide explique comment **ajouter la sauvegarde en base de données** pour une persistance permanente et cross-device.

### Avantages de la sauvegarde en BDD

✅ **Persistance permanente** : Les données ne sont pas perdues si l'utilisateur vide son cache
✅ **Cross-device** : Accès aux personnalisations depuis n'importe quel appareil
✅ **Historique** : Possibilité de garder un historique des modifications
✅ **Commandes** : Lien direct avec les commandes passées
✅ **Analytics** : Statistiques sur les designs populaires

---

## 🏗️ Architecture actuelle

### localStorage (Client-side)

**Fichier** : `src/pages/CustomerProductCustomizationPageV3.tsx`

**Clé de stockage** : `design-data-product-{productId}`

**Données sauvegardées** :
```typescript
{
  elements: DesignElement[],        // Éléments de design (texte, images)
  colorVariationId: number,          // Couleur sélectionnée
  viewId: number,                    // Vue sélectionnée
  timestamp: number                  // Date de sauvegarde
}
```

### Service Backend existant

**Fichier** : `src/services/customizationService.ts`

Le service est **déjà prêt** avec toutes les méthodes nécessaires :
- ✅ `saveCustomization()` - Sauvegarder une personnalisation
- ✅ `getCustomization()` - Récupérer une personnalisation
- ✅ `updateCustomization()` - Mettre à jour une personnalisation
- ✅ `getMyCustomizations()` - Récupérer les personnalisations de l'utilisateur
- ✅ `getSessionCustomizations()` - Récupérer les personnalisations d'une session guest
- ✅ `deleteCustomization()` - Supprimer une personnalisation

---

## 🚀 Implémentation de la sauvegarde en BDD

### Étape 1 : Ajouter un state pour l'ID de personnalisation

Dans `CustomerProductCustomizationPageV3.tsx`, ajoutez :

```typescript
// État pour tracker l'ID de personnalisation en BDD
const [customizationId, setCustomizationId] = useState<number | null>(null);
```

### Étape 2 : Fonction de sauvegarde en BDD

Ajoutez cette fonction dans le composant :

```typescript
/**
 * Sauvegarder en base de données
 * - Appelée périodiquement ou lors d'événements spécifiques
 * - Utilise updateCustomization() si l'ID existe déjà
 */
const saveToDatabase = async () => {
  if (!id || !product) return;

  try {
    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    let result;

    if (customizationId) {
      // Mise à jour si l'ID existe
      console.log('🔄 [DB] Mise à jour personnalisation ID:', customizationId);
      result = await customizationService.updateCustomization(customizationId, customizationData);
    } else {
      // Création si nouvelle personnalisation
      console.log('💾 [DB] Création nouvelle personnalisation');
      result = await customizationService.saveCustomization(customizationData);
      setCustomizationId(result.id);

      // Sauvegarder l'ID dans localStorage pour la prochaine fois
      const storageKey = `design-data-product-${id}`;
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      currentData.customizationId = result.id;
      localStorage.setItem(storageKey, JSON.stringify(currentData));
    }

    console.log('✅ [DB] Sauvegarde réussie:', result);

    toast({
      title: '💾 Sauvegardé',
      description: 'Vos modifications sont enregistrées',
      duration: 2000
    });

    return result;
  } catch (error) {
    console.error('❌ [DB] Erreur sauvegarde:', error);

    toast({
      title: 'Erreur de sauvegarde',
      description: 'Impossible de sauvegarder sur le serveur (localStorage utilisé)',
      variant: 'destructive',
      duration: 3000
    });
  }
};
```

### Étape 3 : Restauration depuis la BDD

Modifiez l'ÉTAPE 1 pour charger depuis la BDD si disponible :

```typescript
// ÉTAPE 1 MODIFIÉE : Restaurer depuis BDD ou localStorage
useEffect(() => {
  if (!id || !product || hasRestoredRef.current) return;

  const restoreData = async () => {
    try {
      isRestoringRef.current = true;
      let dataToRestore = null;

      // 1. Essayer de charger depuis localStorage d'abord
      const storageKey = `design-data-product-${id}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const localData = JSON.parse(saved);

        // Si on a un customizationId, charger depuis la BDD
        if (localData.customizationId) {
          try {
            console.log('🔍 [Customization] Chargement depuis BDD, ID:', localData.customizationId);
            const dbData = await customizationService.getCustomization(localData.customizationId);

            dataToRestore = {
              elements: dbData.designElements,
              colorVariationId: dbData.colorVariationId,
              viewId: dbData.viewId,
              customizationId: dbData.id
            };

            setCustomizationId(dbData.id);
            console.log('✅ [Customization] Données chargées depuis BDD');
          } catch (error) {
            console.warn('⚠️ [Customization] BDD non disponible, utilisation localStorage');
            dataToRestore = localData;
          }
        } else {
          // Pas d'ID BDD, utiliser localStorage
          dataToRestore = localData;
        }
      }

      if (dataToRestore) {
        console.log('📦 [Customization] Restauration des données...');

        // Restaurer la couleur et la vue
        if (dataToRestore.colorVariationId && product.colorVariations) {
          const savedColor = product.colorVariations.find(c => c.id === dataToRestore.colorVariationId);
          if (savedColor) {
            console.log('🎨 [Customization] Restauration couleur:', savedColor);
            setSelectedColorVariation(savedColor);

            if (dataToRestore.viewId && savedColor.images) {
              const savedView = savedColor.images.find(img => img.id === dataToRestore.viewId);
              if (savedView) {
                console.log('🖼️ [Customization] Restauration vue:', savedView);
                setSelectedView(savedView);
              }
            }
          }
        }

        // Gérer les éléments dans l'ÉTAPE 2
        if (!dataToRestore.elements || dataToRestore.elements.length === 0) {
          setTimeout(() => {
            isRestoringRef.current = false;
            hasRestoredRef.current = true;
            console.log('✅ [Customization] Flag désactivé (pas d\'éléments)');
          }, 1000);
        }
      } else {
        hasRestoredRef.current = true;
      }
    } catch (err) {
      console.error('❌ [Customization] Erreur restauration:', err);
      hasRestoredRef.current = true;
      isRestoringRef.current = false;
    }
  };

  restoreData();
}, [id, product]);
```

---

## ⚡ Stratégie hybride recommandée

Pour obtenir les **meilleurs performances** tout en garantissant la **persistance**, utilisez une approche hybride :

### 1. Sauvegarde localStorage (immédiate)

✅ **Quand** : À chaque modification
✅ **Pourquoi** : Réactivité instantanée, pas de latence réseau
✅ **Comment** : Code actuel (déjà implémenté)

### 2. Sauvegarde BDD (différée - debounced)

✅ **Quand** : Après 2-3 secondes d'inactivité
✅ **Pourquoi** : Éviter trop d'appels API
✅ **Comment** : Utiliser un debounce

```typescript
// Hook pour debounce la sauvegarde BDD
const useDebouncedSave = (saveFunction: () => void, delay: number = 2000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFunction();
    }, delay);
  }, [saveFunction, delay]);
};

// Utilisation dans le composant
const debouncedSaveToDatabase = useDebouncedSave(saveToDatabase, 3000);

// Modifier le useEffect de sauvegarde
useEffect(() => {
  if (!id || isRestoringRef.current || !hasRestoredRef.current) return;

  // 1. Sauvegarde immédiate dans localStorage
  const storageKey = `design-data-product-${id}`;
  const dataToSave = {
    elements: designElements,
    colorVariationId: selectedColorVariation?.id,
    viewId: selectedView?.id,
    customizationId: customizationId,
    timestamp: Date.now()
  };

  localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  console.log('💾 Auto-sauvegarde localStorage:', dataToSave);

  // 2. Sauvegarde différée en BDD (debounced)
  debouncedSaveToDatabase();

}, [designElements, selectedColorVariation, selectedView, id, customizationId, debouncedSaveToDatabase]);
```

### 3. Sauvegarde BDD immédiate lors d'actions critiques

Certaines actions nécessitent une sauvegarde **immédiate** en BDD :

```typescript
// Lors de l'ajout au panier
const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
  // 1. Sauvegarder IMMÉDIATEMENT en BDD
  const result = await saveToDatabase();

  if (!result) {
    toast({
      title: 'Erreur',
      description: 'Veuillez réessayer',
      variant: 'destructive'
    });
    return;
  }

  // 2. Ajouter au panier avec l'ID de personnalisation
  const customizationData = {
    productId: product.id,
    colorVariationId: selectedColorVariation?.id || 0,
    viewId: selectedView?.id || 0,
    designElements: designElements,
    sizeSelections: selections,
    sessionId: customizationService.getOrCreateSessionId(),
  };

  // ... reste du code d'ajout au panier
};

// Lors du bouton "Enregistrer"
const handleSave = async () => {
  await saveToDatabase();
};

// Lors de la navigation (avant de quitter la page)
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    // Sauvegarder en BDD avant de quitter
    if (designElements.length > 0) {
      e.preventDefault();
      await saveToDatabase();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [designElements]);
```

---

## 🔄 Migration et synchronisation

### Récupérer les personnalisations d'un utilisateur

```typescript
// Récupérer toutes les personnalisations de l'utilisateur
const loadUserCustomizations = async () => {
  try {
    if (customizationService.isAuthenticated()) {
      const customizations = await customizationService.getMyCustomizations('draft');
      console.log('📦 Personnalisations utilisateur:', customizations);
      return customizations;
    } else {
      const sessionId = customizationService.getOrCreateSessionId();
      const customizations = await customizationService.getSessionCustomizations(sessionId, 'draft');
      console.log('📦 Personnalisations session:', customizations);
      return customizations;
    }
  } catch (error) {
    console.error('Erreur chargement personnalisations:', error);
    return [];
  }
};
```

### Afficher une liste de personnalisations sauvegardées

```typescript
// Composant pour afficher les personnalisations sauvegardées
const SavedCustomizationsList = () => {
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  useEffect(() => {
    const loadCustomizations = async () => {
      const data = await loadUserCustomizations();
      setCustomizations(data);
    };
    loadCustomizations();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {customizations.map(custom => (
        <div key={custom.id} className="border rounded-lg p-4">
          <img src={custom.previewImageUrl || custom.product?.images?.[0]?.url} alt="Preview" />
          <h3>{custom.product?.name}</h3>
          <p>{custom.designElements.length} élément(s)</p>
          <Button onClick={() => {
            // Charger cette personnalisation
            navigate(`/product/${custom.productId}/customize?customizationId=${custom.id}`);
          }}>
            Continuer
          </Button>
        </div>
      ))}
    </div>
  );
};
```

### Charger une personnalisation existante via URL

```typescript
// Dans CustomerProductCustomizationPageV3.tsx
const { id, customizationId: urlCustomizationId } = useParams();
const [searchParams] = useSearchParams();
const customizationIdFromQuery = searchParams.get('customizationId');

useEffect(() => {
  const loadFromUrl = async () => {
    const idToLoad = urlCustomizationId || customizationIdFromQuery;

    if (idToLoad) {
      try {
        const customization = await customizationService.getCustomization(Number(idToLoad));

        // Restaurer les données
        setDesignElements(customization.designElements);
        setCustomizationId(customization.id);

        // Restaurer couleur et vue
        // ... (similaire au code de restauration)

      } catch (error) {
        console.error('Erreur chargement personnalisation:', error);
      }
    }
  };

  loadFromUrl();
}, [urlCustomizationId, customizationIdFromQuery]);
```

---

## 👤 Gestion des utilisateurs non connectés

### Session ID pour les guests

Le système utilise déjà un `sessionId` pour tracker les utilisateurs non connectés :

```typescript
// Généré automatiquement dans customizationService
const sessionId = customizationService.getOrCreateSessionId();
// Format: "guest-{timestamp}-{random}"
```

### Migration des données guest vers compte utilisateur

Lors de la connexion, migrez les personnalisations :

```typescript
// Dans le composant de login/register
const migrateGuestCustomizations = async (userId: number) => {
  try {
    const sessionId = localStorage.getItem('guest-session-id');

    if (sessionId) {
      // Récupérer les personnalisations de la session
      const guestCustomizations = await customizationService.getSessionCustomizations(sessionId);

      console.log(`🔄 Migration de ${guestCustomizations.length} personnalisations...`);

      // Le backend devrait avoir un endpoint pour ça
      await axios.post(`${API_BASE}/customizations/migrate`, {
        sessionId,
        userId
      });

      console.log('✅ Migration réussie');

      // Nettoyer le sessionId
      localStorage.removeItem('guest-session-id');
    }
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
};
```

---

## 🔌 API Backend requise

### Endpoints nécessaires

Le backend doit fournir ces endpoints :

```
POST   /api/customizations              - Créer une personnalisation
GET    /api/customizations/:id          - Récupérer une personnalisation
PUT    /api/customizations/:id          - Mettre à jour une personnalisation
DELETE /api/customizations/:id          - Supprimer une personnalisation
GET    /api/customizations/user/me      - Récupérer les personnalisations de l'utilisateur connecté
GET    /api/customizations/session/:id  - Récupérer les personnalisations d'une session guest
POST   /api/customizations/migrate      - Migrer les personnalisations guest vers un utilisateur
```

### Schéma de base de données

```sql
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  product_id INTEGER NOT NULL REFERENCES products(id),
  color_variation_id INTEGER REFERENCES color_variations(id),
  view_id INTEGER REFERENCES product_images(id),
  design_elements JSONB NOT NULL DEFAULT '[]',
  size_selections JSONB,
  preview_image_url TEXT,
  total_price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'completed', 'abandoned'
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_customizations_user_id ON customizations(user_id);
CREATE INDEX idx_customizations_session_id ON customizations(session_id);
CREATE INDEX idx_customizations_status ON customizations(status);
CREATE INDEX idx_customizations_product_id ON customizations(product_id);
```

---

## 💡 Exemple de code complet

### Option 1 : Sauvegarde manuelle uniquement

```typescript
// Bouton "Enregistrer" sauvegarde en BDD
<Button onClick={handleSave}>
  <Save className="w-4 h-4 mr-2" />
  Enregistrer
</Button>

const handleSave = async () => {
  await saveToDatabase();
};
```

### Option 2 : Auto-sauvegarde debounced (recommandé)

```typescript
// Auto-sauvegarde localStorage + BDD debounced
useEffect(() => {
  if (!id || isRestoringRef.current || !hasRestoredRef.current) return;

  // localStorage immédiat
  const storageKey = `design-data-product-${id}`;
  const dataToSave = {
    elements: designElements,
    colorVariationId: selectedColorVariation?.id,
    viewId: selectedView?.id,
    customizationId: customizationId,
    timestamp: Date.now()
  };
  localStorage.setItem(storageKey, JSON.stringify(dataToSave));

  // BDD debounced (3s)
  debouncedSaveToDatabase();

}, [designElements, selectedColorVariation, selectedView]);
```

### Option 3 : Sauvegarde agressive

```typescript
// Auto-sauvegarde BDD à chaque modification (non recommandé - trop d'appels API)
useEffect(() => {
  if (!id || isRestoringRef.current || !hasRestoredRef.current) return;

  // localStorage immédiat
  saveToLocalStorage();

  // BDD immédiat
  saveToDatabase();

}, [designElements, selectedColorVariation, selectedView]);
```

---

## 📊 Résumé des stratégies

| Stratégie | localStorage | BDD | Performances | Fiabilité |
|-----------|-------------|-----|--------------|-----------|
| **localStorage seul** | ✅ Immédiat | ❌ Aucune | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **BDD manuel** | ✅ Immédiat | ✅ Bouton | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Hybride debounced** ✨ | ✅ Immédiat | ✅ 3s délai | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **BDD agressive** | ✅ Immédiat | ✅ Immédiat | ⭐ | ⭐⭐⭐⭐⭐ |

**Recommandation** : Utilisez la **stratégie hybride debounced** pour le meilleur équilibre.

---

## 🎯 Prochaines étapes

1. ✅ **Implémenter le debounce** pour la sauvegarde BDD
2. ✅ **Tester la restauration** depuis la BDD
3. ✅ **Ajouter la gestion d'erreurs** réseau
4. ✅ **Créer l'interface** de liste de personnalisations sauvegardées
5. ✅ **Implémenter la migration** guest → utilisateur connecté
6. ✅ **Ajouter des indicateurs visuels** (icône de sauvegarde, spinner, etc.)

---

## 🔗 Ressources

- Service actuel : `src/services/customizationService.ts`
- Page de personnalisation : `src/pages/CustomerProductCustomizationPageV3.tsx`
- Documentation localStorage : `GUIDE_UTILISATION_PERSONNALISATIONS.md`
