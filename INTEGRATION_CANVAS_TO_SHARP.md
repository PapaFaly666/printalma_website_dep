# Guide d'Intégration Canvas → Sharp

## 🎯 Objectif

Convertir les éléments visuels du canvas de personnalisation (`/product/1/customize`) en données structurées que le backend peut utiliser avec Sharp pour générer `finalImageUrlCustom`.

## 📊 Architecture

```
Canvas DOM (Frontend)
    ↓
  canvasToDesignElements.ts
    ↓
  DesignElement[] (JSON)
    ↓
  POST /customizations/upsert
    ↓
  OrderMockupGeneratorService (Backend Sharp)
    ↓
  finalImageUrlCustom (Cloudinary)
```

## 🔧 Étape 1: Importer le helper

```typescript
// Dans votre composant de personnalisation
import {
  canvasToDesignElements,
  getProductImageUrl,
  prepareCustomizationData,
  extractAndSendCustomization
} from '@/utils/canvasToDesignElements';
```

## 🎨 Étape 2: Extraire les données du canvas

### Option A: Extraction simple

```typescript
// Référence au canvas
const canvasRef = useRef<HTMLDivElement>(null);

// Au moment de sauvegarder
const handleSave = () => {
  if (!canvasRef.current) return;

  // Extraire les données
  const customizationData = prepareCustomizationData(canvasRef.current);

  console.log('Données extraites:', customizationData);
  // {
  //   designElements: [...],
  //   productImageUrl: "https://...",
  //   canvasDimensions: { width: 900, height: 900 },
  //   elementsByView: { "900-900": [...] }
  // }
};
```

### Option B: Extraction complète avec envoi API

```typescript
const handleSaveAndGenerate = async () => {
  if (!canvasRef.current) return;

  // Extraire et préparer les données
  const apiData = extractAndSendCustomization(canvasRef.current, {
    productId: 1,
    colorVariationId: selectedColorId,
    viewId: selectedViewId,
    clientEmail: 'client@example.com', // Optionnel
    clientName: 'Jean Dupont'          // Optionnel
  });

  // Envoyer au backend
  const response = await fetch('/api/customizations/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData)
  });

  const result = await response.json();
  console.log('Personnalisation sauvegardée:', result);
  console.log('Image finale:', result.finalImageUrlCustom);
};
```

## 📝 Étape 3: Utiliser dans le composant

### Structure HTML attendue

```tsx
<div
  ref={canvasRef}
  className="relative bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
  style={{
    width: 'min(95%, -180px + 100vh)',
    height: 'min(95%, -180px + 100vh)',
    maxWidth: '900px',
    maxHeight: '900px',
    aspectRatio: '1 / 1'
  }}
>
  {/* Image du produit */}
  <img
    alt="Produit"
    className="w-full h-full object-contain pointer-events-none"
    draggable="false"
    src={productImageUrl}
  />

  {/* Éléments de texte/image positionnés */}
  {elements.map((element, index) => (
    <div
      key={element.id}
      className="absolute"
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: element.zIndex,
        pointerEvents: 'none'
      }}
    >
      <div
        className="relative cursor-move"
        style={{
          transform: `rotate(${element.rotation}deg)`,
          transformOrigin: 'center center',
          width: `${element.width}px`,
          height: `${element.height}px`,
          pointerEvents: 'auto'
        }}
      >
        {/* Pour un élément texte */}
        {element.type === 'text' && (
          <div
            style={{
              fontFamily: element.fontFamily,
              fontSize: `${element.fontSize}px`,
              color: element.color,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              textAlign: element.textAlign,
              lineHeight: 1.2,
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            dangerouslySetInnerHTML={{
              __html: element.text.replace(/\n/g, '<br>')
            }}
          />
        )}

        {/* Pour un élément image */}
        {element.type === 'image' && (
          <img
            src={element.imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </div>
    </div>
  ))}
</div>
```

### Bouton de sauvegarde

```tsx
<button
  onClick={handleSaveAndGenerate}
  className="px-6 py-3 bg-blue-600 text-white rounded-lg"
>
  Sauvegarder et Générer Image Finale
</button>
```

## 🔍 Exemple de données extraites

### Entrée (HTML DOM)

```html
<div class="absolute" style="left: 323.37px; top: 207.73px; ...">
  <div style="transform: rotate(15deg); width: 186px; height: 56px;">
    <div style="font-family: Arial; font-size: 23px; color: rgb(0, 0, 0); font-weight: bold; text-align: center;">
      VRAI GARCON<br>SPORT
    </div>
  </div>
</div>
```

### Sortie (JSON)

```json
{
  "designElements": [
    {
      "id": "text-1",
      "type": "text",
      "text": "VRAI GARCON\nSPORT",
      "x": 323.37,
      "y": 207.73,
      "width": 186,
      "height": 56,
      "rotation": 15,
      "zIndex": 1,
      "fontSize": 23,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "opacity": 1
    }
  ],
  "productImageUrl": "https://res.cloudinary.com/.../T-Shirt_Premium_Blanc.jpg",
  "canvasDimensions": { "width": 900, "height": 900 },
  "elementsByView": {
    "900-900": [/* mêmes éléments */]
  }
}
```

