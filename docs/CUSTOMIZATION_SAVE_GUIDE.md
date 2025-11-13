# Documentation : Enregistrement des Personnalisations Produit

## Overview

Ce document explique comment implémenter la sauvegarde des personnalisations de produits dans la base de données via la page `/product/:id/customize`.

## Architecture Actuelle

### Fichiers concernés
- **Frontend** : `src/pages/CustomerProductCustomizationPageV3.tsx`
- **Service** : `src/services/designService.ts` (pour les designs déjà existants)
- **Backend** : À implémenter selon votre API

### Types de données à enregistrer

1. **Informations du produit**
   - ID du produit personnalisé
   - Variante de couleur sélectionnée
   - Taille choisie
   - Quantité

2. **Informations de personnalisation (Multi-layer)**
   - **Designs** : Tableau de plusieurs designs avec leurs positions
   - **Textes** : Tableau de plusieurs textes personnalisés avec leurs styles
   - **Layers** : Ordre de superposition des éléments
   - **Canvas global** : Dimensions du canvas de personnalisation

3. **Informations client**
   - ID utilisateur (si connecté)
   - Informations de session (si invité)

## Étapes d'implémentation

### 1. Création de l'interface TypeScript

Créer un nouveau fichier `src/types/customization.ts` :

```typescript
export interface BaseElement {
  id: string; // ID unique généré pour l'élément
  type: 'design' | 'text' | 'shape';
  position: {
    x: number; // Coordonnée X (pourcentage)
    y: number; // Coordonnée Y (pourcentage)
  };
  size: {
    width: number; // Largeur (pourcentage)
    height: number; // Hauteur (pourcentage)
  };
  rotation: number; // Angle en degrés
  opacity: number; // Opacité (0-1)
  scale: number; // Échelle
  zIndex: number; // Ordre de superposition
  locked: boolean; // Élément verrouillé ?
  visible: boolean; // Élément visible ?
}

export interface DesignElement extends BaseElement {
  type: 'design';
  designId?: number; // Si un design existant est utilisé
  imageUrl?: string; // URL de l'image (design uploadé)
  originalUrl?: string; // URL originale non compressée
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
  };
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number; // Taille en pixels
  fontWeight: string; // normal, bold, etc.
  fontStyle: string; // normal, italic
  textAlign: 'left' | 'center' | 'right';
  color: string; // Couleur hex
  textShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  textOutline?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  lineHeight: number; // Espacement entre lignes
  letterSpacing: number; // Espacement entre lettres
  textDecoration: 'none' | 'underline' | 'line-through';
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'polygon';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number;
  borderRadius?: number; // Pour rectangles
}

export type CanvasElement = DesignElement | TextElement | ShapeElement;

export interface CanvasInfo {
  width: number; // Largeur en pixels
  height: number; // Hauteur en pixels
  backgroundColor?: string;
  backgroundImage?: string;
  productImage?: string; // URL de l'image du produit
  delimitationZone?: {
    x: number; // Zone de personnalisation
    y: number;
    width: number;
    height: number;
  };
}

export interface CustomizationData {
  productId: number;
  colorVariationId: number;
  size: string;
  quantity: number;
  canvas: CanvasInfo;
  elements: CanvasElement[]; // Tous les éléments du canvas
  userId?: number;
  sessionId?: string;
  totalAmount: number;
  status: 'draft' | 'in_cart' | 'ordered' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface CustomizationResponse {
  success: boolean;
  customizationId?: number;
  message: string;
  previewUrl?: string;
  elementsCount?: number;
}

// Utilitaires
export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
}
```

### 2. Extension du service d'API

Créer ou étendre `src/services/customizationService.ts` :

