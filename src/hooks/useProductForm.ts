import { useState, useCallback } from 'react';
import { ProductFormData, ProductFormErrors, ColorVariation, ProductImage, ImageView } from '../types/product';
import { ProductService, CreateProductPayload, ProductFile } from '../services/productService';
import { useCategories } from '../contexts/CategoryContext';
import { toast } from 'sonner';

const initialFormData: ProductFormData = {
  name: '',
  price: 0,
  suggestedPrice: undefined,
  stock: 0,
  status: 'draft',
  description: '',
  categories: [],
  designs: [],
  colorVariations: [],
  sizes: [], // Added missing sizes field
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
      colorCode: '#000000',
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

    if (formData.categories.length === 0) {
      newErrors.categories = 'Sélectionnez au moins une catégorie';
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
      // Plus besoin de conversion - on envoie directement les noms de catégories
      console.log(`🔍 [DEBUG] Catégories du formulaire:`, formData.categories);

      // Transformer les données du formulaire pour l'API selon la nouvelle documentation
      const apiPayload: CreateProductPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        status: formData.status,
        categories: formData.categories, // Directement les noms (pas de conversion en IDs)
        sizes: formData.sizes || [], // Array de strings
        genre: formData.genre || 'UNISEXE', // ← NOUVEAU: Ajout du champ genre
        isReadyProduct: false, // ← NOUVEAU: Force isReadyProduct: false pour les mockups
        colorVariations: formData.colorVariations.map(color => ({
          name: color.name,
          colorCode: color.colorCode,
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
      console.log('🔍 [DEBUG] Genre sera envoyé:', formData.genre || 'UNISEXE');

      // Appeler l'API avec le nouveau format
      const result = await ProductService.createProduct(apiPayload, files);
      
      if (result.success) {
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