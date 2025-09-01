import React, { useState, useCallback } from 'react';
import { SmartColorImageUploader } from './SmartColorImageUploader';
import { colorManagementService } from '../services/colorManagementService';

export const ProductFormMain = ({ product }) => {
  const [productData, setProductData] = useState(product);

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
      </section>
    </div>
  );
}; 