```typescript
import { CustomizationData, CustomizationResponse, CanvasElement, TextElement, DesignElement } from '../types/customization';
import { API_CONFIG } from '../config/api';

export const customizationService = {
  // Sauvegarder une personnalisation complète (multi-elements)
  async saveCustomization(customizationData: CustomizationData): Promise<CustomizationResponse> {
    try {
      // Validation côté client avant envoi
      const validationError = this.validateCustomizationData(customizationData);
      if (validationError) {
        throw new Error(validationError);
      }

      // Optimiser les données avant envoi
      const optimizedData = this.optimizeDataForUpload(customizationData);

      const response = await fetch(`${API_CONFIG.baseURL}/customizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(optimizedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  },

  // Récupérer les personnalisations d'un utilisateur
  async getUserCustomizations(userId: number): Promise<CustomizationData[]> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/customizations/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const customizations = await response.json();
      return customizations.map((customization: CustomizationData) =>
        this.restoreDataFromBackend(customization)
      );
    } catch (error) {
      console.error('Error fetching customizations:', error);
      throw error;
    }
  },

  // Générer une preview multi-layer
  async generatePreview(customizationData: CustomizationData): Promise<string> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/customizations/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(customizationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.previewUrl;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  },

  // Ajouter au panier avec personnalisation multi-elements
  async addToCartWithCustomization(customizationData: CustomizationData): Promise<CustomizationResponse> {
    try {
      const validationError = this.validateCustomizationData(customizationData);
      if (validationError) {
        throw new Error(validationError);
      }

      const optimizedData = this.optimizeDataForUpload({
        ...customizationData,
        status: 'in_cart'
      });

      const response = await fetch(`${API_CONFIG.baseURL}/cart/customization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(optimizedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to cart with customization:', error);
      throw error;
    }
  },

  // Mettre à jour une personnalisation existante
  async updateCustomization(customizationId: number, updates: Partial<CustomizationData>): Promise<CustomizationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/customizations/${customizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating customization:', error);
      throw error;
    }
  },

  // Dupliquer une personnalisation
  async duplicateCustomization(customizationId: number): Promise<CustomizationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/customizations/${customizationId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error duplicating customization:', error);
      throw error;
    }
  },

  // === Méthodes utilitaires ===

  // Valider les données de personnalisation
  private validateCustomizationData(data: CustomizationData): string | null {
    if (!data.elements || data.elements.length === 0) {
      return 'La personnalisation doit contenir au moins un élément';
    }

    if (data.elements.length > 50) {
      return 'Le nombre maximum d\'éléments est de 50';
    }

    for (const element of data.elements) {
      // Valider la position
      if (element.position.x < 0 || element.position.x > 100 ||
          element.position.y < 0 || element.position.y > 100) {
        return 'Position d\'élément invalide';
      }

      // Valider la taille
      if (element.size.width <= 0 || element.size.height <= 0 ||
          element.size.width > 100 || element.size.height > 100) {
        return 'Taille d\'élément invalide';
      }

      // Valider spécifiquement les textes
      if (element.type === 'text') {
        const textElement = element as TextElement;
        if (!textElement.content || textElement.content.trim().length === 0) {
          return 'Le texte ne peut pas être vide';
        }
        if (textElement.content.length > 500) {
          return 'Le texte est trop long (max 500 caractères)';
        }
        if (textElement.fontSize < 8 || textElement.fontSize > 200) {
          return 'Taille de police invalide';
        }
      }

      // Valider spécifiquement les designs
      if (element.type === 'design') {
        const designElement = element as DesignElement;
        if (!designElement.designId && !designElement.imageUrl) {
          return 'Un design doit avoir un ID ou une URL d\'image';
        }
      }
    }

    return null;
  },

  // Optimiser les données pour l'upload
  private optimizeDataForUpload(data: CustomizationData): CustomizationData {
    return {
      ...data,
      elements: data.elements.map(element => {
        const optimized = { ...element };

        // Nettoyer les propriétés undefined ou null
        Object.keys(optimized).forEach(key => {
          if (optimized[key] === undefined || optimized[key] === null) {
            delete optimized[key];
          }
        });

        // Optimiser les espacements inutiles dans les textes
        if (optimized.type === 'text') {
          const textElement = optimized as TextElement;
          textElement.content = textElement.content.trim();
        }

        return optimized;
      })
    };
  },

  // Restaurer les données depuis le backend
  private restoreDataFromBackend(data: CustomizationData): CustomizationData {
    return {
      ...data,
      elements: data.elements.map(element => {
        // Assurer que tous les éléments ont les propriétés par défaut
        const restored = {
          ...element,
          position: element.position || { x: 0, y: 0 },
          size: element.size || { width: 10, height: 10 },
          rotation: element.rotation || 0,
          opacity: element.opacity || 1,
          scale: element.scale || 1,
          zIndex: element.zIndex || 0,
          locked: element.locked || false,
          visible: element.visible !== false // Par défaut visible
        };

        // Valeurs par défaut spécifiques aux types
        if (restored.type === 'text') {
          const textElement = restored as TextElement;
          textElement.fontSize = textElement.fontSize || 16;
          textElement.fontFamily = textElement.fontFamily || 'Arial';
          textElement.color = textElement.color || '#000000';
          textElement.lineHeight = textElement.lineHeight || 1.2;
          textElement.letterSpacing = textElement.letterSpacing || 0;
        }

        return restored;
      })
    };
  }
};
```

### 3. Intégration dans CustomerProductCustomizationPageV3

Dans `src/pages/CustomerProductCustomizationPageV3.tsx` :

```typescript
import { customizationService } from '../services/customizationService';
import { DesignPosition, CustomizationData } from '../types/customization';

// Ajouter cette fonction dans le composant
const handleSaveCustomization = async (size: string, quantity: number): Promise<void> => {
  if (!product || !selectedColorVariation) {
    setError('Informations produit manquantes');
    return;
  }

  try {
    // Récupérer la position du design depuis le ProductDesignEditor
    const designPosition = designEditorRef.current?.getDesignPosition();

    if (!designPosition) {
      setError('Veuillez positionner votre design avant de sauvegarder');
      return;
    }

    const customizationData: CustomizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation.id,
      size,
      quantity,
      designId: selectedDesign?.id,
      designPosition,
      designImageUrl: selectedDesign?.imageUrl || uploadedDesignUrl,
      userId: user?.id,
      sessionId: !user ? generateSessionId() : undefined,
      totalAmount: quantity * (product.suggestedPrice || product.price),
      createdAt: new Date().toISOString()
    };

    const response = await customizationService.addToCartWithCustomization(customizationData);

    if (response.success) {
      toast({
        title: "Succès",
        description: "Personnalisation ajoutée au panier",
      });

      // Optionnel : mettre à jour le compteur du panier
      updateCartCount();

      // Fermer le modal et réinitialiser
      setShowSizeModal(false);
      // Autres actions nécessaires...
    } else {
      setError(response.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Error saving customization:', error);
    setError('Erreur lors de la sauvegarde de la personnalisation');
  }
};

// Helper pour générer un ID de session pour les utilisateurs non connectés
const generateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};
```

### 4. Extension du ProductDesignEditor

Dans `src/components/ProductDesignEditor.tsx`, ajouter une méthode pour récupérer la position :

```typescript
// Méthode à exposer via ref
export interface ProductDesignEditorRef {
  getDesignPosition: () => DesignPosition | null;
  resetDesign: () => void;
  // ... autres méthodes existantes
}

// Implémentation dans le composant
const ProductDesignEditor = forwardRef<ProductDesignEditorRef, ProductDesignEditorProps>(
  ({ ...props }, ref) => {
    // ... code existant ...

    // Exposer les méthodes via useImperativeHandle
    useImperativeHandle(ref, () => ({
      getDesignPosition: (): DesignPosition | null => {
        if (!fabricCanvas || !designObject) {
          return null;
        }

        const canvasElement = fabricCanvas.getElement();
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;

        const designPosition = designObject;
        const center = designPosition.getCenterPoint();

        return {
          x: (center.x / canvasWidth) * 100, // Convertir en pourcentage
          y: (center.y / canvasHeight) * 100,
          width: (designPosition.width! / canvasWidth) * 100,
          height: (designPosition.height! / canvasHeight) * 100,
          rotation: designPosition.angle || 0,
          opacity: designPosition.opacity || 1,
          scale: designPosition.scaleX || 1
        };
      },
      resetDesign: () => {
        // Réinitialiser le design
        if (designObject) {
          fabricCanvas.remove(designObject);
          setDesignObject(null);
        }
      }
    }));

    // ... reste du composant ...
  }
);
```

## Structure de la base de données

### Tables pour multi-elements

#### Table `customizations`

```sql
CREATE TABLE customizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    color_variation_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    size VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    canvas_info JSON NOT NULL, -- Informations du canvas (dimensions, background, etc.)
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'in_cart', 'ordered', 'completed', 'cancelled') DEFAULT 'draft',
    preview_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (color_variation_id) REFERENCES color_variations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),

    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### Table `customization_elements`

```sql
CREATE TABLE customization_elements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customization_id INT NOT NULL,
    element_id VARCHAR(100) NOT NULL, -- ID unique généré par le frontend
    element_type ENUM('design', 'text', 'shape') NOT NULL,
    element_data JSON NOT NULL, -- Toutes les propriétés de l'élément
    position_x DECIMAL(5,2) NOT NULL, -- Coordonnées en pourcentage
    position_y DECIMAL(5,2) NOT NULL,
    size_width DECIMAL(5,2) NOT NULL,
    size_height DECIMAL(5,2) NOT NULL,
    rotation DECIMAL(5,2) DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 1.0,
    scale DECIMAL(5,2) DEFAULT 1.0,
    z_index INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customization_id) REFERENCES customizations(id) ON DELETE CASCADE,

    INDEX idx_customization_id (customization_id),
    INDEX idx_element_type (element_type),
    INDEX idx_z_index (z_index),
    UNIQUE KEY unique_element (customization_id, element_id)
);
```

#### Table `design_images` (pour les images uploadées)

```sql
CREATE TABLE design_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customization_element_id INT NULL,
    original_url VARCHAR(500) NOT NULL,
    optimized_url VARCHAR(500) NULL,
    thumbnail_url VARCHAR(500) NULL,
    file_size INT NULL, -- Taille en bytes
    file_type VARCHAR(20) NULL, -- PNG, JPG, SVG
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customization_element_id) REFERENCES customization_elements(id) ON DELETE CASCADE,
    INDEX idx_customization_element (customization_element_id)
);
```

### Structure JSON pour `canvas_info`

```json
{
  "width": 800,
  "height": 600,
  "backgroundColor": "#ffffff",
  "backgroundImage": null,
  "productImage": "/products/tshirt-mockup.jpg",
  "delimitationZone": {
    "x": 200,
    "y": 150,
    "width": 400,
    "height": 300
  }
}
```

### Structure JSON pour `element_data` selon le type

#### Pour un `design` :
```json
{
  "type": "design",
  "designId": 123,
  "imageUrl": "/uploads/custom-design-abc123.png",
  "originalUrl": "/uploads/original-design-abc123.png",
  "filters": {
    "brightness": 1.1,
    "contrast": 1.0,
    "saturation": 1.2,
    "hue": 0,
    "blur": 0
  }
}
```

#### Pour un `text` :
```json
{
  "type": "text",
  "content": "Mon texte personnalisé",
  "fontFamily": "Arial",
  "fontSize": 24,
  "fontWeight": "bold",
  "fontStyle": "normal",
  "textAlign": "center",
  "color": "#FF0000",
  "textShadow": {
    "enabled": true,
    "color": "#000000",
    "blur": 2,
    "offsetX": 1,
    "offsetY": 1
  },
  "textOutline": {
    "enabled": false
  },
  "lineHeight": 1.2,
  "letterSpacing": 0,
  "textDecoration": "none"
}
```

#### Pour une `shape` :
```json
{
  "type": "shape",
  "shapeType": "circle",
  "fillColor": "#FFD700",
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "borderRadius": 0
}
```

## API Backend (Node.js/Express Exemple)

### Models Sequelize/Mongoose

#### Model Customization (Sequelize)

```javascript
// models/Customization.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customization = sequelize.define('Customization', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    colorVariationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'color_variations',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    canvasInfo: {
      type: DataTypes.JSON,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'in_cart', 'ordered', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    previewUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'customizations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Customization.associate = (models) => {
    Customization.belongsTo(models.Product, { foreignKey: 'productId' });
    Customization.belongsTo(models.ColorVariation, { foreignKey: 'colorVariationId' });
    Customization.belongsTo(models.User, { foreignKey: 'userId' });
    Customization.hasMany(models.CustomizationElement, { foreignKey: 'customizationId', as: 'elements' });
  };

  return Customization;
};
```

#### Model CustomizationElement (Sequelize)

```javascript
// models/CustomizationElement.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomizationElement = sequelize.define('CustomizationElement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customizations',
        key: 'id'
      }
    },
    elementId: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    elementType: {
      type: DataTypes.ENUM('design', 'text', 'shape'),
      allowNull: false
    },
    elementData: {
      type: DataTypes.JSON,
      allowNull: false
    },
    positionX: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    positionY: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    sizeWidth: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    sizeHeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    rotation: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    opacity: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.0
    },
    scale: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0
    },
    zIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'customization_elements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['customizationId', 'elementId']
      }
    ]
  });

  CustomizationElement.associate = (models) => {
    CustomizationElement.belongsTo(models.Customization, { foreignKey: 'customizationId' });
    CustomizationElement.hasOne(models.DesignImage, { foreignKey: 'customizationElementId' });
  };

  return CustomizationElement;
};
```

### Routes avec Multi-Elements

```javascript
// routes/customizations.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Customization = require('../models/Customization');
const CustomizationElement = require('../models/CustomizationElement');
const DesignImage = require('../models/DesignImage');
const auth = require('../middleware/auth');
const { generatePreviewImage } = require('../services/imageService');

