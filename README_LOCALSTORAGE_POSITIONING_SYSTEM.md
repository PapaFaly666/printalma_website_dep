# 📑 Guide localStorage - Positionnement Design sans Création Produit

> **NOUVELLE APPROCHE** : Tout le positionnement se fait en localStorage.  
> Aucun produit n'est créé tant que l'utilisateur n'a pas validé.

---

## 🔰 Pré-requis
- Avoir un **token de session** (cookies) après le `login` vendeur
- Connaître le `baseProductId` du produit admin (ex : `1`)
- Avoir au moins **un design** déjà créé
- Connaître le `vendorId` pour l'identification des brouillons

---

## 📋 Architecture des composants

```
src/
├── services/
│   └── DesignPositionService.ts         # Service localStorage
├── hooks/
│   └── useDesignPositionLocalStorage.ts # Hook principal
├── components/vendor/
│   ├── VendorDesignTransformationWorkflow.tsx # Composant principal
│   ├── SaveIndicator.tsx                # Indicateur de sauvegarde
│   ├── ProductCreationModal.tsx         # Modal de création finale
│   └── DraftsList.tsx                   # Liste des brouillons
└── pages/vendor/
    └── VendorDesignPositioningPage.tsx  # Page d'exemple
```

---

## Étape 1 : Structure localStorage ✅

### 1.1 Clé localStorage
```ts
const DESIGN_POSITION_KEY = `design_position_${vendorId}_${baseProductId}_${designId}`;
```

### 1.2 Structure des données
```ts
interface DesignPositionData {
  designId: number;
  baseProductId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  timestamp: number;
  vendorId: number;
  // Optionnel : aperçu des sélections
  previewSelections?: {
    colors: any[];
    sizes: any[];
    price: number;
    stock: number;
  };
}
```

---

## Étape 2 : Sauvegarde automatique position ✅

