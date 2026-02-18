import { useState, useCallback } from 'react';
import { ProductFormData, ProductFormErrors, ColorVariation, ProductImage, ImageView } from '../types/product';
import { ProductService, CreateProductPayload, ProductFile } from '../services/productService';
import { updateProductStocks } from '../services/stockService';
import { useCategories } from '../contexts/CategoryContext';
import { toast } from 'sonner';
import { normalizeSizes, validateSizes } from '../utils/productNormalization';

const initialFormData: ProductFormData = {
  name: '',
  price: 0,
  suggestedPrice: 0, // 🆕 Valeur par défaut obligatoire pour le backend
  stock: 0,
  status: 'published',
  description: '',
  categoryId: undefined, // ID de la catégorie sélectionnée
  categories: [], // Garde pour compatibilité mais utilise categoryId maintenant
  designs: [],
  colorVariations: [],
  sizes: [], // Added missing sizes field
  colors: [], // Couleurs disponibles (ex: Noir, Blanc)
  stockBySizeColor: {}, // Stock par taille et couleur
  genre: 'UNISEXE', // ← NOUVEAU: Ajout du champ genre
  sizePricing: [], // Prix par taille (suggéré, revient)
  useGlobalPricing: false, // Utiliser les mêmes prix pour toutes les tailles
  globalCostPrice: 0, // Prix de revient global
  globalSuggestedPrice: 0 // Prix de vente suggéré global
};