// Middleware de validation pour les personnalisations multi-elements
const validateCustomization = [
  body('productId').isInt({ min: 1 }),
  body('colorVariationId').isInt({ min: 1 }),
  body('size').isLength({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('canvas').isObject().withMessage('Canvas info is required'),
  body('elements').isArray({ min: 1 }).withMessage('At least one element is required'),
  body('elements.*.type').isIn(['design', 'text', 'shape']),
  body('elements.*.position.x').isFloat({ min: 0, max: 100 }),
  body('elements.*.position.y').isFloat({ min: 0, max: 100 }),
  body('elements.*.size.width').isFloat({ min: 0.1, max: 100 }),
  body('elements.*.size.height').isFloat({ min: 0.1, max: 100 }),
  body('elements.*.rotation').isFloat({ min: -360, max: 360 }),
  body('elements.*.opacity').isFloat({ min: 0, max: 1 }),
  body('elements.*.scale').isFloat({ min: 0.1, max: 10 }),
  body('elements.*.zIndex').isInt({ min: 0, max: 1000 })
];

// Validation spécifique pour les textes
const validateTextElements = (req, res, next) => {
  const elements = req.body.elements || [];

  for (const element of elements) {
    if (element.type === 'text') {
      if (!element.content || element.content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Text content cannot be empty'
        });
      }
      if (element.content.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Text content too long (max 500 characters)'
        });
      }
      if (!element.fontSize || element.fontSize < 8 || element.fontSize > 200) {
        return res.status(400).json({
          success: false,
          message: 'Invalid font size (8-200px)'
        });
      }
    }

    if (element.type === 'design' && !element.designId && !element.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Design must have designId or imageUrl'
      });
    }
  }

  next();
};

