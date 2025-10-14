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
  suggestedPrice: undefined,
  stock: 0,
  status: 'draft',
  description: '',
  categoryId: undefined, // ID de la catégorie sélectionnée
  categories: [], // Garde pour compatibilité mais utilise categoryId maintenant
  designs: [],
  colorVariations: [],
  sizes: [], // Added missing sizes field
  colors: [], // Couleurs disponibles (ex: Noir, Blanc)
  stockBySizeColor: {}, // Stock par taille et couleur
  genre: 'UNISEXE' // ← NOUVEAU: Ajout du champ genre
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
    updateFormData('colorVariations', [...formData.colorVariations, newColor]);
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

    if (formData.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Le stock ne peut pas être négatif';
    }

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
      // Envoyer categoryId au lieu du tableau categories
      console.log(`🔍 [DEBUG] Catégorie sélectionnée (ID):`, formData.categoryId);

      // ✅ GÉNÉRATION DU CHAMP categories (OBLIGATOIRE selon selection.md)
      // Le backend attend un array de strings (noms de catégories)
      const categoriesArray: string[] = [];

      // Construire le array de noms depuis formData.categories (format "Category > SubCategory > Variation")
      if (formData.categories && Array.isArray(formData.categories) && formData.categories.length > 0) {
        // Si categories existe et contient le format UI complet, extraire seulement le nom de la catégorie principale
        const categoryString = formData.categories[0];
        const parts = categoryString.split(' > ').map(p => p.trim());

        // Prendre le premier niveau comme catégorie principale
        if (parts.length > 0 && parts[0]) {
          categoriesArray.push(parts[0]);
          console.log('✅ [DEBUG] Catégorie extraite depuis UI format:', parts[0]);
        }
      } else if (formData.categoryId && availableCategories && availableCategories.length > 0) {
        // Fallback: Trouver le nom de la catégorie depuis categoryId
        const foundCategory = availableCategories.find(cat => cat.id === formData.categoryId);
        if (foundCategory && foundCategory.name) {
          categoriesArray.push(foundCategory.name);
          console.log('✅ [DEBUG] Catégorie extraite depuis categoryId:', foundCategory.name);
        }
      }

      // Validation finale du champ categories
      if (categoriesArray.length === 0) {
        toast.error('❌ Erreur: Au moins une catégorie est requise');
        setLoading(false);
        return false;
      }

      console.log('📋 [DEBUG] Champ categories généré (array de strings):', categoriesArray);

      // Transformer les données du formulaire pour l'API selon la nouvelle documentation
      const apiPayload: CreateProductPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        suggestedPrice: formData.suggestedPrice, // ✅ AJOUTÉ: Champ prix suggéré
        stock: formData.stock,
        status: formData.status,
        // ✅ OBLIGATOIRE: Array de noms de catégories (strings) selon selection.md
        categories: categoriesArray,
        // ✅ CORRECTION: Envoyer les 3 niveaux de catégories selon cate.md
        categoryId: formData.categoryId, // Catégorie principale (level 0)
        subCategoryId: (formData as any).subCategoryId || null, // Sous-catégorie (level 1)
        variationId: (formData as any).variationId || null, // Variation (level 2)
        sizes: normalizeSizes(formData.sizes || []), // Normalized array of strings
        genre: formData.genre || 'UNISEXE', // ← NOUVEAU: Ajout du champ genre
        isReadyProduct: false, // ← NOUVEAU: Force isReadyProduct: false pour les mockups
        colorVariations: formData.colorVariations.map(color => ({
          name: color.name,
          colorCode: color.colorCode,
          // ✅ Envoyer stockBySize comme objet (format backend mockup)
          stockBySize: color.stock || {},
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
        }))
      };

      // Préparer les fichiers
      const files: File[] = [];
      formData.colorVariations.forEach(color => {
        color.images.forEach(image => {
          if (image.file) {
            files.push(image.file);
          }
        });
      });

      console.log('📋 Données préparées pour l\'API:', {
        payload: apiPayload,
        filesCount: files.length
      });
      console.log('🔍 [DEBUG] Genre dans formData:', formData.genre);
      console.log('🔍 [DEBUG] Genre dans apiPayload:', apiPayload.genre);
      console.log('🔍 [DEBUG] Prix suggéré:', formData.suggestedPrice);
      console.log('🔍 [DEBUG] Prix suggéré sera envoyé:', apiPayload.suggestedPrice);
      // ✅ NOUVEAU: Vérifier les 3 niveaux de catégories
      console.log('🏷️ [CATEGORIES] Hiérarchie envoyée:', {
        categoryId: apiPayload.categoryId,
        subCategoryId: apiPayload.subCategoryId,
        variationId: apiPayload.variationId
      });
      console.log('🔍 [DEBUG] Stock par variation (format objet stockBySize):', apiPayload.colorVariations?.map(c => ({
        name: c.name,
        stockBySize: c.stockBySize
      })));

      // Appeler l'API avec le nouveau format
      const result = await ProductService.createProduct(apiPayload, files);

      if (result.success) {
        const createdProduct = result.data;
        console.log('✅ [DEBUG] Produit créé:', createdProduct);

        // ✅ IMPORTANT: Enregistrer les stocks en base de données
        if (createdProduct?.id && formData.colorVariations.length > 0) {
          try {
            // Préparer les stocks pour l'API stockService
            const stocksToSave: { colorId: number; sizeName: string; stock: number }[] = [];

            formData.colorVariations.forEach((color, colorIndex) => {
              // Trouver l'ID de la couleur créée dans la réponse du backend
              const createdColor = createdProduct.colorVariations?.[colorIndex];

              if (createdColor?.id && color.stock) {
                // Pour chaque taille ayant du stock
                Object.entries(color.stock).forEach(([sizeName, stockQty]) => {
                  if (stockQty > 0) {
                    stocksToSave.push({
                      colorId: createdColor.id,
                      sizeName,
                      stock: stockQty
                    });
                  }
                });
              }
            });

            if (stocksToSave.length > 0) {
              console.log('📦 [DEBUG] Enregistrement des stocks:', stocksToSave);
              await updateProductStocks(createdProduct.id, stocksToSave);
              console.log('✅ [DEBUG] Stocks enregistrés avec succès en base de données');
            }
          } catch (stockError) {
            console.error('❌ [ERROR] Erreur lors de l\'enregistrement des stocks:', stockError);
            toast.warning('Produit créé mais erreur lors de l\'enregistrement des stocks');
          }
        }

        toast.success(result.message || 'Produit créé avec succès !');
        setFormData(initialFormData);
        return true;
      } else {
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