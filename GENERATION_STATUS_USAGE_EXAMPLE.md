# 📖 Exemple d'Intégration - Suivi de Génération d'Images

Ce document montre comment intégrer le système de suivi de génération d'images dans `SellDesignPage.tsx`.

## 📦 Fichiers Créés

1. **`src/hooks/useGenerationStatus.ts`** - Hook personnalisé pour le polling
2. **`src/components/vendor/GenerationProgressModal.tsx`** - Modal de progression

## 🔌 Intégration dans SellDesignPage.tsx

### Étape 1 : Ajouter les imports

```typescript
// Dans SellDesignPage.tsx, ajoutez ces imports:

import { GenerationProgressModal } from '../components/vendor/GenerationProgressModal';
import { useGenerationStatus } from '../hooks/useGenerationStatus';
```

### Étape 2 : Ajouter les états dans le composant

```typescript
export function SellDesignPage() {
  // ... états existants ...

  // 🆕 États pour le suivi de génération
  const [showGenerationProgress, setShowGenerationProgress] = useState(false);
  const [lastCreatedProductId, setLastCreatedProductId] = useState<number | null>(null);
  const [generationCompleted, setGenerationCompleted] = useState(false);

  // ...
}
```

### Étape 3 : Modifier la fonction de publication

```typescript
const handlePublishProducts = async () => {
  try {
    // ... code existant ...

    // Appel à l'API de création
    const results = await publishProducts(
      selectedProductIds,
      products,
      productColors,
      productSizes,
      updatedEditStates,
      basePrices,
      { designUrl, designFile, ... },
      getPreviewView,
      'PENDING',
      defaultColorIds
    );

    const successful = (results || []).filter(r => r.success);

    if (successful.length > 0) {
      // 🆕 Récupérer le premier produit créé
      const firstProductId = successful[0].productId;

      if (firstProductId) {
        setLastCreatedProductId(firstProductId);
        setShowGenerationProgress(true);

        console.log('✅ Produit(s) créé(s), lancement du suivi de génération');
      }

      toast({
        title: `${successful.length} produit(s) créé(s)`,
        description: 'Génération des images en cours...',
        variant: 'default'
      });
    }

    // Fermer le modal de checkout
    setCheckoutOpen(false);
    setBackgroundUploadActive(false);

  } catch (error) {
    console.error('Erreur lors de la publication:', error);
  }
};
```

### Étape 4 : Ajouter le modal dans le JSX

```typescript
return (
  <div className="min-h-screen bg-gray-50">
    {/* ... contenu existant ... */}

    {/* 🆕 Modal de progression de génération */}
    <GenerationProgressModal
      productId={lastCreatedProductId}
      vendorId={user?.id || null}
      productName={selectedProductIds.length > 0 ? products.find(p => p.id === Number(selectedProductIds[0]))?.name : undefined}
      isOpen={showGenerationProgress}
      onClose={() => {
        setShowGenerationProgress(false);
      }}
      onComplete={(status) => {
        console.log('✅ Génération terminée!', status);
        setGenerationCompleted(true);

        toast({
          title: 'Images générées avec succès !',
          description: `${status.generatedColors}/${status.totalColors} images sont prêtes`,
          variant: 'success'
        });

        // Optionnel: Rafraîchir la liste des produits
        // setTimeout(() => fetchProducts(), 2000);
      }}
      onError={(error) => {
        console.error('❌ Erreur génération:', error);
        toast({
          title: 'Erreur de génération',
          description: error,
          variant: 'destructive'
        });
      }}
    />

    {/* ... autres modals existants ... */}
  </div>
);
```

## 🎯 Utilisation Avancée

### Option 1 : Suivi multiples produits

Si vous créez plusieurs produits et voulez suivre chacun d'eux :

```typescript
const [trackedProducts, setTrackedProducts] = useState<Array<{
  productId: number;
  productName: string;
  status: 'pending' | 'completed' | 'failed';
}>>([]);

// Après création
const newTracked = successful.map(r => ({
  productId: r.productId!,
  productName: products.find(p => p.id === r.productId)?.name || 'Produit',
  status: 'pending' as const
}));

setTrackedProducts(prev => [...prev, ...newTracked]);

// Afficher une liste de progression
{trackedProducts.map(product => (
  <GenerationProgressModal
    key={product.productId}
    productId={product.productId}
    vendorId={user?.id}
    productName={product.productName}
    isOpen={showGenerationProgress}
    onClose={() => {/* Supprimer de la liste */}}
  />
))}
```

### Option 2 : Notification en arrière-plan

Sans modal, juste une notification discrète :