// Créer une personnalisation multi-elements
router.post('/', auth, validateCustomization, validateTextElements, async (req, res) => {
  const transaction = await Customization.sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { elements, canvas, ...customizationData } = req.body;

    // Créer la personnalisation principale
    const customization = await Customization.create({
      ...customizationData,
      userId: req.user.id,
      canvasInfo: canvas,
      status: 'draft'
    }, { transaction });

    // Créer tous les éléments
    const createdElements = [];
    for (const element of elements) {
      const createdElement = await CustomizationElement.create({
        customizationId: customization.id,
        elementId: element.id,
        elementType: element.type,
        elementData: element,
        positionX: element.position.x,
        positionY: element.position.y,
        sizeWidth: element.size.width,
        sizeHeight: element.size.height,
        rotation: element.rotation || 0,
        opacity: element.opacity || 1,
        scale: element.scale || 1,
        zIndex: element.zIndex || 0,
        isLocked: element.locked || false,
        isVisible: element.visible !== false
      }, { transaction });

      // Gérer les images uploadées pour les designs
      if (element.type === 'design' && element.imageUrl && element.imageUrl.startsWith('/uploads/')) {
        await DesignImage.create({
          customizationElementId: createdElement.id,
          originalUrl: element.originalUrl || element.imageUrl,
          optimizedUrl: element.imageUrl,
          file_type: 'PNG'
        }, { transaction });
      }

      createdElements.push(createdElement);
    }

    // Générer une preview en arrière-plan
    setImmediate(async () => {
      try {
        const previewUrl = await generatePreviewImage(customization.id, canvas, elements);
        await customization.update({ previewUrl });
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      customizationId: customization.id,
      message: 'Personnalisation sauvegardée avec succès',
      elementsCount: elements.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error saving customization:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la sauvegarde'
    });
  }
});