## 🚀 Étape 4: Envoyer au backend

### Code complet d'intégration

```typescript
import { useState, useRef } from 'react';
import { extractAndSendCustomization } from '@/utils/canvasToDesignElements';

export default function CustomizePage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);

  const handleSaveCustomization = async () => {
    if (!canvasRef.current) {
      alert('Canvas non trouvé');
      return;
    }

    setLoading(true);

    try {
      // 1. Extraire les données du canvas
      const apiData = extractAndSendCustomization(canvasRef.current, {
        productId: productId, // De vos props/state
        colorVariationId: selectedColorId,
        viewId: selectedViewId,
        clientEmail: userEmail, // Optionnel
        clientName: userName     // Optionnel
      });

      console.log('📤 Envoi des données:', apiData);

      // 2. Envoyer au backend
      const response = await fetch('http://localhost:3004/customizations/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      console.log('✅ Personnalisation sauvegardée:', result);

      // 3. Récupérer l'URL de l'image finale
      if (result.finalImageUrlCustom) {
        setFinalImageUrl(result.finalImageUrlCustom);
        console.log('🖼️ Image finale générée:', result.finalImageUrlCustom);

        // Optionnel: Afficher un message de succès
        alert('Personnalisation sauvegardée ! Vérifiez votre email.');
      }

    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Canvas de personnalisation */}
      <div ref={canvasRef} className="...">
        {/* Contenu du canvas */}
      </div>

      {/* Bouton de sauvegarde */}
      <button
        onClick={handleSaveCustomization}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? 'Génération en cours...' : 'Sauvegarder'}
      </button>

      {/* Afficher l'image finale */}
      {finalImageUrl && (
        <div className="mt-4">
          <h3>Votre personnalisation finale :</h3>
          <img src={finalImageUrl} alt="Personnalisation finale" className="max-w-md" />
        </div>
      )}
    </div>
  );
}
```

## 🧪 Test

### 1. Vérifier l'extraction

```typescript
// Dans la console du navigateur
const canvas = document.querySelector('[alt="Produit"]')?.parentElement;
if (canvas) {
  const data = prepareCustomizationData(canvas as HTMLElement);
  console.log('Données extraites:', data);
}
```

### 2. Tester l'envoi

```bash
# Avec curl (après avoir extrait les données)
curl -X POST http://localhost:3004/customizations/upsert \
  -H "Content-Type: application/json" \
  -d @extracted-data.json
```

### 3. Vérifier le résultat

```bash
# Voir la personnalisation dans la BD
psql $DATABASE_URL -c "SELECT id, final_image_url_custom FROM product_customizations ORDER BY id DESC LIMIT 1;"
```

## 🔍 Debug

### Logs côté frontend

```typescript
console.log('📊 Canvas element:', canvasRef.current);
console.log('📊 Design elements:', canvasToDesignElements(canvasRef.current));
console.log('📊 Product image:', getProductImageUrl(canvasRef.current));
```

### Logs côté backend

Voir dans les logs du serveur :
```
🎨 Génération du mockup avec Sharp (système robuste)...
📐 Configuration:
   - Image produit: https://...
   - Nombre d'éléments: 1
   - Délimitation: Aucune
🎨 [Mockup] Génération d'une image finale avec 1 élément(s)
✅ Mockup généré: https://res.cloudinary.com/...
💾 Mockup sauvegardé dans finalImageUrlCustom
```

## ⚠️ Points importants

1. **Structure HTML**: Le canvas doit avoir la structure attendue (img principale + div absolute)
2. **Référence au canvas**: Utiliser `useRef` pour garder une référence DOM
3. **Email optionnel**: L'email n'est plus obligatoire pour générer le mockup
4. **Régénération**: Utiliser `POST /customizations/:id/regenerate-mockup` pour régénérer

## 🎯 Résultat attendu

Après la sauvegarde :
- ✅ `designElements` extraits du DOM
- ✅ Envoyés au backend
- ✅ Mockup généré avec Sharp
- ✅ Uploadé vers Cloudinary
- ✅ `finalImageUrlCustom` rempli dans la BD
- ✅ Email envoyé au client (si email fourni)

## 📚 Fichiers

### Frontend
- ✅ `src/utils/canvasToDesignElements.ts` - Helper d'extraction
- ✅ `INTEGRATION_CANVAS_TO_SHARP.md` - Ce guide

### Backend
- ✅ `src/customization/customization.service.ts` - Génération Sharp
- ✅ `src/order/services/order-mockup-generator.service.ts` - Service Sharp

---

**Date**: 2026-03-03
**Helper**: `canvasToDesignElements.ts`
**Endpoint**: `POST /customizations/upsert`