### 2.1 Service DesignPositionService
```ts
class DesignPositionService {
  savePosition(
    vendorId: number,
    baseProductId: number,
    designId: number,
    position: { x: number; y: number; scale: number; rotation: number },
    previewSelections?: { colors: any[]; sizes: any[]; price: number; stock: number }
  ): void {
    const key = `design_position_${vendorId}_${baseProductId}_${designId}`;
    const data: DesignPositionData = {
      designId,
      baseProductId,
      position,
      timestamp: Date.now(),
      vendorId,
      previewSelections
    };

    localStorage.setItem(key, JSON.stringify(data));
    console.log('💾 Position sauvegardée en localStorage:', key);
  }

  loadPosition(vendorId: number, baseProductId: number, designId: number): DesignPositionData | null {
    const key = `design_position_${vendorId}_${baseProductId}_${designId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }
}
```

### 2.2 Hook useDesignPositionLocalStorage
```ts
export const useDesignPositionLocalStorage = ({
  vendorId,
  baseProductId,
  designId,
  debounceMs = 300
}: UseDesignPositionLocalStorageProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [hasPosition, setHasPosition] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction de sauvegarde avec debounce
  const savePosition = useCallback((newPosition: Position) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      designPositionService.savePosition(vendorId, baseProductId, designId, newPosition);
      setLastSaved(new Date());
      setHasPosition(true);
    }, debounceMs);
  }, [vendorId, baseProductId, designId, debounceMs]);

  return {
    position,
    setPosition: (newPosition) => {
      setPosition(newPosition);
      savePosition(newPosition);
    },
    hasPosition,
    lastSaved,
    deletePosition: () => designPositionService.deletePosition(vendorId, baseProductId, designId),
    getAllDrafts: () => designPositionService.getAllDrafts(),
    cleanupOldDrafts: (maxAgeHours = 24) => designPositionService.cleanupOldDrafts(maxAgeHours)
  };
};
```

---

## Étape 3 : Validation et création produit final ✅

### 3.1 Composant ProductCreationModal
```tsx
export const ProductCreationModal = ({ isOpen, onClose, vendorId, baseProductId, designId, adminProduct, onProductCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 35000,
    stock: 50,
    selectedColors: [],
    selectedSizes: []
  });
  
  const [savedPosition, setSavedPosition] = useState<DesignPositionData | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      const position = designPositionService.loadPosition(vendorId, baseProductId, designId);
      setSavedPosition(position);
    }
  }, [isOpen, vendorId, baseProductId, designId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      baseProductId: savedPosition.baseProductId,
      designId: savedPosition.designId,
      vendorName: formData.name,
      vendorDescription: formData.description,
      vendorPrice: formData.price,
      vendorStock: formData.stock,
      selectedColors: formData.selectedColors,
      selectedSizes: formData.selectedSizes,
      productStructure: {
        adminProduct: adminProduct,
        designApplication: { positioning: "CENTER", scale: 0.6 }
      },
      designPosition: savedPosition.position // 📍 Position depuis localStorage
    };
    
    const response = await fetch('/vendor/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Nettoyer le localStorage
      designPositionService.deletePosition(vendorId, baseProductId, designId);
      
      onProductCreated(result.productId || result.id);
      onClose();
    }
  };
  
  // ... reste du composant
};
```

---

## Étape 4 : Gestion de la liste des "brouillons" ✅

### 4.1 Composant DraftsList
```tsx
export const DraftsList = ({ onEditDraft, onCreateProductFromDraft, onDeleteDraft }) => {
  const [drafts, setDrafts] = useState<DesignPositionData[]>([]);
  
  useEffect(() => {
    const allDrafts = designPositionService.getAllDrafts();
    setDrafts(allDrafts);
  }, []);
  
  const handleDeleteDraft = (draft: DesignPositionData) => {
    designPositionService.deletePosition(draft.vendorId, draft.baseProductId, draft.designId);
    setDrafts(prev => prev.filter(d => 
      !(d.designId === draft.designId && d.baseProductId === draft.baseProductId)
    ));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drafts.map((draft) => (
        <div key={`${draft.vendorId}_${draft.baseProductId}_${draft.designId}`} className="border rounded-lg p-4">
          <h4>Design #{draft.designId}</h4>
          <p>Position: x={draft.position.x}, y={draft.position.y}</p>
          <p>Modifié: {new Date(draft.timestamp).toLocaleString()}</p>
          
          <div className="flex space-x-2 mt-4">
            <Button onClick={() => onEditDraft(draft)}>Continuer</Button>
            <Button onClick={() => onCreateProductFromDraft(draft)}>Créer</Button>
            <Button onClick={() => handleDeleteDraft(draft)}>Supprimer</Button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 4.2 Nettoyage localStorage
```ts
function cleanupOldDrafts(maxAgeHours = 24): number {
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  let cleaned = 0;
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('design_position_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (now - data.timestamp > maxAge) {
          localStorage.removeItem(key);
          cleaned++;
        }
      } catch (error) {
        localStorage.removeItem(key); // Supprimer les données corrompues
        cleaned++;
      }
    }
  }
  
  return cleaned;
}
```

---

## Étape 5 : Interface utilisateur ✅

### 5.1 Indicateur de sauvegarde
```tsx
export const SaveIndicator = ({ lastSaved, hasPosition }) => {
  if (!hasPosition) {
    return (
      <Badge variant="outline" className="text-gray-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        Aucune sauvegarde
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-green-600">
      <Save className="h-3 w-3 mr-1" />
      Sauvegardé à {lastSaved?.toLocaleTimeString()}
    </Badge>
  );
};
```

### 5.2 Composant principal
```tsx
export const VendorDesignTransformationWorkflow = ({ baseProductId, designId, vendorId, onProductCreated }) => {
  const {
    position,
    setPosition,
    hasPosition,
    lastSaved,
    deletePosition,
    getAllDrafts,
    cleanupOldDrafts
  } = useDesignPositionLocalStorage({
    vendorId,
    baseProductId,
    designId: selectedDesign?.id || designId || 0,
    debounceMs: 300
  });
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(false);
  
  const handleValidateDesign = () => {
    if (!selectedDesign) {
      toast.error('Veuillez sélectionner un design');
      return;
    }
    
    if (!hasPosition) {
      toast.error('Veuillez positionner le design d\'abord');
      return;
    }
    
    setShowProductModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header avec indicateur */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2>Positionnement Design</h2>
          <SaveIndicator lastSaved={lastSaved} hasPosition={hasPosition} />
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => setShowDraftsList(true)}>
            Brouillons ({getAllDrafts().length})
          </Button>
          <Button onClick={() => cleanupOldDrafts()}>
            Nettoyer
          </Button>
        </div>
      </div>
      
      {/* Éditeur de design */}
      {/* ... */}
      
      {/* Bouton de validation */}
      <Button
        onClick={handleValidateDesign}
        disabled={!hasPosition}
        className="w-full"
      >
        {hasPosition ? 'Créer le produit' : 'Positionnez d\'abord le design'}
      </Button>
      
      {/* Modal de création */}
      <ProductCreationModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        vendorId={vendorId}
        baseProductId={baseProductId}
        designId={selectedDesign?.id || 0}
        adminProduct={adminProduct}
        onProductCreated={onProductCreated}
      />
      
      {/* Modal des brouillons */}
      {showDraftsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <DraftsList
                onEditDraft={handleEditDraft}
                onCreateProductFromDraft={handleCreateProductFromDraft}
                onDeleteDraft={handleDeleteDraft}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🏁 Résumé des avantages

✅ **Pas de pollution DB** : Aucun produit temporaire créé  
✅ **Réactivité** : Sauvegarde instantanée en localStorage  
✅ **Persistance** : Position conservée entre sessions  
✅ **Validation stricte** : Seuls les vrais produits sont créés  
✅ **Nettoyage auto** : Suppression des brouillons expirés  
✅ **UX fluide** : Indication claire de l'état de sauvegarde  
✅ **Gestion des brouillons** : Interface complète pour gérer les designs en cours

---

## 📊 Utilisation dans une page

```tsx
// pages/vendor/VendorDesignPositioningPage.tsx
import VendorDesignTransformationWorkflow from '../../components/vendor/VendorDesignTransformationWorkflow';

export default function VendorDesignPositioningPage() {
  const { baseProductId, designId } = useParams();
  const navigate = useNavigate();
  const [vendorId] = useState(1); // Récupérer depuis l'auth
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1>Positionnement Design</h1>
        <p>Stockage local • Pas de pollution DB • Validation finale</p>
        
        <VendorDesignTransformationWorkflow
          baseProductId={parseInt(baseProductId)}
          designId={designId ? parseInt(designId) : undefined}
          vendorId={vendorId}
          onProductCreated={(productId) => {
            toast.success('Produit créé avec succès !');
            navigate(`/vendor/products/${productId}`);
          }}
        />
      </div>
    </div>
  );
}
```

---

## 📋 Check-list finale

### Frontend
- [x] Structure localStorage implémentée
- [x] Sauvegarde automatique du positionnement (debounce 300ms)
- [x] Modal de création produit fonctionnelle
- [x] Validation backend stricte (pas de noms auto-générés)
- [x] Nettoyage localStorage des brouillons
- [x] Interface utilisateur avec indicateurs
- [x] Gestion complète des brouillons
- [x] Composants réutilisables

### Backend
- [x] Endpoint `POST /vendor/products` pour création finale
- [x] Validation normale des données (pas de bypassValidation)
- [x] Gestion des erreurs standards
- [x] Pas de endpoints spéciaux pour les brouillons

### UX
- [x] Indicateur de sauvegarde en temps réel
- [x] Bouton désactivé tant que pas de position
- [x] Modal complète avec tous les champs
- [x] Gestion des brouillons intuitive
- [x] Nettoyage automatique des données expirées

---

## 🎯 Avantages par rapport à l'ancienne approche

| Aspect | Ancienne approche (DB) | Nouvelle approche (localStorage) |
|--------|----------------------|--------------------------------|
| **Pollution DB** | ❌ Prototypes temporaires | ✅ Aucun produit temporaire |
| **Réactivité** | ❌ Appels API fréquents | ✅ Sauvegarde instantanée |
| **Persistance** | ✅ Serveur | ✅ Local + récupération |
| **Validation** | ❌ Bypass nécessaire | ✅ Validation normale |
| **Nettoyage** | ❌ Endpoints spéciaux | ✅ Automatique |
| **UX** | ❌ Erreurs "auto-générées" | ✅ Workflow fluide |

---

## 💡 Prochaines améliorations possibles

- [ ] Synchronisation optionnelle avec le serveur
- [ ] Export/import des brouillons
- [ ] Prévisualisation temps réel des mockups
- [ ] Historique des modifications
- [ ] Partage de brouillons entre utilisateurs
- [ ] Sauvegarde cloud optionnelle

---

*Dernière mise à jour : Décembre 2024* 