// Ajouter au panier avec personnalisation
router.post('/cart', auth, validateCustomization, validateTextElements, async (req, res) => {
  const transaction = await Customization.sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { elements, canvas, ...customizationData } = req.body;

    // Créer la personnalisation avec statut 'in_cart'
    const customization = await Customization.create({
      ...customizationData,
      userId: req.user.id,
      canvasInfo: canvas,
      status: 'in_cart'
    }, { transaction });

    // Créer tous les éléments
    for (const element of elements) {
      await CustomizationElement.create({
        customizationId: customization.id,
        elementId: element.id,
        elementType: element.type,
        elementData: element,
        positionX: element.position.x,
        positionY: element.position.y,
        sizeWidth: element.size.width,
        sizeHeight: element.size.height,
        rotation: element.rotation || 0,
        opacity: element.opacity || 1,
        scale: element.scale || 1,
        zIndex: element.zIndex || 0,
        isLocked: element.locked || false,
        isVisible: element.visible !== false
      }, { transaction });
    }

    // Ajouter au panier existant (adapter selon votre logique)
    // await CartService.addItem(req.user.id, customization.id, customizationData.quantity);

    await transaction.commit();

    res.json({
      success: true,
      customizationId: customization.id,
      message: 'Personnalisation ajoutée au panier',
      elementsCount: elements.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout au panier'
    });
  }
});

