import React, { useState, useCallback } from 'react';
import { SmartColorImageUploader } from './SmartColorImageUploader';
import { colorManagementService } from '../services/colorManagementService';
import { fetchCategoryVariations, updateProductCategories } from '../services/categoryAdminService';

export const ProductFormMain = ({ product }) => {
  const [productData, setProductData] = useState(product);
  const [categoryId, setCategoryId] = useState(product.categoryId || null);
  const [subCategoryId, setSubCategoryId] = useState(product.subCategoryId || null);
  const [variationId, setVariationId] = useState(product.variationId || null);
  const [variations, setVariations] = useState([]);
  const [savingCats, setSavingCats] = useState(false);

  // Gestionnaire d'upload d'image
  const handleImageUploaded = useCallback((uploadedImage, colorVariation) => {
    console.log('🔄 Image uploadée:', uploadedImage, 'pour couleur:', colorVariation);
    
    // Mettre à jour les données du produit
    setProductData(prevProduct => {
      const updatedColorVariations = prevProduct.colorVariations.map(cv => {
        if (cv.id === uploadedImage.colorVariationId) {
          return {
            ...cv,
            images: [...(cv.images || []), uploadedImage]
          };
        }
        return cv;
      });

      return {
        ...prevProduct,
        colorVariations: updatedColorVariations
      };
    });

    // Nettoyer le cache si nécessaire
    colorManagementService.clearCache(product.id);
  }, [product.id]);

  // Gestionnaire pour nouvelle couleur (timestamp)
  const handleNewColorImageUpload = useCallback(async (timestamp, imageFile) => {
    console.log('🎨 Upload pour nouvelle couleur (timestamp):', timestamp);
    
    try {
      const result = await colorManagementService.uploadColorImage(product.id, timestamp, imageFile);
      handleImageUploaded(result.image, { id: result.image.colorVariationId });
    } catch (error) {
      console.error('❌ Erreur upload nouvelle couleur:', error);
    }
  }, [product.id, handleImageUploaded]);

  // Charger les variations dès qu'on change de (sous-)catégorie ou catégorie
  const loadVariations = useCallback(async (sourceCategoryId) => {
    if (!sourceCategoryId) { setVariations([]); return; }
    try {
      const res = await fetchCategoryVariations(sourceCategoryId);
      setVariations(res?.data || []);
    } catch (e) {
      setVariations([]);
    }
  }, []);

  // Quand subCategory change, charger ses variations, sinon celles de category
  React.useEffect(() => {
    loadVariations(subCategoryId || categoryId);
  }, [subCategoryId, categoryId, loadVariations]);

  return (
    <div className="product-form-main">
      <div className="form-header">
        <h1>Édition du Produit</h1>
        <p>Gérez les informations et images de votre produit</p>
      </div>

      {/* Section informations de base */}
      <section className="basic-info-section">
        <h2>Informations de Base</h2>
        <div className="form-group">
          <label htmlFor="product-name">Nom du produit</label>
          <input 
            type="text" 
            id="product-name" 
            defaultValue={productData.name}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product-description">Description</label>
          <textarea 
            id="product-description" 
            defaultValue={productData.description}
            className="form-textarea"
            rows="4"
          />
        </div>
      </section>

      {/* Section upload d'images de couleur */}
      <section className="color-images-section">
        <h2>Images par Couleur</h2>
        <SmartColorImageUploader 
          product={productData}
          onImageUploaded={handleImageUploaded}
        />
      </section>

      {/* Gestionnaire pour nouvelles couleurs */}
      <section className="new-colors-section">
        <h3>Ajouter une Nouvelle Couleur</h3>
        <p>Utilisez cette section pour ajouter des images pour de nouvelles couleurs (utilisera un timestamp temporaire)</p>
        
        <div className="new-color-upload">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files[0];
              if (file) {
                const timestamp = Date.now();
                handleNewColorImageUpload(timestamp, file);
              }
            }}
            id="new-color-upload"
            className="file-input"
          />
          <label 
            htmlFor="new-color-upload"
            className="upload-label"
          >
            Ajouter une image pour nouvelle couleur
          </label>
        </div>
      </section>

      {/* Section actions */}
      <section className="form-actions">
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => {
            console.log('💾 Sauvegarde du produit:', productData);
            // Ici vous pouvez ajouter la logique de sauvegarde
          }}
        >
          Sauvegarder le Produit
        </button>
        
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => {
            colorManagementService.clearCache(product.id);
            console.log('🗑️ Cache nettoyé');
          }}
        >
          Nettoyer le Cache
        </button>

        {/* Sélecteurs dépendants Catégorie / Sous-catégorie / Variation */}
        <div className="mt-6 grid gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select
              className="form-input"
              value={categoryId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setCategoryId(val);
                setSubCategoryId(null);
                setVariationId(null);
              }}
            >
              <option value="">— Sélectionner —</option>
              {(productData.categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sous-catégorie</label>
            <select
              className="form-input"
              value={subCategoryId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSubCategoryId(val);
                setVariationId(null);
              }}
            >
              <option value="">— Sélectionner —</option>
              {/* Placeholder: remplacez par vos sous-catégories selon votre modèle */}
              {(productData.subCategories || []).filter((sc) => !categoryId || sc.parentId === categoryId).map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Variation</label>
            <select
              className="form-input"
              value={variationId || ''}
              onChange={(e) => setVariationId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Sélectionner —</option>
              {variations.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={savingCats}
              onClick={async () => {
                try {
                  setSavingCats(true);
                  await updateProductCategories(product.id, {
                    categoryId: categoryId || null,
                    subCategoryId: subCategoryId || null,
                    variationId: variationId || null,
                  });
                  console.log('✅ Catégories mises à jour');
                } catch (e) {
                  console.error('❌ Erreur de mise à jour des catégories', e);
                } finally {
                  setSavingCats(false);
                }
              }}
            >
              Enregistrer catégories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}; 