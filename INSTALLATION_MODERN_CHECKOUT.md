# 🚀 Installation du Checkout Moderne

## Option 1 : Remplacer l'ancienne page (Recommandé)

### Étape 1 : Modifier App.tsx

Ouvrez `/src/App.tsx` et localisez la ligne 248 :

```tsx
// AVANT
<Route path='/order-form' element={<OrderFormPage />} />

// APRÈS
<Route path='/order-form' element={<ModernOrderFormPage />} />
```

### Étape 2 : Mettre à jour l'import

En haut du fichier App.tsx, remplacez :

```tsx
// AVANT
import OrderFormPage from './pages/OrderFormPage';

// APRÈS
import ModernOrderFormPage from './pages/ModernOrderFormPage';
```

✅ **C'est tout !** Votre checkout moderne est maintenant actif sur `/order-form`

---

## Option 2 : Tester en parallèle (Pour tests)

Si vous voulez tester la nouvelle page sans remplacer l'ancienne :

### Ajoutez une nouvelle route dans App.tsx

```tsx
// Gardez l'ancienne
<Route path='/order-form' element={<OrderFormPage />} />

// Ajoutez la nouvelle
<Route path='/modern-checkout' element={<ModernOrderFormPage />} />
```

### Ajoutez l'import

```tsx
import ModernOrderFormPage from './pages/ModernOrderFormPage';
```

### Testez la nouvelle page

Naviguez vers : `http://localhost:5174/modern-checkout`

---

## ✅ Vérification de l'installation

### 1. Vérifier que le serveur démarre

```bash
npm run dev
```

Devrait démarrer sur `http://localhost:5174`

### 2. Vérifier les imports

Assurez-vous que tous les imports sont présents dans ModernOrderFormPage.tsx :

```tsx
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../hooks/useOrder';
import { orderService } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';
import { validatePaymentData } from '../types/payment';
import SimpleProductPreview from '../components/vendor/SimpleProductPreview';
import { formatPrice } from '../utils/priceUtils';
import { motion, AnimatePresence } from 'framer-motion';
```

### 3. Tester le flux complet

1. Ajoutez un produit au panier
2. Cliquez sur "Commander" ou naviguez vers `/order-form`
3. Remplissez le formulaire (étape 1)
4. Sélectionnez une option de livraison (étape 2)
5. Choisissez un mode de paiement (étape 3)
6. Vérifiez et confirmez (étape 4)

---

## 🐛 Résolution de problèmes

### Erreur : "framer-motion not found"

```bash
npm install framer-motion
```

### Erreur : "Cannot find module SimpleProductPreview"

Vérifiez que le fichier existe :
```
/src/components/vendor/SimpleProductPreview.tsx
```

### Erreur : TypeScript sur OrderRequest

Assurez-vous d'avoir :
```tsx
import { orderService, type CreateOrderRequest as OrderRequest } from '../services/orderService';
```

### Les animations ne fonctionnent pas

Vérifiez que framer-motion est installé et importé :
```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

### Le panier est vide au chargement

Ajoutez un produit au panier depuis une autre page avant d'accéder au checkout :
- Page produit → Ajouter au panier → Voir le panier → Commander

---

## 🎨 Personnalisation

### Modifier les couleurs

Dans `ModernOrderFormPage.tsx`, recherchez et modifiez :

```tsx
// Couleur primaire (bleu)
from-blue-600 to-blue-700

// Couleur de succès (vert)
from-green-600 to-green-700

// Couleur accent (violet)
bg-purple-100 text-purple-600
```

### Modifier les options de livraison

Ligne ~156 :

```tsx
const deliveryOptions: DeliveryOption[] = [
  {
    id: 'standard',
    name: 'Livraison Standard',
    price: 1500, // En FCFA
    estimatedDays: 3,
    description: 'Livraison à domicile sous 3-5 jours'
  },
  // ... autres options
];
```

### Modifier les méthodes de paiement

Ligne ~822 :

```tsx
{['📱 Orange Money', '💰 Wave', '📲 Free Money', '💳 Carte bancaire', '🏦 MTN Money', '💵 Moov Money'].map((method) => (
  // ...
))}
```

---

## 📚 Documentation complémentaire

- **README détaillé** : `MODERN_CHECKOUT_README.md`
- **Code source** : `src/pages/ModernOrderFormPage.tsx`
- **Ancienne version** : `src/pages/OrderFormPage.tsx` (pour comparaison)

---

## 🎯 Comparaison rapide

| Fonctionnalité | Ancienne | Moderne |
|---------------|----------|---------|
| Fichier | OrderFormPage.tsx | ModernOrderFormPage.tsx |
| Lignes de code | ~1130 | ~1030 |
| Animations | CSS basique | Framer Motion |
| Layout | 1 colonne responsive | 2 colonnes + sticky |
| Étapes | Sections fixes | Navigation fluide |
| Preview produit | Image simple | SimpleProductPreview |
| Progression | Texte | Barre animée |

---

## ✅ Checklist de migration

- [ ] Installer framer-motion si nécessaire
- [ ] Modifier l'import dans App.tsx
- [ ] Modifier la route dans App.tsx
- [ ] Tester le formulaire (toutes les étapes)
- [ ] Tester avec PayDunya
- [ ] Tester avec paiement à la livraison
- [ ] Vérifier le responsive (mobile/tablet/desktop)
- [ ] Vérifier l'écran de succès
- [ ] Tester la gestion d'erreurs
- [ ] Vérifier les logs console

---

**Besoin d'aide ?** Consultez `MODERN_CHECKOUT_README.md` pour plus de détails.