// Récupérer une personnalisation avec tous ses éléments
router.get('/:id', auth, async (req, res) => {
  try {
    const customization = await Customization.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // Un utilisateur ne peut voir que ses propres personnalisations
      },
      include: [{
        model: CustomizationElement,
        as: 'elements',
        include: [{
          model: DesignImage
        }]
      }]
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Personnalisation non trouvée'
      });
    }

    // Reconstituer la structure attendue par le frontend
    const result = {
      ...customization.toJSON(),
      canvas: customization.canvasInfo,
      elements: customization.elements.map(element => ({
        ...element.elementData,
        id: element.elementId
      }))
    };

    res.json({
      success: true,
      customization: result
    });

  } catch (error) {
    console.error('Error fetching customization:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});

// Dupliquer une personnalisation
router.post('/:id/duplicate', auth, async (req, res) => {
  const transaction = await Customization.sequelize.transaction();

  try {
    const originalCustomization = await Customization.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: CustomizationElement,
        as: 'elements'
      }]
    });

    if (!originalCustomization) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Personnalisation non trouvée'
      });
    }

    // Créer la nouvelle personnalisation
    const newCustomization = await Customization.create({
      productId: originalCustomization.productId,
      colorVariationId: originalCustomization.colorVariationId,
      userId: req.user.id,
      size: originalCustomization.size,
      quantity: originalCustomization.quantity,
      canvasInfo: originalCustomization.canvasInfo,
      totalAmount: originalCustomization.totalAmount,
      status: 'draft'
    }, { transaction });

    // Dupliquer tous les éléments
    for (const element of originalCustomization.elements) {
      const newElementData = { ...element.elementData };
      // Générer un nouvel ID pour l'élément dupliqué
      newElementData.id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await CustomizationElement.create({
        customizationId: newCustomization.id,
        elementId: newElementData.id,
        elementType: element.elementType,
        elementData: newElementData,
        positionX: element.positionX,
        positionY: element.positionY,
        sizeWidth: element.sizeWidth,
        sizeHeight: element.sizeHeight,
        rotation: element.rotation,
        opacity: element.opacity,
        scale: element.scale,
        zIndex: element.zIndex,
        isLocked: element.isLocked,
        isVisible: element.isVisible
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      customizationId: newCustomization.id,
      message: 'Personnalisation dupliquée avec succès'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error duplicating customization:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la duplication'
    });
  }
});