export const useProductForm = () => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Utiliser le contexte des catégories pour la conversion nom -> ID
  const { categories: availableCategories } = useCategories();

  const updateFormData = useCallback(<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    // Debug pour categories
    if (field === 'categories') {
      console.log('🔍 [DEBUG useProductForm updateFormData] Updating categories field with:', value);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // 🔧 Si le genre devient AUTOCOLLANT ou TABLEAU, désactiver automatiquement la gestion de stock
      if (field === 'genre' && (value === 'AUTOCOLLANT' || value === 'TABLEAU')) {
        updated.requiresStock = false;
        console.log(`📦 [AUTO] Genre ${value} détecté → requiresStock défini à false (pas de gestion de stock)`);
      }

      // Debug pour categories
      if (field === 'categories') {
        console.log('🔍 [DEBUG useProductForm updateFormData] New formData will be:', updated);
      }

      return updated;
    });

    // Clear error when field is updated
    if (errors[field as keyof ProductFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const addCategory = useCallback((category: string) => {
    if (!formData.categories.includes(category)) {
      updateFormData('categories', [...formData.categories, category]);
    }
  }, [formData.categories, updateFormData]);

  const removeCategory = useCallback((category: string) => {
    updateFormData('categories', formData.categories.filter(c => c !== category));
  }, [formData.categories, updateFormData]);

  const addDesign = useCallback((design: string) => {
    if (!formData.designs.includes(design)) {
      updateFormData('designs', [...formData.designs, design]);
    }
  }, [formData.designs, updateFormData]);

  const removeDesign = useCallback((design: string) => {
    updateFormData('designs', formData.designs.filter(d => d !== design));
  }, [formData.designs, updateFormData]);

  const addColorVariation = useCallback(() => {
    const newColor: ColorVariation = {
      id: Date.now().toString(),
      name: '',
      colorCode: '#ffffff',
      images: []
    };
    updateFormData('colorVariations', [newColor, ...formData.colorVariations]);
    return newColor.id;
  }, [formData.colorVariations, updateFormData]);

  const updateColorVariation = useCallback((colorId: string, updates: Partial<ColorVariation>) => {
    const updatedColors = formData.colorVariations.map(color =>
      color.id === colorId ? { ...color, ...updates } : color
    );
    updateFormData('colorVariations', updatedColors);
  }, [formData.colorVariations, updateFormData]);

  const removeColorVariation = useCallback((colorId: string) => {
    updateFormData('colorVariations', formData.colorVariations.filter(c => c.id !== colorId));
  }, [formData.colorVariations, updateFormData]);

  const addImageToColor = useCallback((colorId: string, file: File) => {
    const newImage: ProductImage = {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      file,
      view: 'Front',
      delimitations: []
    };

    const updatedColors = formData.colorVariations.map(color =>
      color.id === colorId 
        ? { ...color, images: [...color.images, newImage] }
        : color
    );
    updateFormData('colorVariations', updatedColors);
    return newImage.id;
  }, [formData.colorVariations, updateFormData]);

  const updateImage = useCallback((colorId: string, imageId: string, updates: Partial<ProductImage>) => {
    const updatedColors = formData.colorVariations.map(color => {
      if (color.id === colorId) {
        const updatedImages = color.images.map(image =>
          image.id === imageId ? { ...image, ...updates } : image
        );
        return { ...color, images: updatedImages };
      }
      return color;
    });
    updateFormData('colorVariations', updatedColors);
  }, [formData.colorVariations, updateFormData]);

  // Validation du formulaire
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    // Prix retiré - validation déplacée vers sizePricing (géré dans CategoriesAndSizesPanel)

  
    // ✅ Accepter soit categoryId (ancien système) soit categories (nouveau système)
    // Note: categoryId peut être undefined ici car il est extrait dans handleSubmit AVANT l'appel à submitForm
    const hasCategoryId = formData.categoryId !== undefined && formData.categoryId !== null;
    const hasCategories = formData.categories && formData.categories.length > 0;

    console.log('🔍 [DEBUG VALIDATION] Catégories:', {
      categoryId: formData.categoryId,
      hasCategoryId,
      categories: formData.categories,
      categoriesLength: formData.categories?.length,
      hasCategories
    });

    // ✅ CORRECTION: Accepter si AU MOINS UN des deux systèmes a des données
    if (!hasCategoryId && !hasCategories) {
      newErrors.categories = 'Sélectionnez une catégorie';
      console.log('❌ [DEBUG VALIDATION] Validation échouée: aucune catégorie');
    } else {
      console.log('✅ [DEBUG VALIDATION] Validation passée -', hasCategoryId ? 'via categoryId' : 'via categories array');
    }

    if (formData.colorVariations.length === 0) {
      newErrors.colorVariations = 'Ajoutez au moins une variation de couleur';
    } else {
      formData.colorVariations.forEach((color, index) => {
        if (!color.name.trim()) {
          newErrors[`colorVariations.${index}.name`] = 'Le nom de la couleur est requis';
        }
        if (!color.colorCode) {
          newErrors[`colorVariations.${index}.colorCode`] = 'Le code couleur est requis';
        }
        if (color.images.length === 0) {
          newErrors[`colorVariations.${index}.images`] = 'Ajoutez au moins une image pour cette couleur';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return false;
    }

    setLoading(true);
    try {
      console.log('🚀 [SUBMIT FORM] Début de la soumission du produit...');
      console.log('🔍 [DEBUG] FormData reçu:', {
        name: formData.name,
        categoryId: formData.categoryId,
        subCategoryId: (formData as any).subCategoryId,
        variationId: (formData as any).variationId,
        categories: formData.categories
      });

      // 🔧 CORRECTION CRITIQUE : Utiliser les IDs corrects depuis formData
      // Les IDs devraient déjà être extraits et ajoutés dans ProductFormMain.handleSubmit()
      const categoryId = formData.categoryId ? parseInt(formData.categoryId.toString()) : null;
      const subCategoryId = (formData as any).subCategoryId ? parseInt((formData as any).subCategoryId.toString()) : null;
      const variationId = (formData as any).variationId ? parseInt((formData as any).variationId.toString()) : null;

      console.log('🔧 [NORMALIZATION] IDs parsés:', {
        categoryId,
        subCategoryId,
        variationId,
        types: {
          categoryId: typeof categoryId,
          subCategoryId: typeof subCategoryId,
          variationId: typeof variationId
        }
      });

      // Validation des IDs obligatoires
      if (!categoryId) {
        toast.error('❌ Catégorie requise pour la création du produit');
        setLoading(false);
        return false;
      }

      // ✅ CONSTRUCTION DU PAYLOAD CORRECT selon la documentation API
      const apiPayload: CreateProductPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        suggestedPrice: formData.suggestedPrice,
        stock: formData.stock,
        status: formData.status,

        // ✅ FORMAT CORRECT : IDs pour les catégories
        categoryId: categoryId.toString(), // ← string requis pour compatibilité
        subCategoryId: subCategoryId, // ← nombre entier requis (note: subCategoryId avec 'C' majuscule)

        // ✅ VARIATIONS avec structure correcte
        variations: formData.colorVariations.map(color => ({
          variationId: variationId, // ← ID de la variation (peut être null)
          value: color.name, // ← Nom de la couleur comme valeur
          colorCode: color.colorCode,
          price: formData.price, // ← Prix par défaut
          stock: color.stock && typeof color.stock === 'object'
            ? Object.values(color.stock).reduce((sum: number, qty: any) => sum + (qty || 0), 0)
            : 0,
          images: color.images.map(image => ({
            fileId: image.id,
            view: image.view,
            delimitations: (image.delimitations || []).map(delim => ({
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              rotation: delim.rotation || 0,
              name: delim.name
            }))
          }))
        })),

        // Autres champs
        sizes: normalizeSizes(formData.sizes || []),
        genre: formData.genre || 'UNISEXE',
        isReadyProduct: false // Pour les mockups admin
      };

      // Supprimer les anciens champs qui ne sont plus nécessaires
      // Note: ces champs n'existent plus dans le nouvel interface CreateProductPayload

      console.log('🎯 [SUBMIT FORM] Payload final pour création:', {
        name: apiPayload.name,
        categoryId: apiPayload.categoryId,
        subCategoryId: apiPayload.subCategoryId,
        hasVariations: apiPayload.variations?.length > 0,
        variationsCount: apiPayload.variations?.length || 0,
        genre: apiPayload.genre
      });

      console.log('🏷️ [CATEGORIES] Hiérarchie CORRIGÉE envoyée:', {
        categoryId: apiPayload.categoryId,     // ✅ Nombre entier
        subCategoryId: apiPayload.subCategoryId, // ✅ Nombre entier
        variationId: variationId                // ✅ Nombre entier (si applicable)
      });

      // Préparer les fichiers
      const files: File[] = [];
      formData.colorVariations.forEach(color => {
        color.images.forEach(image => {
          if (image.file) {
            files.push(image.file);
          }
        });
      });

      console.log('📋 [SUBMIT FORM] Données préparées pour l\'API:', {
        payloadName: apiPayload.name,
        filesCount: files.length,
        variationsCount: apiPayload.variations?.length || 0
      });

      // Appeler l'API avec le format corrigé
      const result = await ProductService.createProduct(apiPayload, files);

      if (result.success) {
        const createdProduct = result.data;
        console.log('✅ [SUBMIT FORM] Produit créé avec succès:', createdProduct);

        // Vérifier que les catégories sont correctement liées
        console.log('🏷️ [SUBMIT FORM] Vérification des catégories dans le produit créé:', {
          productId: createdProduct.id,
          categoryId: createdProduct.categoryId,
          subCategoryId: createdProduct.subCategoryId,
          categoryName: createdProduct.category?.name,
          subCategoryName: createdProduct.subCategory?.name
        });

        toast.success('Produit créé avec succès !');
        setFormData(initialFormData);
        return true;
      } else {
        console.error('❌ [SUBMIT FORM] Erreur lors de la création:', result.error);
        const errorMessage = ProductService.handleApiError(new Error(result.error || 'Erreur inconnue'));
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      const errorMessage = ProductService.handleApiError(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, availableCategories]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    loading,
    updateFormData,
    addCategory,
    removeCategory,
    addDesign,
    removeDesign,
    addColorVariation,
    updateColorVariation,
    removeColorVariation,
    addImageToColor,
    updateImage,
    validateForm,
    submitForm,
    resetForm
  };
}; 