```typescript
const { status, isCompleted } = useGenerationStatus(productId, vendorId, {
  autoStart: true,
  onComplete: (status) => {
    toast({
      title: 'Images générées !',
      description: 'Votre produit est maintenant visible',
      variant: 'success',
      action: {
        label: 'Voir',
        onClick: () => navigate(`/vendor-product-detail/${productId}`)
      }
    });
  }
});

// Indicateur discret dans l'UI
{status && !isCompleted && (
  <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Génération: {status.completionPercentage}%</span>
  </div>
)}
```

### Option 3 : Intégration avec la liste des produits

Afficher la progression directement dans la liste des produits :

```typescript
{products.map(product => {
  const { status, isCompleted } = useGenerationStatus(
    needsPolling ? product.id : null,
    user?.id,
    { autoStart: needsPolling }
  );

  return (
    <ProductCard key={product.id}>
      {product.name}

      {/* Indicateur de progression */}
      {status && !isCompleted && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">{status.completionPercentage}%</p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      )}
    </ProductCard>
  );
})}
```

## 📊 Personnalisation

### Changer l'intervalle de polling

```typescript
const { status } = useGenerationStatus(productId, vendorId, {
  pollInterval: 1000, // 1 seconde au lieu de 2
  maxDuration: 60000, // 1 minute au lieu de 2
});
```

### Callbacks personnalisés

```typescript
const { status } = useGenerationStatus(productId, vendorId, {
  onUpdate: (status) => {
    // Mettre à jour votre propre état
    setCustomProgress(status.completionPercentage);
  },
  onComplete: (status) => {
    // Navigation automatique
    navigate(`/vendor-product-detail/${productId}`);
  },
  onError: (error) => {
    // Gestion d'erreur personnalisée
    logErrorToService(error);
  }
});
```

## 🐛 Debugging

### Activer les logs détaillés

Le hook utilise déjà `console.log` pour le debugging. Ouvrez la console du navigateur pour voir :

```
📡 [useGenerationStatus] Récupération statut: https://...
✅ [useGenerationStatus] Statut reçu: {generationStatus: 'in_progress', ...}
📊 Mise à jour progression: 50
✅ [useGenerationStatus] Génération terminée !
```

### Tester sans backend

Pour tester le modal sans backend, vous pouvez utiliser des données mockées :

```typescript
// Simulation pour tests
const mockStatus: GenerationStatus = {
  productId: 123,
  productName: "Tshirt Test",
  productStatus: "PUBLISHED",
  generationStatus: "in_progress",
  totalColors: 4,
  generatedColors: 2,
  remainingColors: 2,
  completionPercentage: 50,
  estimatedTimePerColor: 3000,
  estimatedRemainingTime: 6000,
  estimatedRemainingSeconds: 6,
  finalImages: [],
  colors: [
    { id: 1, name: "Blanc", colorCode: "#ffffff", isGenerated: true, finalImageUrl: "...", generatedAt: "..." },
    { id: 2, name: "Blue", colorCode: "#0000ff", isGenerated: true, finalImageUrl: "...", generatedAt: "..." },
    { id: 3, name: "Rouge", colorCode: "#ff0000", isGenerated: false, finalImageUrl: null, generatedAt: null },
    { id: 4, name: "Noir", colorCode: "#000000", isGenerated: false, finalImageUrl: null, generatedAt: null },
  ],
  primaryImageUrl: "...",
  checkedAt: new Date().toISOString(),
  lastUpdate: new Date().toISOString()
};

<GenerationProgressModal
  productId={123}
  vendorId={3}
  productName="Tshirt Test"
  isOpen={true}
  // ... props
/>
```

## 📝 Résumé

### Avantages de cette solution

1. **Non-bloquant** : Le polling se fait en arrière-plan sans bloquer l'UI
2. **Arrêt automatique** : Le hook s'arrête quand la génération est terminée
3. **Timeout** : Protection contre les requêtes infinies
4. **Cleanup** : Arrêt automatique au démontage du composant
5. **Réutilisable** : Peut être utilisé partout dans l'application
6. **Type-safe** : Full TypeScript avec des types définis

### Workflow complet

```
1. Vendeur clique sur "Publier"
   ↓
2. Appel à POST /api/vendeur/publish-product
   ↓
3. Backend retourne { success: true, productId: 123, timing: {...} }
   ↓
4. Frontend affiche le modal de progression
   ↓
5. Hook poll GET /api/public/vendor-products/123/generation-status toutes les 2s
   ↓
6. Modal se met à jour en temps réel (barre de progression, couleurs générées...)
   ↓
7. Quand generationStatus === 'completed', modal affiche "✅ Terminé !"
   ↓
8. Modal se ferme automatiquement après 2 secondes
```

---

**Document créé** : 2026-01-28
**Version** : 1.0
**Auteur** : Claude Code Assistant