module.exports = router;
```

## Tests

### Tests unitaires avec Jest

```typescript
// __tests__/customization.test.ts
import { customizationService } from '../services/customizationService';
import { CustomizationData } from '../types/customization';

describe('Customization Service', () => {
  const mockCustomizationData: CustomizationData = {
    productId: 1,
    colorVariationId: 1,
    size: 'M',
    quantity: 1,
    designPosition: {
      x: 50,
      y: 50,
      width: 25,
      height: 25,
      rotation: 0,
      opacity: 1,
      scale: 1
    },
    totalAmount: 29.99,
    createdAt: new Date().toISOString()
  };

  test('should save customization successfully', async () => {
    const result = await customizationService.saveCustomization(mockCustomizationData);
    expect(result.success).toBe(true);
    expect(result.customizationId).toBeDefined();
  });
});
```

## Sécurité

### Validation des données
- Toujours valider les coordonnées (0-100%)
- Limiter la taille des images uploadées
- Valider les formats de fichiers
- Sanitization des entrées utilisateur

### Authentification
- Protéger les endpoints avec auth middleware
- Gérer les utilisateurs non connectés avec session_id
- Limiter le nombre de personnalisations par utilisateur

## Performance

### Optimisations
- Cache des positions de design fréquemment utilisées
- Compression des images générées
- Pagination pour les listes de personnalisations
- Indexation appropriée en base de données

### Monitoring
- Tracking des conversions
- Mesure des temps de chargement
- Surveillance des erreurs

## Avantages de l'Architecture Multi-Elements

### 🎯 **Flexibilité maximale**
- **Types multiples** : Design, texte, formes dans la même personnalisation
- **Ordre de superposition** : Gestion du z-index pour des designs complexes
- **Positionnement précis** : Coordonnées en pourcentage pour responsive design
- **Styles riches** : Text shadows, outlines, filtres d'images

### 📊 **Scalabilité backend**
- **Tables optimisées** : Séparation logique entre personnalisations et éléments
- **Requêtes efficaces** : Index sur les colonnes fréquemment utilisées
- **Transactions ACID** : Intégrité des données garanties
- **Support JSON** : Stockage flexible des propriétés complexes

### 🔧 **Maintenance et évolution**
- **Extensibilité** : Ajout facile de nouveaux types d'éléments
- **Versioning** : Possibilité de sauvegarder plusieurs versions d'une personnalisation
- **Templates** : Réutilisation des personnalisations comme modèles
- **Analytics** : Tracking détaillé des éléments utilisés

### 🚀 **Performance**
- **Chargement progressif** : Les éléments peuvent être chargés au besoin
- **Preview asynchrone** : Génération d'images en arrière-plan
- **Cache intelligent** : Mise en cache des éléments fréquemment utilisés
- **Compression** : Optimisation des données avant stockage

### 💡 **Cas d'usage avancés**
- **Designs complexes** : Plusieurs logos, textes et formes sur le même produit
- **Templates de marque** : Réutilisation de designs corporate
- **Personnalisation batch** : Application d'un design sur plusieurs produits
- **A/B testing** : Différentes versions pour tester la conversion

## Conclusion

Cette architecture multi-elements permet de gérer des personnalisations complexes tout en maintenant une excellente performance et une grande flexibilité. Le backend est capable de traiter plusieurs designs, textes et formes dans une même personnalisation, offrant ainsi des possibilités créatives quasi illimitées pour les utilisateurs.

La structure de base de données optimisée, les API robustes et les validations complètes garantissent la sécurité et l'intégrité des données, tout en offrant une expérience utilisateur fluide et professionnelle.